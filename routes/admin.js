var express = require("express");
var router = express.Router();
// var db = require("../conn");
var exe = require("../conn.js");

// ✅ Middleware
function verifylogin(req, res, next) {
    if (req.session.admin == undefined) {
        res.redirect("/admin/login");
    } else {
        next();
    }
}

// Login Page
router.get("/login", function (req, res) {
    res.render("admin/login.ejs", { error: null });
});

// Login Process
router.post("/login_process", async function (req, res) {
    var d = req.body;
    var sql = `SELECT * FROM admin WHERE admin_email = ? AND admin_pass = ?`
    var result = await exe(sql, [d.email, d.password]);

    if (result.length > 0) {
        req.session.admin = result[0];
        res.redirect("/admin/");
    } else {
        res.render("admin/login.ejs", { error: "Invalid Email or Password" });
    }
});

// Dashboard Page (protected)
router.get("/", verifylogin, function (req, res) {
    res.render("admin/dashboard.ejs");
});

// Profile Page (protected)
router.get("/profile", verifylogin, function (req, res) {
    res.render("admin/profile.ejs", { admin: req.session.admin });
});

// Products Page (protected)
router.get("/products", verifylogin, async function (req, res) {
    var sql = `SELECT * FROM products`;
    var products = await exe(sql);
    res.render("admin/products.ejs", { products });
});

// Add Product Page (protected)
router.get("/add_product", verifylogin, function (req, res) {
    res.render("admin/add_product.ejs");
});





// Add Product Process (protected)
router.post("/add_products", verifylogin, async function (req, res) {
    var d = req.body;
 var file_name1 = "";
var file_name2 = "";

// जर image1 असेल
if (req.files && req.files.image1) {
  file_name1 = Date.now() + "_1_" + req.files.image1.name;
  req.files.image1.mv("public/uploads/products/" + file_name1);
} else {
  file_name1 = ""; // किंवा DB मधून existing image1
}

// जर image2 असेल
if (req.files && req.files.image2) {
  file_name2 = Date.now() + "_2_" + req.files.image2.name;
  req.files.image2.mv("public/uploads/products/" + file_name2);
} else {
  file_name2 = ""; // किंवा DB मधून existing image2
}


    var dis = (d.selling_price * d.discount) / 100;
    var afterDis = d.selling_price - dis;
    var gst = (afterDis * d.gst) / 100;
    var final = parseFloat(afterDis + gst).toFixed(2);

    var q = `INSERT INTO products 
(name, 
code, 
category, 
subcategory, 
brand, 
unit, 
stock, 
cost_price,
selling_price, 
discount, 
gst, 
final_price, 
expiry, 
status, 
featured, 
short_desc, 
long_desc, 
frant_image,
back_image) 
VALUES 
('${d.name}',
'${d.code}',
'${d.category}', 
'${d.subcategory}',
'${d.brand}', 
'${d.unit}',
'${d.stock}',
'${d.cost_price}',
'${d.selling_price}',
'${d.discount}', 
'${d.gst}', 
'${final}',
'${d.expiry}', 
'${d.status}',
'${d.featured}', 
'${d.short_desc}', 
'${d.long_desc}',
'${file_name1}',
'${file_name2}')`;

    var result = await exe(q);
    res.redirect("/admin/add_product");
});

router.get("/admin/products", async (req, res) => {
  var products = await exe("SELECT * FROM products");
  res.render("admin/product.ejs", { products });
  
});

router.get("/edit_product/:id",async function (req, res) {
    var id = req.params.id;
    var sql = `SELECT * FROM products WHERE id = ?`;
    var product = await exe(sql, [id]);
    res.render("admin/edit_product.ejs", { product: product[0] });
}); 




router.post("/update_product", async function (req, res) {
  var d = req.body;
  var file_name = null;

  // ✅ प्रथम जुनं image fetch कर
var oldData = await exe(`SELECT frant_image FROM products WHERE id = ${d.id}`);
var oldImage = oldData.length > 0 ? oldData[0].frant_image : "";

  // ✅ image check करून file_name ठरव
let file_name1 = "";
let file_name2 = "";

if (req.files && req.files.image1 && req.files.image1.name) {
  file_name1 = Date.now() + "_1_" + req.files.image1.name;
  await req.files.image1.mv("public/uploads/products/" + file_name1);
} else {
  file_name1 = req.body.oldImage1;
}

// image2 handle
if (req.files && req.files.image2 && req.files.image2.name) {
  file_name2 = Date.now() + "_2_" + req.files.image2.name;
  await req.files.image2.mv("public/uploads/products/" + file_name2);
} else {
  file_name2 = req.body.oldImage2;
}

  var dis = (d.selling_price * d.discount) / 100;
  var afterDis = d.selling_price - dis;
  var gst = (afterDis * d.gst) / 100;
  var final = parseFloat(afterDis + gst).toFixed(2);

  var q = `UPDATE products SET
    name = '${d.name}',
    code = '${d.code}',
    category = '${d.category}',
    subcategory = '${d.subcategory}',
    brand = '${d.brand}',
    unit = '${d.unit}',
    stock = '${d.stock}',
    cost_price = '${d.cost_price}',
    selling_price = '${d.selling_price}',
    discount = '${d.discount}',
    gst = '${d.gst}',
    final_price = '${final}',
    expiry = '${d.expiry}',
    status = '${d.status}',
    featured = '${d.featured}',
    short_desc = '${d.short_desc}',
    long_desc = '${d.long_desc}',
    frant_image = '${file_name1}',
    back_image = '${file_name2}'
    WHERE id = ${d.id}`;

  await exe(q);
  res.redirect("/admin/products");
});

// DELETE Product route
router.get("/delete/:id", async function (req, res){
    var id = req.params.id;

    var q = `DELETE FROM products WHERE id = ${id}`;
    await exe(q);
    res.redirect("/admin/products"); // Delete नंतर पुन्हा प्रोडक्ट यादीकडे
});


router.get("/users", async function (req, res){
  const q = "SELECT * FROM users ORDER BY id DESC";
  const users = await exe(q);
  res.render("admin/users.ejs", { users });
});

router.get("/edit_user/:id", async function (req, res){
    const id = req.params.id;
    const [data] = await exe("SELECT * FROM users WHERE id = ?", [id]);

    res.render("admin/edit_user.ejs", { user: data });
});

router.post("/update", async function (req, res) {
    const d = req.body;

    const q = `
        UPDATE users SET
            name = ?,
            email = ?,
            phone = ?,
            gender = ?,
            dob = ?,
            address = ?,
            status = ?
        WHERE id = ?`;

    await exe(q, [
        d.name,
        d.email,
        d.phone,
        d.gender,
        d.dob,
        d.address,
        d.status,
        d.id
    ]);

    res.redirect("/admin/users");
});

router.get("/delete_user/:id", async (req, res) => {
    const id = req.params.id;

    const q = "DELETE FROM users WHERE id = ?";
    await exe(q, [id]);

    res.redirect("/admin/users");
});

// 📁 routes/admin.js

router.get("/all-orders", verifylogin, async function (req, res) {
  let orders = await exe("SELECT * FROM orders ORDER BY id DESC");
  res.render("/admin/all_orders.ejs", { orders });
});


// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin/login");
    });
});

module.exports = router;
