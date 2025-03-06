const express = require("express");
const db = require("../modules/dbHandler.js"); // Import the database handler module
const { messages } = require("../lang/messages/en/messages.js");

const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

const GET_TABLE = "SHOW TABLES LIKE 'Patients'";
const CREATE_TABLE = `
  CREATE TABLE Patients (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(100) NOT NULL,             
    dateOfBirth DATE NOT NULL               
  ) ENGINE=InnoDB;                          
`;

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
app.get("/api/v1/sql/:query", async (req, res) => {
  const sqlQuery = decodeURIComponent(req.params.query);
  if (!sqlQuery.toUpperCase().startsWith("SELECT")) {
    return res.status(404).json({ error: messages.selectOnly });
  }
  try {
    const results = await db.query(sqlQuery);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST route to insert multiple patients or execute a raw query
app.post("/api/v1/sql/", async (req, res) => {
  try {
    const patients = req.body;
    if (!Array.isArray(patients) || !patients.every(p => p.name && p.dateOfBirth)) {
      if (patients.query) {
        await db.query(patients.query);
        return res.status(201).json({ message: messages.success });
      }
      return res.status(400).json({ error: "Invalid patient data." });
    }
    
    const values = patients.flatMap(p => [p.name, p.dateOfBirth]);
    const placeholders = patients.map(() => "(?, ?)").join(", ");
    const sql = `INSERT INTO Patients (name, dateOfBirth) VALUES ${placeholders}`;
    
    const result = await db.query(sql, values);
    const insertedIdsStart = result.insertId;
    const insertedPatients = patients.map((p, index) => ({
      id: insertedIdsStart + index,
      name: p.name,
      dateOfBirth: p.dateOfBirth,
    }));
    
    res.status(201).json({ message: messages.success, patients: insertedPatients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle 404 for unrecognized routes
app.use((req, res) => {
  res.status(404).json({ error: messages.routeNotFound });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
