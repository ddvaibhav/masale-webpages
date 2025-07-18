var express = require("express");
var bodyparser = require("body-parser");
var upload = require("express-fileupload");
var session = require("express-session");
var admin_route = require("./routes/admin.js");
var accountsroute = require("./routes/accounts");
var userroute = require("./routes/user");
var exe = require("./conn.js")
var app = express();
app.use(express.static("public/"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));


app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use(bodyparser.urlencoded({extended:true}));
app.use(session({
    secret:"kjdjdjdjdded",
    resave:true,
    saveUninitialized:true
}))

app.use(upload());

app.use(function (req, res, next) {
  res.locals.admin = req.session.admin;
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

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




app.use("/",userroute);
app.use("/admin", admin_route); 
app.use("/accounts",accountsroute);

app.listen(1000);