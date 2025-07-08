var express = require("express");
var session = require("express-session");
var bodyparser = require("body-parser");
var path = require("path");

var app = express();

// Middleware setup
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

// Home page
// app.get("/", function (req, res) {
//   res.render("home");
// });

// Server start
app.listen(1000, function () {
  console.log("Server started on http://localhost:1000");
});
