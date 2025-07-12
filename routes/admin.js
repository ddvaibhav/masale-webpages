var express = require("express");
var exe = require("../conn");
var router = express.Router();
const  authMiddleware = require("./authMiddleware");


router.get("/",authMiddleware,async function(req,res){
     var sql = `SELECT * FROM admin WHERE admin_id=?`;
    var data = await exe(sql,[req.session.admin.admin_id]);
   var obj = {"admin":data[0]};
    res.render("admin/home.ejs",obj);
});

router.get("/profile",async function(req,res){
    res.render("admin/profile.ejs");
});
router.get("/edit-profile",function(req,res){

    res.render("admin/edit-profile.ejs");
});
router.post("/update_profile", async function (req, res) {
  const d = req.body;
//  res.send(d);

  const sql = `UPDATE admin SET name = ?, email = ? WHERE admin_id = ?`;
  await exe(sql, [d.username, d.email, req.session.admin.admin_id]);

  // ✅ Update session variables
  req.session.admin.name = d.username;
  req.session.admin.email = d.email;
//   req.session.user.profile_image = profile_image;

  res.redirect("/admin/profile");
});

router.get("/add_category",function(req,res){
  res.render("admin/add_category.ejs");
});
router.post("/add_category", async function(req, res) {
  var d = req.body;
  var image = Date.now() + req.files.category_image.name;
  req.files.category_image.mv("public/uploads/" + image);
  var sql = `INSERT INTO category (category_name, category_image, status) VALUES(?, ?, ?)`;
  var data = await exe(sql, [d.category_name, image, 'active']);

  // res.send(data);
  res.redirect("/admin/add_category");
});
router.get("/manage_category",async function(req,res){
  var data = await exe(`SELECT * FROM category WHERE status = 'active'`);
  var obj = {"category":data};
  res.render("admin/manage_category.ejs",obj);
});

router.get("/edit_category/:id",async function(req,res){
  var id = req.params.id;
  var sql = `SELECT * FROM category WHERE category_id = ?`;
  var data = await exe(sql,[id]);

  res.render("admin/edit_category.ejs",{"cat":data[0]});
});
router.post("/update_category", async function(req,res){
  if(req.files)
  {
    var image = Date.now()+req.files.category_image.name;
    req.files.category_image.mv("public/uploads/"+image);
  var sql = `UPDATE category SET category_iamge = ? WHERE category_id = ?`;
  var data = await exe(sql,[image],req.body.category_id);
  }
  var sql = `UPDATE category SET category_name = ? WHERE category_id = ?`;
  var data = await exe(sql,[req.body.category_name,req.body.category_id]);
  // res.send(data)
  res.redirect("/admin/manage_category");

});
router.get("/delete-category/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE category SET status = 'deleted' WHERE category_id = ${id}`);
  // res.send(sql);
  res.redirect("/admin/manage_category");
  
});
router.get("/add_tags",async function(req,res){
  res.render("admin/add_tags.ejs");
});
router.post("/add-tag",async function(req,res){
  var sql = `INSERT INTO tags (tag_name) VALUES(?)`;
  var data = await exe(sql,[req.body.tag_name]);
  // res.send(data);
  res.redirect("/admin/add_tags");
});

router.get("/manage_tags",async function(req,res){
    var data = await exe(`SELECT * FROM tags WHERE status = 'active'`);
res.render("admin/manage_tags.ejs",{"tag":data});
});

router.get("/edit_tag/:id",async function(req,res){
  var id = req.params.id;
  var sql = `SELECT * FROM tags WHERE tag_id = ?`;
  var data = await exe(sql,[id]);
  res.render("admin/edit_tag.ejs",{"tag":data[0]});
});
router.post("/update_tag",async function(req,res){
  var sql = `UPDATE tags SET tag_name = ? WHERE tag_id = ?`;
  var data = await exe(sql,[req.body.tag_name,req.body.tag_id]);
  // res.send(data);
  res.redirect("/admin/manage_tags");
});
router.get("/delete_tag/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE tags SET status = 'deleted' WHERE tag_id = ${id}`);
  // res.send(sql);
  res.redirect("/admin/manage_tags");
});

// weight & price 
router.get("/add_price",async function(req,res){
  var product = await exe(`SELECT * FROM product WHERE status = 'active'`);
  res.render("admin/add_price.ejs",{
    product:product
  });
})

// add product 
router.get("/add_product",async function(req,res){
  var category = await exe(`SELECT * FROM category WHERE status = 'active'`);
  var tags = await exe(`SELECT * FROM tags WHERE status = 'active'`);
  res.render("admin/add_product.ejs",
    {category:category,
    tags:tags}
  );
});


