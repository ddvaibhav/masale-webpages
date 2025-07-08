const express = require("express");
const router = express.Router();
const db = require("../conn");
const exe = db.exe;

// Login Page
router.get("/login", (req, res) => {
  res.render("admin/login", { error: null }); // ✅ error देणं आवश्यक
});

// Login Process
router.post("/login_process", async (req, res) => {
  const { email, password } = req.body;
  const result = await exe("SELECT * FROM admin WHERE admin_email = ? AND admin_pass = ?", [email, password]);

  if (result.length > 0) {
    req.session.admin = result[0];
    res.redirect("/admin/");
  } else {
    res.render("admin/login", { error: "Invalid Email or Password" });
  }
});

// Dashboard Page
router.get("/", (req, res) => {
  // if (!req.session.admin) return res.redirect("/admin/login");
  res.render("admin/dashboard");
});

// Profile Page
router.get("/profile", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");
  res.render("admin/profile", { admin: req.session.admin });
});

router.get("/products",function(req,res){
  res.render("admin/products.ejs",{ admin: req.session.admin })
})
router.get("/add_product",function(req,res){
  res.render("admin/add_product.ejs")
})

router.post("/add",function(req,res){
  var sql = ""
})

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
