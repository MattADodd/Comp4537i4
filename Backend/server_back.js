require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto"); // For generating reset tokens
const db = require("../modules/dbHandler.js"); // Database module
const app = express();
const PORT = 3000;

const SECRET_KEY = process.env.JWT_SECRET;

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
    req.user = decoded;

    const [user] = await db.query("SELECT api_calls FROM Users WHERE id = ?", [decoded.id]);
    if (!user) return res.status(401).json({ error: "User not found" });

    if (user.api_calls >= 20) {
      res.setHeader("X-API-Warning", "API limit reached");
    } else {
      await db.query("UPDATE Users SET api_calls = api_calls + 1 WHERE id = ?", [decoded.id]);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Admin Middleware
const authenticateAdmin = async (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
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
    res.status(400).json({ error: "Email already in use" });
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
    res.cookie("token", token, { httpOnly: true, secure: false });
    res.json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **View API Calls (User Dashboard)**
app.get("/dashboard", authenticateUser, async (req, res) => {
  try {
    const [user] = await db.query("SELECT api_calls FROM Users WHERE id = ?", [req.user.id]);
    res.json({ api_calls: user.api_calls });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Admin View API Usage**
app.get("/admin/api-usage", authenticateUser, authenticateAdmin, async (req, res) => {
  try {
    const users = await db.query("SELECT id, firstName, email, api_calls FROM Users");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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
