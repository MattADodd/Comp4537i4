/**
 * Load environment variables from .env file
 */
require("dotenv").config();

/**
 * Import required dependencies
 */
const express = require("express");
const cors = require('cors'); // Import CORS to handle cross-origin requests
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require("jsonwebtoken"); // For handling JSON Web Tokens (JWT)
const cookieParser = require("cookie-parser"); // For parsing cookies in requests
const crypto = require("crypto"); // For generating secure reset tokens
const db = require("../modules/dbHandler.js"); // Database module for interacting with the database
const axios = require("axios"); // For making HTTP requests to external APIs like Hugging Face
const app = express(); // Initialize Express app
const PORT = 3000; // Port where the server will run
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const nodemailer = require("nodemailer");

/**
 * Swagger API Documentation configuration
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Audio Book API",
      version: "1.0.0",
      description: "API for AI Audio Book generation",
    },
    servers: [
      { url: "https://whale-app-2-zoykf.ondigitalocean.app/", description: "Backend server" },
      { url: "https://comp4537i4.vercel.app", description: "Frontend server" }
    ]
  },
  apis: ["./Backend/server.js", "./Frontend/*.js"],
};

// Initialize Hugging Face client
const { InferenceClient } = require('@huggingface/inference');

/**
 * Hugging Face API Client
 */
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

/**
 * JWT Secret Key
 */
const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Middleware to handle CORS preflight requests
 */
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://comp4537i4.vercel.app"); // Allow frontend to make requests
  res.header("Access-Control-Allow-Credentials", "true"); // Allow cookies in CORS requests
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT"); // Allow necessary HTTP methods
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow necessary headers
  res.sendStatus(204); // No content response
});
console.log("Server starting...")

/**
 * Middleware setup
 */
app.use(cors({
  origin: [
    "http://localhost:5500",   // Allow localhost requests for development
    "http://127.0.0.1:5500",
    "https://comp4537i4.vercel.app",
    "https://d496-2604-3d08-6579-c800-19a1-7955-3377-26c3.ngrok-free.app"    // Allow requests from production frontend
  ],
  methods: ["GET", "POST", "DELETE", "PUT"], // Allow only GET | POST | DELETE | PUT requests
  credentials: true, // Allow cookies to be sent along with requests
  allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"], // Allow necessary headers
}));

// Middleware to parse JSON request bodies
app.use(express.json()); 

// Middleware to parse cookies in requests
app.use(cookieParser()); 

/**
 * SQL Queries to create necessary database tables
 */
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

const CREATE_API_TABLE = `
CREATE TABLE IF NOT EXISTS API_Usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    requests INT DEFAULT 1,
    UNIQUE KEY unique_api (method, endpoint)
)`;


/**
 * Execute table creation queries
 */
db.query(CREATE_USERS_TABLE).then(() => {
  console.log("Users table is ready.");
}).catch(err => console.error("Error creating Users table:", err));

db.query(CREATE_API_TABLE).then(() => {
  console.log("API table is ready.");
}).catch(err => console.error("Error creating API table:", err));

/**
 * Middleware to log and update API usage
 */
app.use(async (req, res, next) => {
  
  const method = req.method;
  const endpoint = req.originalUrl;
  console.log("API Usage Middleware: ", method, endpoint); 

  
  try {
    const query = `
      INSERT INTO API_Usage (method, endpoint, requests)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE requests = requests + 1;
    `;
    await db.query(query, [method, endpoint]);
    next();  // Continue to the next middleware/route
  } catch (error) {
    console.error("Error updating API usage:", error);
    next();  // Proceed even if there's an error
  }
});


/**
 * Middleware to authenticate users via JWT
 */
const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token; // Get JWT token from cookies
  if (!token) return res.status(401).json({ error: "Unauthorized" }); // If no token, unauthorized

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Verify JWT
    const [user] = await db.query("SELECT id, api_calls FROM Users WHERE id = ?", [decoded.id]);

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = { id: user.id, api_calls: user.api_calls, is_admin: decoded.is_admin }; // Attach user data to request object

    // Check if API call limit is reached
    if (user.api_calls >= 20) {
      res.setHeader("X-API-Warning", "API limit reached");
    } else {
      await db.query("UPDATE Users SET api_calls = api_calls + 1 WHERE id = ?", [user.id]); // Increment API call count
    }

    next(); // Move to next middleware/route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" }); // Invalid token error
  }
};

/**
 * Middleware to authenticate admins via JWT
 */
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.token; // Get JWT token from cookies
  const decoded = jwt.verify(token, SECRET_KEY); // Verify JWT

  if (!decoded.is_admin) {
    return res.status(403).json({ error: "Access denied" }); // If not admin, deny access
  }
  next(); // Move to next middleware/route handler
};


