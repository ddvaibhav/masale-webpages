var express = require("express");
var bodyparser = require("body-parser");
var upload = require("express-fileupload");
var session = require("express-session");
var admin_route = require("./routes/admin.js");
var accountsroute = require("./routes/accounts");
var userroute = require("./routes/user");
var app = express();
app.use(express.static("public/"));

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


app.use("/",userroute);
app.use("/admin", admin_route); 
app.use("/accounts",accountsroute);

app.listen(1000);