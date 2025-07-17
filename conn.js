const mysql = require("mysql");
const util = require("util");

let conn;

function handleConnection() {
  conn = mysql.createConnection({
    host: "boeedsfwvbqgh4rbnrht-mysql.services.clever-cloud.com",
    user: "uoppg4q7cmxqz6om",
    password: "Rk6OamcT8Gn6JqArHM9C",
    database: "boeedsfwvbqgh4rbnrht",
  });

  conn.connect((err) => {
    if (err) {
      console.error("❌ Error connecting to MySQL:", err);
      setTimeout(handleConnection, 2000); // Retry after 2 seconds
    } else {
      console.log("✅ Connected to Clever Cloud MySQL");
    }
  });

  conn.on("error", (err) => {
    console.error("❌ MySQL Error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("🔁 Reconnecting to DB...");
      handleConnection();
    } else {
      throw err;
    }
  });
}

handleConnection();

// Export promisified query
const exe = (...args) => {
  return new Promise((resolve, reject) => {
    if (!conn) return reject("No DB connection.");
    const query = util.promisify(conn.query).bind(conn);
    query(...args)
      .then(resolve)
      .catch(reject);
  });
};

module.exports = exe;