router.post("/add-product", async (req, res) => {
  try {
    const d = req.body;
    
    // Validate image upload
    if (!req.files || !req.files.image) {
      throw new Error("No image uploaded");
    }
    
    const image = req.files.image;
    const imageName = Date.now() + image.name;
    await image.mv("public/uploads/" + imageName);

    var image2 = Date.now()+req.files.image2.name;
    req.files.image2.mv("public/uploads/"+image2);

    // Insert product
   const productRes = await exe(
  `INSERT INTO product (product_name, category_id, ingredients, image, image2, detail, \`usage\`, health_benifits, stockqty)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [d.product_name, d.category_id, d.ingredients, imageName, image2, d.detail, d.usage, d.health_benifits, d.stockqty]
);

    const product_id = productRes.insertId;

    // Handle tags - FIXED
    const tags = d.tags 
      ? (Array.isArray(d.tags) ? d.tags : [d.tags])
      : [];
    
    for (let tag of tags) {
      await exe(
        `INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)`,
        [product_id, tag]
      );
    }

    // Handle weight/price variants - FIXED
    // Get all values for weight and price
    const weights = d.weight ? 
          (Array.isArray(d.weight) ? d.weight : [d.weight]) : 
          [];
    
    const prices = d.price ? 
          (Array.isArray(d.price) ? d.price : [d.price]) : 
          [];
    
    // Validate same number of weights/prices
    if (weights.length !== prices.length) {
      throw new Error("Each weight must have a corresponding price");
    }
    
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] && prices[i]) {
        await exe(
          `INSERT INTO product_price_variants (product_id, weight, price)
           VALUES (?, ?, ?)`,
          [product_id, weights[i], prices[i]]
        );
      }
    }

    res.redirect("/admin/add_product");
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).send("Error: " + err.message);
  }
});
router.get("/manage_products", async (req, res) => {
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.ingredients,
        p.image,
        p.image2,
        p.detail,
        p.usage,
        p.health_benifits,
        p.stockqty,
        c.category_name,
        GROUP_CONCAT(DISTINCT t.tag_name) AS tags,
        GROUP_CONCAT(DISTINCT CONCAT(v.weight, ': ₹', v.price) SEPARATOR '<br>') AS variants
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      LEFT JOIN product_tags pt ON p.product_id = pt.product_id
      LEFT JOIN tags t ON pt.tag_id = t.tag_id
      LEFT JOIN product_price_variants v ON p.product_id = v.product_id
      WHERE p.status = 'active'
      GROUP BY p.product_id
      ORDER BY p.product_id DESC
    `;

    const products = await exe(query);
    res.render("admin/manage_products.ejs", { products });
  } catch (err) {
    console.error("Fetch Products Error:", err);
    res.status(500).send("Error fetching product data");
  }
});

router.get("/edit_product/:id", async function (req, res) {
  try {
    const productId = req.params.id;

    // Get product info
    const productResult = await exe("SELECT * FROM product WHERE product_id = ?", [productId]);
    if (productResult.length === 0) return res.status(404).send("Product not found");
    const product = productResult[0];

    // Get tags selected for this product
    const tagRows = await exe("SELECT tag_id FROM product_tags WHERE product_id = ?", [productId]);
    const tagsArray = tagRows.map(row => row.tag_id);

    // Get weight-price variants for this product
    const variantsArray = await exe("SELECT id, weight, price FROM product_price_variants WHERE product_id = ?", [productId]);

    // Get all active categories & tags
    const categories = await exe("SELECT * FROM category WHERE status = 'active'");
    const tags = await exe("SELECT * FROM tags WHERE status = 'active'");

    // Pass to template
    res.render("admin/edit_product.ejs", {
      product: {
        ...product,
        tagsArray,
        variantsArray
      },
      category: categories,
      tags: tags
    });

  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Internal Server Error");
  }
});

const fs = require("fs");
const path = require("path");

router.post("/update-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const d = req.body;

   const oldProduct = await exe("SELECT image, image2 FROM product WHERE product_id = ?", [productId]);

let imageName = oldProduct[0].image;
let imageName2 = oldProduct[0].image2;

if (req.files && req.files.image) {
  const image = req.files.image;
  imageName = Date.now() + image.name;
  await image.mv("public/uploads/" + imageName);

  const oldPath = path.join("public/uploads/", oldProduct[0].image);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }
}

