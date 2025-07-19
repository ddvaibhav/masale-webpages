const express = require("express");
const bodyparser = require("body-parser");
const upload = require("express-fileupload");
const session = require("express-session");
const path = require("path");
var admin_route = require("./routes/admin.js");
var accountsroute = require("./routes/accounts");
var userroute = require("./routes/user");
var exe = require("./conn.js")




const app = express();

// Static files

app.use(express.static("public/"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));


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

app.use(async (req, res, next) => {
  if (req.url.startsWith('/admin')) {
    try {
      const [row] = await exe(`SELECT COUNT(*) AS unseenCount FROM orders WHERE is_seen = 0`);
      res.locals.unseenCount = row.unseenCount || 0;
    } catch (err) {
      console.error("Error fetching unseen orders:", err);
      res.locals.unseenCount = 0;
    }
  }
  next();
});








// Server
app.listen(1000, () => {
  console.log("Server running at http://localhost:1000");
});
