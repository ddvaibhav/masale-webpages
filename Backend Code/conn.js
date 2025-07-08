// ✅ conn.js (MySQL connection config)

var mysql = require("mysql");
var util = require("util");

// MySQL connection setup
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "M_project"
});

// Promisify the query for async/await or .then usage
var exe = util.promisify(conn.query).bind(conn);

// Export both connection and exe
module.exports = {
  conn: conn,
  exe: exe
};