if (req.files && req.files.image2) {
  const image2 = req.files.image2;
  imageName2 = Date.now() + "_2_" + image2.name;
  await image2.mv("public/uploads/" + imageName2);

  const oldImage2Path = path.join("public/uploads/", oldProduct[0].image2);
  if (fs.existsSync(oldImage2Path)) {
    fs.unlinkSync(oldImage2Path);
  }
}

// Update query
await exe(
  `UPDATE product SET product_name=?, category_id=?, ingredients=?, image=?, image2=?, detail=?, \`usage\`=?, health_benifits=?, stockqty=? WHERE product_id=?`,
  [d.product_name, d.category_id, d.ingredients, imageName, imageName2, d.detail, d.usage, d.health_benifits, d.stockqty, productId]
);



    // ======== TAGS ==========
    // Remove old tags
    await exe("DELETE FROM product_tags WHERE product_id = ?", [productId]);

    // Insert new tags
    const tags = d.tags ? (Array.isArray(d.tags) ? d.tags : [d.tags]) : [];
    for (let tag of tags) {
      await exe("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, tag]);
    }

    // ======== VARIANTS ==========
    // Remove old variants
    await exe("DELETE FROM product_price_variants WHERE product_id = ?", [productId]);

    // Insert updated variants
    const weights = d.weight ? (Array.isArray(d.weight) ? d.weight : [d.weight]) : [];
    const prices = d.price ? (Array.isArray(d.price) ? d.price : [d.price]) : [];

    if (weights.length !== prices.length) {
      throw new Error("Each weight must have a matching price");
    }

    for (let i = 0; i < weights.length; i++) {
      if (weights[i] && prices[i]) {
        await exe(
          "INSERT INTO product_price_variants (product_id, weight, price) VALUES (?, ?, ?)",
          [productId, weights[i], prices[i]]
        );
      }
    }

    res.redirect("/admin/manage_products"); // Redirect as needed
  } catch (err) {
    console.error("Product Update Error:", err);
    res.status(500).send("Error: " + err.message);
  }
});

router.get("/delete_product/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE product SET status = 'deleted' WHERE product_id = ${id}`);
  // res.send(sql);
  res.redirect("/admin/manage_products");
});

router.get("/all_orders", async (req, res) => {
  try {
    const orders = await exe(`
      SELECT o.order_id, o.total_amount, o.order_status, o.created_at AS order_date,
             u.name AS user_name, u.email AS user_email
      FROM orders o
      JOIN user_registration u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
    `);

    res.render("admin/all_orders.ejs", { orders });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.send("Something went wrong");
  }
});

router.get("/gallery",async function(req,res){
  var sql = `SELECT * FROM gallery`; 
  var data = await exe(sql)
  res.render("admin/gallery.ejs",{"gallery":data})
})

router.post("/save_gallery",async function(req,res){
 
  if(req.files && req.files.gallery_image){
    req.body.gallery_image = new Date().getTime()+req.files.gallery_image.name;
    req.files.gallery_image.mv("public/uploads/"+req.body.gallery_image)
  }
   var d= req.body;
  var sql = `INSERT INTO gallery (gallery_name,gallery_headline,gallery_image)VALUES(?,?,?)`;
  var data = await exe(sql,[d.gallery_name,d.gallery_headline,d.gallery_image]);

  // res.send(req.body);
  // console.log(req.files)
  res.redirect("/admin/gallery")
})


router.get("/delete_gallery/:id",async function(req,res){
  var id = req.params.id
  var sql = `DELETE FROM gallery WHERE gallery_id ='${id}'`;
  var data = await exe(sql)

  res.redirect("/admin/gallery")
})

router.get("/edit_gallery/:id", async function(req, res) {
  var id = req.params.id;
  var sql = `SELECT * FROM gallery WHERE gallery_id = ?`;
  var data = await exe(sql, [id]);
  res.render("admin/edit_gallery.ejs", { gallery: data[0] });
});


router.post("/update_gallery",async function(req,res){
  

  if(req.files && req.files.gallery_image){
    req.body.gallery_image = new Date().getTime()+req.files.gallery_image.name;
    req.files.gallery_image.mv("public/uploads/"+req.body.gallery_image)
  }

  var d= req.body;

  var sql = `UPDATE gallery
               SET
                  gallery_name=?,
                  gallery_headline=?,
                  gallery_image=?
                WHERE 
                  gallery_id =?`
  var data = await exe(sql,[d.gallery_name,d.gallery_headline,d.gallery_image,d.gallery_id])

res.redirect("/admin/gallery")

});
















module.exports = router;