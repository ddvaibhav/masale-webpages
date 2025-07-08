// ✅ conn.js (MySQL connection config)
var express = require("express");
var mysql = require("mysql");
var util = require("util");

// MySQL connection setup
var conn = mysql.createConnection({
  host: "boeedsfwvbqgh4rbnrht-mysql.services.clever-cloud.com",
  user: "uoppg4q7cmxqz6om",
  password: "Rk6OamcT8Gn6JqArHM9C",
  database: "boeedsfwvbqgh4rbnrht"
});

// Promisify the query for async/await or .then usage
var exe = util.promisify(conn.query).bind(conn);

// Export both connection and exe
module.exports =  exe;

