const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const db = require("../modules/dbHandler.js"); // Database module
const app = express();
const PORT = 3000;
require("dotenv").config();
const SECRET_KEY = process.env.JWT_SECRET;

app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies


// SQL Queries
const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_calls INT DEFAULT 0
  ) ENGINE=InnoDB;
`;



// Ensure the Users table exists
db.query(CREATE_USERS_TABLE).then(() => {
  console.log("Users table is ready.");
}).catch(err => console.error("Error creating Users table:", err));

// Middleware: Verify JWT token and track API usage
const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;

    // Check API call usage
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

// **User Registration**
app.post("/register", async (req, res) => {
  const { firstName, email, password } = req.body;
  if (!firstName || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO Users (firstName, email, password) VALUES (?, ?, ?)", [firstName, email, hashedPassword]);
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

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true, secure: false });
    res.json({ message: "Login successful" });
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