/**
 * Setup Swagger Documentation
 */
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// **User Registration Route**
app.post("/register", async (req, res) => {
  const { firstName, email, password, isAdmin } = req.body;
  if (!firstName || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    // Insert new user into the database
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

/**
 * User Login Route
 * @route POST /login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user credentials
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const [user] = await db.query("SELECT * FROM Users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password); // Compare provided password with hashed password
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, SECRET_KEY, { expiresIn: "1h" });
    // Set token in cookie for subsequent requests
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Max-Age=3600; Path=/; SameSite=None; Secure`);
    res.json({ message: "Login successful", token, is_admin: user.is_admin }); // Send success response with token
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * User Dashboard Route
 * @route GET /dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get("/dashboard", async (req, res) => {
  const token = req.cookies.token; // Get JWT token from cookies
  const decoded = jwt.verify(token, SECRET_KEY); // Verify JWT
  try {
    const [user] = await db.query("SELECT api_calls FROM Users WHERE id = ?", [decoded.id]);
    res.json({ api_calls: user.api_calls }); // Return the user's API call count
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Admin API Usage Data Route
 * @route GET /admin/api-data
 * @middleware authenticateAdmin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get("/admin/api-data", authenticateAdmin, async (req, res) => {
  try {
    // Fetch API stats and user consumption data
    const userStats = await db.query("SELECT id, firstName, email, api_calls FROM Users");
    
    res.json({userStats }); // Return stats as JSON
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/admin/api-stats', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT method, endpoint, requests
      FROM API_Usage
      ORDER BY requests DESC;
    `;
    const results = await db.query(query);
    res.json({ apiStats: results });
  } catch (error) {
    console.error('Error fetching API stats:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * AI Response Route
 * @route GET /ai-response
 * @middleware authenticateUser
 * @param {Object} req - Express request object
 * @param {string} req.query.prompt - User's input prompt
 * @param {Object} res - Express response object
 */
app.get("/ai-response", authenticateUser, async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);  // 5 minutes timeout
  const model = "deepseek-r1:1.5b";

  try {
    const response = await fetch("https://d496-2604-3d08-6579-c800-19a1-7955-3377-26c3.ngrok-free.app/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ model, prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`AI server error: ${response.statusText}`);
    }
    const text = await response.text(); // Read full NDJSON response
  console.log("Raw response:", text);

  // Parse NDJSON and extract message
  const fullMessage = text
    .trim()
    .split("\n") // Each line is a separate JSON object
    .map(line => JSON.parse(line).response) // Extract "response" field
    .join(""); // Combine into a single message

  console.log("Full message:", fullMessage);

  return res.status(200).json({ answer: fullMessage });
  } catch (err) {
    clearTimeout(timeoutId);  // Ensure timeout is cleared in case of failure
    console.error("AI request failed:", err.message);
    return res.status(500).json({ error: "AI service unavailable" });
  }
});

/**
 * Admin Delete User Route
 * @route DELETE /admin/delete-user/:id
 * @middleware authenticateAdmin
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID
 * @param {Object} res - Express response object
 */
app.delete("/admin/delete-user/:id", authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // First check if user exists
    const [user] = await db.query("SELECT id FROM Users WHERE id = ?", [userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Then delete
    const result = await db.query("DELETE FROM Users WHERE id = ?", [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No user was deleted" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Detailed error deleting user:", error);
    res.status(500).json({ 
      error: "Failed to delete user",
      details: error.message // Send more detailed error to client for debugging
    });
  }
});

/**
 * Admin Update User Route
 * @route PUT /admin/update-user/:id
 * @middleware authenticateAdmin
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Fields to update (firstName, email, api_calls, is_admin)
 * @param {Object} res - Express response object
 */
app.put("/admin/update-user/:id", authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, email, api_calls, is_admin } = req.body;

    // Validate at least one field is being updated
    if (!firstName && !email && api_calls === undefined && is_admin === undefined) {
      return res.status(400).json({ error: "No fields to update provided" });
    }

    // Build the dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) {
      updateFields.push("firstName = ?");
      updateValues.push(firstName);
    }
    
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    
    if (api_calls !== undefined) {
      updateFields.push("api_calls = ?");
      updateValues.push(api_calls);
    }
    
    if (is_admin !== undefined) {
      updateFields.push("is_admin = ?");
      updateValues.push(is_admin);
    }

    updateValues.push(userId); // Add userId for WHERE clause

    const query = `UPDATE Users SET ${updateFields.join(", ")} WHERE id = ?`;
    
    // Execute the update
    const result = await db.query(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found or no changes made" });
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Email already in use" });
    }
    
    res.status(500).json({ 
      error: "Failed to update user",
      details: error.message 
    });
  }
});

// **Forgot Password Route**
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const [user] = await db.query("SELECT id FROM Users WHERE email = ?", [email]);
    if (!user) return res.status(404).json({ error: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex"); // Generate reset token
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiry

    // Store the token and expiry in the database
    await db.query(
      "UPDATE Users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [resetToken, expiryTime, email]
    );

    const resetLink = `https://comp4537i4.vercel.app/Frontend/reset-password.html?token=${resetToken}`;

    // **Send Email**
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tdnreport@gmail.com", // Replace with your email
        pass: "dwox lnui eyka jrxu", // Use an app password if needed
      },
    });

    const mailOptions = {
      from: "tdnreport@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetLink}\nThis link is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset email sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// **Reset Password Route**
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });

  try {
    const [user] = await db.query("SELECT id FROM Users WHERE reset_token = ? AND reset_token_expiry > NOW()", [token]);
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password

    // Update the user's password and clear the reset token
    await db.query("UPDATE Users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?", [hashedPassword, user.id]);

    res.json({ message: "Password successfully reset" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// // **Logout Route** - Clears the cookie with the JWT token
// app.post("/logout", (req, res) => {
//   res.clearCookie("token"); // Clear the token cookie
//   res.json({ message: "Logged out successfully" });
// });

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
