const express = require("express");
const router = express.Router();
const exe = require("../conn");

// Login check middleware
function checkLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/user/login");
  }
}

//  Registration form
router.get("/registration", function (req, res) {
  res.render("user/registration", { error: null, success: null });
});


//  Registration process
router.post("/register", async function (req, res) {
  const { name, email, password } = req.body;



  // Check if user already exists
  const checkUser = await exe("SELECT * FROM users WHERE email = ?", [email]);

  if (checkUser.length > 0) {
    res.render("user/registration", { error: "Email already exists" });
  } else {
    const insertUser = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    await exe(insertUser, [name, email, password]);
    res.redirect("/user/login");
  }
});

//  Login form
router.get("/login", function (req, res) {
  res.render("user/login", { error: null });
});

//  Login process
router.post("/login_process", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  const result = await exe(sql, [email, password]);

  if (result.length > 0) {
    req.session.user = result[0];
    res.redirect("/user/dashboard");
  } else {
    res.render("user/login", { error: "Invalid credentials" });
  }
});

router.get("/",function(req,res){
  res.render("user/home.ejs")
})


//  Logout
router.get("/logout", function (req, res) {
  req.session.destroy(function () {
    res.redirect("/user/login");
  });
});

module.exports = router;
