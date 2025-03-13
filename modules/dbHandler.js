// Load environment variables from the .env file
require("dotenv").config();

const mysql = require("mysql2"); // Import the MySQL library

class DBHandler {
  constructor() {
    this.connection = null; // Initialize the connection as null
    this.connect(); // Establish the database connection on object creation
  }

  connect() {
    // Create a new MySQL connection using environment variables
    this.connection = mysql.createConnection({
      host: process.env.DB_HOST, // Database host
      user: process.env.DB_USER, // Database username
      password: process.env.DB_PASSWORD, // Database password
      database: process.env.DB_NAME, // Database name
      port: 25060, // Custom database port
      ssl: process.env.DB_SSL === 'REQUIRED' ? { rejectUnauthorized: false } : null // Enable SSL if required (ChatGPT)
    });

    // Attempt to connect to the database
    this.connection.connect((err) => {
      if (err) {
        console.error("Database connection failed:", err);
        // Retry connection after 5 seconds in case of failure
        setTimeout(() => this.connect(), 5000);
      } else {
        console.log("Connected to MySQL database");
      }
    });

    // Handle database connection errors
    this.connection.on("error", (err) => {
      console.error("MySQL error:", err);
      // If connection is lost, attempt to reconnect
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        console.log("Reconnecting to database...");
        this.connect();
      } else {
        throw err; // If it's a different error, throw it
      }
    });
  }

  // Execute a query with optional parameters and return a Promise
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (err, results) => {
        if (err) reject(err); // Reject the promise if an error occurs
        else resolve(results); // Resolve with query results
      });
    });
  }
}

// Export a single instance of the DBHandler class
module.exports = new DBHandler();
