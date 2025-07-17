const express = require("express");
const bodyparser = require("body-parser");
const upload = require("express-fileupload");
const session = require("express-session");
const path = require("path");

const admin_route = require("./routes/admin.js");
const accountsroute = require("./routes/accounts");
const userroute = require("./routes/user"); // ✅ use this one only

const app = express();

// Static files

app.use(express.static("public"));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({
  secret: "kjdjdjdjdded",
  resave: true,
  saveUninitialized: true
}));
app.use(upload());

// Global session variable
app.use((req, res, next) => {
  res.locals.admin = req.session.admin;
  res.locals.user = req.session.user;
  next();
});

// ✅ Routes
app.use("/", userroute);         // frontend site (e.g., index.ejs)
app.use("/admin", admin_route);  // admin routes
app.use("/accounts", accountsroute); // login/register

// Server
app.listen(1000, () => {
  console.log("Server running at http://localhost:1000");
});
