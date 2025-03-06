const express = require("express");
const db = require("../modules/dbHandler.js"); // Import the database handler module
const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

let tableCreating = false;

// Middleware to check if the Patients table exists, create it if not
app.use(async (req, res, next) => {
  try {
    const results = await db.query(GET_TABLE);
    if (results.length === 0 && !tableCreating) {
      tableCreating = true;
      await db.query(CREATE_TABLE);
      console.log("Table Patients created with InnoDB engine.");
      tableCreating = false;
    }
    next();
  } catch (error) {
    console.error("Error checking table existence:", error);
    res.status(500).json({ error: messages.dbError });
  }
});

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// GET route to execute SELECT queries
app.get("/", async (req, res) => {
});

// POST route to insert multiple patients or execute a raw query
app.post("/", async (req, res) => {
  
});

// Handle 404 for unrecognized routes
app.use((req, res) => {
  res.status(404).json({ error: messages.routeNotFound });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
