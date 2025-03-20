require("dotenv").config();
const express = require("express");
const cors = require('cors'); // Import CORS

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto"); // For generating reset tokens
const db = require("../modules/dbHandler.js"); // Database module
const axios = require("axios"); // For making requests to Hugging Face API
const app = express();
const PORT = 3000;
const { InferenceClient } = require('@huggingface/inference');
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const SECRET_KEY = process.env.JWT_SECRET;

// Preflight (OPTIONS) request handling
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://comp4537i4.vercel.app"); // Match frontend
  res.header("Access-Control-Allow-Credentials", "true"); // Allow cookies
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow necessary methods
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow necessary headers
  res.sendStatus(204); // No content response
});

// CORS Middleware
app.use(cors({
  origin: [
    "http://localhost:5500",   // For localhost
    "http://127.0.0.1:5500",
    "https://comp4537i4.vercel.app"    // For 127.0.0.1
  ], // Allow requests from your frontend
  methods: ["GET", "POST"], // Only allow needed methods
  credentials: true, // Allow cookies (important for credentials)
  allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
}));

app.use(express.json()); 
app.use(cookieParser()); 

// Create Users table if not exists
const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_calls INT DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME
  ) ENGINE=InnoDB;
`;

db.query(CREATE_USERS_TABLE).then(() => {
  console.log("Users table is ready.");
}).catch(err => console.error("Error creating Users table:", err));

// Middleware: Verify JWT and track API usage
const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const [user] = await db.query("SELECT id, api_calls FROM Users WHERE id = ?", [decoded.id]);

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = { id: user.id, api_calls: user.api_calls, is_admin: decoded.is_admin };

    if (user.api_calls >= 20) {
      res.setHeader("X-API-Warning", "API limit reached");
    } else {
      await db.query("UPDATE Users SET api_calls = api_calls + 1 WHERE id = ?", [user.id]);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Admin Middleware
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, SECRET_KEY);

  if (!decoded.is_admin) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

// **User Registration**
app.post("/register", async (req, res) => {
  const { firstName, email, password, isAdmin } = req.body;
  if (!firstName || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO Users (firstName, email, password, is_admin) VALUES (?, ?, ?, ?)",
      [firstName, email, hashedPassword, isAdmin || false]
    );
    res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Database Error:", err);  // Log the actual error
      res.status(500).json({ error: "Server error. Please try again later." });
    }
});

// **User Login**
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const [user] = await db.query("SELECT * FROM Users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, SECRET_KEY, { expiresIn: "1h" });
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Max-Age=3600; Path=/; SameSite=None; Secure`);
    res.json({ message: "Login successful", token, is_admin: user.is_admin }); // Include is_admin in the response
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **View API Calls (User Dashboard)**
app.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, SECRET_KEY);
  try {
    const [user] = await db.query("SELECT api_calls FROM Users WHERE id = ?", [decoded.id]);
    res.json({ api_calls: user.api_calls });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Admin View API Usage**
// Endpoint to fetch API stats and user consumption data
app.get("/admin/api-data", authenticateAdmin, async (req, res) => {
  try {
    // Fetch user API consumption stats
    const userStats = await db.query("SELECT id, firstName, email, api_calls FROM Users");

    // Return the data as JSON
    res.json({ userStats });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/ai-response", authenticateUser, async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const chatCompletion = await client.chatCompletion({
      model: "deepseek-ai/DeepSeek-R1",
      messages: [
        {
          role: "user",
          content: "please tell me a story about" + prompt
        }
      ],
      provider: "together",
      max_tokens: 20,
    });
    let answer = chatCompletion.choices[0].message;
    return res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **Forgot Password**
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const [user] = await db.query("SELECT id FROM Users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      "UPDATE Users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [resetToken, expiryTime, email]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`Password reset link: ${resetLink}`);

    res.json({ message: "Password reset email sent. Check console for link." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Reset Password**
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });

  try {
    const [user] = await db.query("SELECT id FROM Users WHERE reset_token = ? AND reset_token_expiry > NOW()", [token]);
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE Users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?", [hashedPassword, user.id]);

    res.json({ message: "Password successfully reset" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Protected Route (Example API Call)**
app.get("/data", authenticateUser, async (req, res) => {
  res.json({ message: "Here is your protected data", user: req.user });
});

// **Logout**
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// **Start Server**
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
