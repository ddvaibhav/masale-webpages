var express = require("express");
var session = require("express-session");
var bodyparser = require("body-parser");
var fileUpload = require("express-fileupload");
var path = require("path");

var app = express();

// Middleware setup
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(fileUpload());

app.use(session({
  secret: "mysecretkey",
  resave: false,
  saveUninitialized: true
}));

// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");

app.use("/admin", adminRoutes);
app.use("/", userRoutes);



// Server start
app.listen(1000);
