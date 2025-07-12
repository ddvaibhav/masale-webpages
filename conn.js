var mysql = require("mysql");
var util = require("util");
var conn = mysql.createConnection({
   host:"boeedsfwvbqgh4rbnrht-mysql.services.clever-cloud.com",
   user:"uoppg4q7cmxqz6om",
   password:"Rk6OamcT8Gn6JqArHM9C",
   database:"boeedsfwvbqgh4rbnrht" 
});
 var exe = util.promisify(conn.query).bind(conn);

 module.exports = exe;