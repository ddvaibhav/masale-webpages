var express = require("express");
var exe = require("../conn");
var router = express.Router();
const formidable = require('formidable');
const  authMiddleware = require("./authMiddleware");


router.get("/",authMiddleware,async function(req,res){

    // 1. Admin details
var sql = `SELECT * FROM admin WHERE admin_id=?`;
var data = await exe(sql,[req.session.admin.admin_id]);
var obj = {"admin":data[0]};

// 2. Order stats
const stats = await exe(`
  SELECT 
    COUNT(*) AS total_orders,

    COUNT(CASE WHEN order_status = 'Pending' AND status='active' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN order_status = 'Shipped' AND status='active' THEN 1 END) AS shipped_orders,
    COUNT(CASE WHEN order_status = 'Completed' AND status='active' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN order_status = 'Cancelled' AND status='active' THEN 1 END) AS cancelled_orders,
    COUNT(CASE WHEN order_status = 'Pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN order_status = 'Shipped' THEN 1 END) AS shipped_orders,
    COUNT(CASE WHEN order_status = 'Completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN order_status = 'Cancelled' THEN 1 END) AS cancelled_orders

  FROM orders
  WHERE status = 'active'
`);

const orderStats = stats[0];
const total = orderStats.total_orders || 1;
orderStats.pending_percent = Math.round((orderStats.pending_orders / total) * 100);
orderStats.shipped_percent = Math.round((orderStats.shipped_orders / total) * 100);
orderStats.completed_percent = Math.round((orderStats.completed_orders / total) * 100);
orderStats.cancelled_percent = Math.round((orderStats.cancelled_orders / total) * 100);

// 3. Get latest orders (top 5 or 10)
const latestOrders = await exe(`
  SELECT order_id, name,total_amount,order_status, created_at 
  FROM orders 
  WHERE status = 'active' 
  ORDER BY created_at DESC 
  LIMIT 5
`);

res.render("admin/home.ejs", {
  obj,
  orderStats,
  latestOrders
});
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

router.get("/Spice_Story", async function (req, res) {
  var sql = "SELECT * FROM spice_story";
  var result = await exe(sql);
  res.render("admin/Spice_Story.ejs", { result });
});


router.get("/edit_spicy_story/:id", async function(req, res){
   var id = req.params.id;
   var result = await exe("SELECT * FROM spice_story WHERE id = ?", [id]);
   res.render("admin/edit_spicy_story.ejs", { result: result });
});


router.post("/update_Spice_Story",async function(req,res){
   var d = req.body;

  var sql = `UPDATE spice_story SET title = ?, subheading = ?, description = ? WHERE id = ?`;
  await exe(sql, [d.title, d.subheading, d.description, d.id]);

  var oldData = await exe("SELECT image FROM spice_story WHERE id = ?", [d.id]);
  var oldImage = oldData.length > 0 ? oldData[0].image : "";
  let file_name = "";

  if (req.files && req.files.image) {
    file_name = new Date().getTime() + "_" + req.files.image.name;
    await req.files.image.mv("public/images/" + file_name);
  } else {
    file_name = oldImage;
  }

  var sql2 = `UPDATE spice_story SET image = ? WHERE id = ?`;
  await exe(sql2, [file_name, d.id]);

  res.redirect("/admin/Spice_Story");
});

// reciepi
router.get("/recipe", async function(req, res) {
  var sql = "SELECT * FROM recipe";
  var result = await exe(sql);
  res.render("admin/Recipe.ejs", {result});
});

router.get("/edit_recipe/:id", async function(req, res) {
  let id = req.params.id;
  let sql = "SELECT * FROM recipe WHERE id = ?";
  let result = await exe(sql, [id]);
  res.render("admin/edit_recipe.ejs", { result });
});

router.post("/update_recipe", async function(req, res) {
  let d = req.body;

  let sql = `UPDATE recipe SET title = ?, description = ?, duration = ? WHERE id = ?`;
  await exe(sql, [d.title, d.description, d.duration, d.id]);


  let oldData = await exe("SELECT image FROM recipe WHERE id = ?", [d.id]);
  let oldImage = oldData.length > 0 ? oldData[0].image : "";
  let file_name = "";

  if (req.files && req.files.image) {
    file_name = new Date().getTime() + "_" + req.files.image.name;
    await req.files.image.mv("public/images/" + file_name);
  } else {
    file_name = oldImage;
  }

  await exe("UPDATE recipe SET image = ? WHERE id = ?", [file_name, d.id]);

  res.redirect("/admin/recipe");
});

// features

router.get("/features", async function(req, res){
  var data = await exe("SELECT * FROM features");
  res.render("admin/features.ejs", {data});
});



router.get("/edit/:id", async function (req, res){
  var sql ="SELECT * FROM features WHERE id=?";
  var data = await exe(sql,[req.params.id]);
  res.render("admin/edit_all_features.ejs", { data: data[0] });
});

router.post("/update", async function (req, res) {
  try {
    let d = req.body;
    let file_name = "";

    if (req.files && req.files.image) {
      let image = req.files.image;
      file_name = new Date().getTime() + "_" + image.name;
      await image.mv("public/images/" + file_name);
    } else {
      let oldfile = "SELECT * FROM features WHERE id = ?";
      let result = await exe(oldfile, [d.id]);
      if (result.length > 0) {
        file_name = result[0].image; 
       }
    }

    let update_sql = `UPDATE features SET title = ?, description = ?, image = ? WHERE id = ?`;
    await exe(update_sql, [d.title, d.description, file_name, d.id]);

    res.redirect("/admin/features");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong!");
  }
});


// company info


router.get("/company_info",authMiddleware,async function(req,res){
  var sql = `select * from company_info`;
  var company_info = await exe(sql);
  res.render("admin/company_info.ejs",{company_info})
});


router.get("/edit_company/:cid",async function(req,res){
  var id = req.params.cid;
  var sql = `select * from  company_info where id = ? `;
  var info = await exe(sql,[id]);
  res.render("admin/update_company_info.ejs",{info})
})

router.post("/update_company",async function(req,res){
  var d = req.body;
var sql = `UPDATE company_info SET
    heading_frist = ?,
    heading_second = ?,
    p_frist = ?,
    p_second = ?,
    p_third = ?
    WHERE id = ?`;
    var resut = await exe(sql, [
    d.heading_frist,
    d.heading_second,
    d.p_frist,
    d.p_second,
    d.p_third,
    d.id
]);
    res.redirect("/admin/company_info")
});

router.get("/our_story", async function (req, res) {
    var sql = "SELECT * FROM  our_story ";
    var our_story = await exe(sql);
  
    res.render("admin/our_story.ejs",{our_story});
});



router.get("/edit_our_story/:sid",async function(req,res){
  var id = req.params.sid;
  var sql = `SELECT * FROM our_story where id = ? `;
  var date = await exe(sql,[id]);
  res.render("admin/edit_our_story.ejs",{date})
})

router.post("/update_our_story", async function(req, res) {
    var d = req.body;

    var sql = `UPDATE our_story SET
        hiadding = ?,
        p_frist = ?,
        p_second = ?,
        p_third = ?
    WHERE id = ?`;

    var result = await exe(sql, [
        d.hiadding,
        d.p_frist,
        d.p_second,
        d.p_third,
        d.id
    ]);


    var oldData = await exe("SELECT image FROM our_story WHERE id = ?", [d.id]);
    var oldImage = oldData.length > 0 ? oldData[0].image : "";

    if (req.files) {
        file_name = new Date().getTime() + req.files.image.name;
        req.files.image.mv("public/images/" + file_name);
    } else {
        file_name = oldImage;  
    }

    var sql2 = `UPDATE our_story SET
        image = ? 
    WHERE id = ?`;

    var result2 = await exe(sql2, [file_name, d.id]);

    res.redirect("/admin/our_story");
});

// our mission
router.get("/add_mission_value", async function(req,res){
  var sql = `select * from mission_values`;
  var info = await exe(sql);
  res.render("admin/our_mission_values.ejs",{info})
});

router.get("/process_steps", async function (req, res) {
  var sql = "SELECT * FROM process_steps";
  var result = await exe(sql);
  res.render("admin/Traditional_Process.ejs", { result });
});

router.get("/terms_conditions", async function (req, res) {
  var sql = "SELECT * FROM terms_conditions";
  var result = await exe(sql);
  res.render("admin/terms_conditions.ejs", { result });
});



router.get("/update_terms/:id", async function (req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM terms_conditions WHERE id = ?";
  var result = await exe(sql, [id]);
  res.render("admin/edit_terms.ejs", { result: result[0] });
});

router.post("/update_terms", async function (req, res) {
  var d = req.body;

  var sql = `UPDATE terms_conditions SET title = ?, description = ? WHERE id = ?`;
  await exe(sql, [d.title, d.description, d.id]);

  res.redirect("/admin/terms_conditions");
});

router.get("/Frequently", async function (req, res) {
  var sql = "SELECT * FROM faqs";
  var result = await exe(sql);
  res.render("admin/Frequently.ejs", { result });
});



router.get("/edit_faq/:id", async function (req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM faqs WHERE id = ?";
  var result = await exe(sql, [id]);
  res.render("admin/edit_faq.ejs", { result });
});

router.post("/update_faq", async function (req, res) {
  var d = req.body;
  var sql = "UPDATE faqs SET question = ?, answer = ? WHERE id = ?";
   var result = await exe(sql, [d.question, d.answer, d.id]);
  res.redirect("/admin/Frequently");

});

router.get("/update_process/:pid", async function (req, res) {
  var id = req.params.pid;
  var sql = "SELECT * FROM process_steps WHERE  id = ? ";
  var result = await exe(sql,[id]);
  res.render("admin/edit_Traditional_Process.ejs", { result });
});

router.post("/edit_Tranditional_process", async function (req, res) {
  var d = req.body;

  var sql = `UPDATE process_steps SET title = ?, description = ? WHERE id = ?`;
  await exe(sql, [d.title, d.description, d.id]);

  var oldData = await exe("SELECT image FROM process_steps WHERE id = ?", [d.id]);
  var oldImage = oldData.length > 0 ? oldData[0].image : "";
  let file_name = "";

  if (req.files && req.files.image) {
    file_name = new Date().getTime() + "_" + req.files.image.name;
    await req.files.image.mv("public/images/" + file_name);
  } else {
    file_name = oldImage;
  }

  var sql2 = `UPDATE process_steps SET image = ? WHERE id = ?`;
  await exe(sql2, [file_name, d.id]);

  res.redirect("/admin/process_steps");
});

router.get("/update_mission/:mid",async function(req,res){
  var id = req.params.mid;
  var sql = `select * from mission_values where id = ? `;
  var info = await exe(sql,[id]);
  res.render("admin/edit_mission_vales.ejs",{info})
})

router.post("/our_mission_value", async function(req, res) {
    var d = req.body;

 
    var sql = `UPDATE mission_values SET
        heading = ?,
        description = ?
    WHERE id = ?`;

    await exe(sql, [d.title, d.description, d.id]);

 
    var oldData = await exe("SELECT image FROM mission_values WHERE id = ?", [d.id]);
    var oldImage = oldData.length > 0 ? oldData[0].image : "";
    let file_name = "";

  
    if (req.files && req.files.image) {
        file_name = new Date().getTime() + req.files.image.name;
        await req.files.image.mv("public/images/" + file_name);
    } else {
        file_name = oldImage;
    }

    var sql2 = `UPDATE mission_values SET image = ? WHERE id = ?`;
    await exe(sql2, [file_name, d.id]);

    res.redirect("/admin/add_mission_value");
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
router.get("/add_product",authMiddleware,async function(req,res){
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
  `INSERT INTO product (product_name, category_id, ingredients, image, image2, detail, \`usage\`, health_benifits, stockqty,discount)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
  [d.product_name, d.category_id, d.ingredients, imageName, image2, d.detail, d.usage, d.health_benifits, d.stockqty,d.discount]
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

    
    const productResult = await exe("SELECT * FROM product WHERE status = 'active' AND product_id = ?", [productId]);
    if (productResult.length === 0) return res.status(404).send("Product not found");
    const product = productResult[0];

    
    const tagRows = await exe("SELECT tag_id FROM product_tags WHERE product_id = ?", [productId]);
    const tagsArray = tagRows.map(row => row.tag_id);

    
    const variantsArray = await exe("SELECT id, weight, price FROM product_price_variants WHERE product_id = ?", [productId]);

    
    const categories = await exe("SELECT * FROM category WHERE status = 'active'");
    const tags = await exe("SELECT * FROM tags WHERE status = 'active'");


    res.render("admin/edit_product.ejs", {
  product: {
    ...product,
    tagsArray
  },
  category: categories,
  tags: tags,
  variants: variantsArray 
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
  `UPDATE product SET product_name=?, category_id=?, ingredients=?, image=?, image2=?, detail=?, \`usage\`=?, health_benifits=?, stockqty=?, discount=? WHERE product_id=?`,
  [d.product_name, d.category_id, d.ingredients, imageName, imageName2, d.detail, d.usage, d.health_benifits, d.stockqty, d.discount || 0, productId]
);




   await exe("DELETE FROM product_tags WHERE product_id = ?", [productId]);
    const tags = d.tags ? (Array.isArray(d.tags) ? d.tags : [d.tags]) : [];
    for (let tag of tags) {
      await exe("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, tag]);
    }


    const weights = d['weight[]'] || [];
    const prices = d['price[]'] || [];

    // Convert to arrays if they're not already
    const weightArray = Array.isArray(weights) ? weights : [weights];
    const priceArray = Array.isArray(prices) ? prices : [prices];

    // Validate input
    if (weightArray.length !== priceArray.length) {
      throw new Error("Each weight must have a matching price");
    }

    // Remove old variants
    await exe("DELETE FROM product_price_variants WHERE product_id = ?", [productId]);

    // Insert new variants
    for (let i = 0; i < weightArray.length; i++) {
      const weight = weightArray[i];
      const price = parseFloat(priceArray[i]);
      
      if (!weight || isNaN(price)) {
        throw new Error(`Invalid variant at index ${i}: weight=${weight}, price=${priceArray[i]}`);
      }

      await exe(
        "INSERT INTO product_price_variants (product_id, weight, price) VALUES (?, ?, ?)",
        [productId, weight, price]
      );
    }



// res.send()

    res.redirect("/admin/manage_products"); 
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

router.get("/slider", async function(req, res) {
  var sql = `SELECT * FROM slider`;
  var slider = await exe(sql);
  res.render("admin/slider.ejs", { slider });
});

router.get("/edit_slider/:id", async function(req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM slider WHERE slider_id = ?";
  var result = await exe(sql, [id]);

  res.render("admin/edit_slider", { slider: result[0] });
});


router.post("/update_slider", async function(req, res) {
  var d = req.body;
  var file_name = d.old_image;

  if (req.files && req.files.image) {
    file_name = Date.now() + "_" + req.files.image.name;
    await req.files.image.mv("public/uploads/" + file_name);
  }

  var sql = "UPDATE slider SET title = ?, image = ? WHERE slider_id = ?";
  await exe(sql, [d.title, file_name, d.id]);

  res.redirect("/admin/slider");
});


router.get("/all_orders", async (req, res) => {
  try {
    const orders = await exe(`
      SELECT 
        o.order_id, 
        o.total_amount, 
        o.order_status, 
        o.created_at AS order_date, 
        o.date_at,
        o.weight, 
        u.name AS user_name, 
        u.email AS user_email
      FROM orders o
      JOIN user_registration u ON o.user_id = u.user_id
      WHERE o.status = 'active'
      ORDER BY o.created_at DESC
    `);

    res.render("admin/all_orders.ejs", { orders });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.send("Something went wrong");
  }
});



router.post("/all_orders",authMiddleware, async (req, res) => {
  const { order_id, order_status } = req.body;

  try {
    let query = `UPDATE orders SET order_status = ?`;
    let params = [order_status];

    if (
      order_status === "Shipped" ||
      order_status === "Completed" ||
      order_status === "Cancelled"
    ) {
      query += `, date_at = NOW()`;
    } else {
      query += `, date_at = NULL`; 
    }

    query += ` WHERE order_id = ?`;
    params.push(order_id);

    await exe(query, params);
    res.redirect("/admin/all_orders");
  } catch (error) {
    console.error("Order status update error:", error);
    res.send("Something went wrong");
  }
});


router.post("/order_status/:id", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  await exe(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [status, id]);
  res.redirect("/admin/order_details/" + id);
});

router.get("/order_details/:id", async (req, res) => {
  const orderId = req.params.id;

  // 1. Mark the order as seen (important for notification badge)
  await exe(`UPDATE orders SET is_seen = 1 WHERE order_id = ?`, [orderId]);

  // 2. Fetch the order details
  const [order] = await exe(`
    SELECT * FROM orders WHERE status = 'active' AND order_id = ?
  `, [orderId]);

  if (!order) return res.send("Order not found");

  // 3. Fetch the ordered items
  const items = await exe(`
    SELECT oi.*, p.product_name, p.image 
    FROM order_items oi
    JOIN product p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
  `, [orderId]);

  // 4. Render template
  res.render("admin/order_details.ejs", {
    order,
    items
  });
});

router.get("/delete_orders/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE orders SET status = 'deleted' WHERE order_id = ${id}`);
  // res.send(sql);
  res.redirect("/admin/all_orders");

})

router.get("/notification-count", async (req, res) => {
  try {
    const [row] = await exe(`SELECT COUNT(*) AS unseenCount FROM orders WHERE is_seen = 0`);
    res.json({ unseenCount: row.unseenCount || 0 });
  } catch (err) {
    res.json({ unseenCount: 0 });
  }
});




router.get("/gallery", async function (req, res) {
 
  const gallerySql = `SELECT * FROM gallery`;
  const galleryData = await exe(gallerySql);

 
  const categorySql = `SELECT * FROM gallery_category`;
  const categories = await exe(categorySql);

  res.render("admin/gallery.ejs", { gallery: galleryData, categories });
});

router.post("/save_gallery", async function (req, res) {
  if (req.files && req.files.gallery_image) {
    req.body.gallery_image = new Date().getTime() + req.files.gallery_image.name;
    req.files.gallery_image.mv("public/uploads/" + req.body.gallery_image);
  }
  var d = req.body;
 
  var sql = `INSERT INTO gallery (gallery_category_id, gallery_name, gallery_headline, gallery_image) VALUES (?, ?, ?, ?)`;
  await exe(sql, [d.gallery_category_id, d.gallery_name, d.gallery_headline, d.gallery_image]);

  res.redirect("/admin/gallery");
});

router.get("/delete_gallery/:id", async function (req, res) {
  var id = req.params.id;
  var sql = `DELETE FROM gallery WHERE gallery_id = ?`;
  await exe(sql, [id]);
  res.redirect("/admin/gallery");
});

router.get("/edit_gallery/:id", async function (req, res) {
  var id = req.params.id;
  var sql = `SELECT * FROM gallery WHERE gallery_id = ?`;
  var data = await exe(sql, [id]);

  // Fetch all categories for the dropdown in edit form
  const categorySql = `SELECT * FROM gallery_category`;
  const categories = await exe(categorySql);

  res.render("admin/edit_gallery.ejs", { gallery: data[0], categories });
});

router.post("/update_gallery", async function (req, res) {
  if (req.files && req.files.gallery_image) {
    req.body.gallery_image = new Date().getTime() + req.files.gallery_image.name;
    req.files.gallery_image.mv("public/uploads/" + req.body.gallery_image);
  }

  var d = req.body;

  // Update gallery_category_id as well
  var sql = `UPDATE gallery
               SET
                  gallery_category_id = ?,
                  gallery_name = ?,
                  gallery_headline = ?,
                  gallery_image = ?
                WHERE 
                  gallery_id = ?`;
  await exe(sql, [d.gallery_category_id, d.gallery_name, d.gallery_headline, d.gallery_image, d.gallery_id]);

  res.redirect("/admin/gallery");
});


router.get("/gallery_category",async function(req,res){
  var sql = `SELECT * FROM gallery_category`;
  var data = await exe(sql)
  res.render("admin/gallery_category.ejs",{"categories":data})
})

router.post("/save_gallery_category",async function(req,res){
  var d = req.body;
  var sql = `INSERT INTO gallery_category (gallery_category_name) VALUES(?)`;
  var data = await exe(sql,[d.gallery_category_name])
  res.redirect("/admin/gallery_category")
})


router.get("/edit_gallery_category/:id",async function(req,res){
  var id = req.params.id;
  var sql = `SELECT * FROM gallery_category WHERE gallery_category_id =?`;
  var data = await exe(sql,[id])
  res.render("admin/edit_gallery_category.ejs",{"category":data[0]})
})

router.post("/update_gallery_category",function(req,res){
  var d = req.body;
  var sql = `UPDATE gallery_category SET gallery_category_name =? WHERE gallery_category_id =?`;
  var data = exe(sql,[d.gallery_category_name,d.gallery_category_id])
  // res.send(req.body)
  res.redirect("/admin/gallery_category")
  })
  
router.get("/delete_gallery_category/:id",async function(req,res){
  var id = req.params.id;
  var sql = `DELETE FROM gallery_category WHERE gallery_category_id =?`;
  var data = await exe(sql,[id])
  res.redirect("/admin/gallery_category")
});


router.get("/pending_orders",authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT o.order_id, o.total_amount, o.order_status, o.created_at,
             u.name AS name, u.email
      FROM orders o
      JOIN user_registration u ON o.user_id = u.user_id
      WHERE o.order_status = 'pending' AND status = 'active'
      ORDER BY o.created_at DESC
    `;
    const orders = await exe(query);
    res.render("admin/pending_orders.ejs", { orders });
  } catch (err) {
    console.error("Shipped order fetch error:", err);
    res.send("Something went wrong");
  }
});
router.get("/shipped_orders", async (req, res) => {
  try {
    const query = `
      SELECT o.order_id, o.total_amount, o.order_status, o.created_at,
             u.name AS name, u.email
      FROM orders o
      JOIN user_registration u ON o.user_id = u.user_id
      WHERE o.order_status = 'shipped' AND status = 'active'
      ORDER BY o.created_at DESC
    `;
    const orders = await exe(query);
    res.render("admin/shipped_orders.ejs", { orders });
  } catch (err) {
    console.error("Shipped order fetch error:", err);
    res.send("Something went wrong");
  }
});
router.get("/completed_orders",authMiddleware,async function(req,res){
   try {
    const query = `
      SELECT o.order_id, o.total_amount, o.order_status, o.created_at,
             u.name AS name, u.email
      FROM orders o
      JOIN user_registration u ON o.user_id = u.user_id
      WHERE o.order_status = 'completed' AND status = 'active'
      ORDER BY o.created_at DESC
    `;
    const orders = await exe(query);
    res.render("admin/completed_orders.ejs", { orders });
  } catch (err) {
    console.error("Shipped order fetch error:", err);
    res.send("Something went wrong");
  }
});



router.get("/contact_us",async function(req,res){
  var data = await exe(`SELECT * FROM contact_us`);
  res.render("admin/contact_us.ejs",{"contact":data});
})
router.post("/contact_us",async function(req,res){
  var d = req.body;
  var sql = `INSERT INTO contact_us (first_name,last_name,email,mobile,subject,message)VALUES(?, ?, ?, ?, ?, ?)`;
  var data = await exe(sql,[d.first_name,d.last_name,d.email,d.mobile,d.subject,d.message]);
  // res.send(data);
  res.redirect("/contact_us")
});
router.get("/enquiry",async  function(req,res){
  var data = await exe(`SELECT * FROM enquiries`);
  res.render("admin/enquiry.ejs",{"data":data});
})
router.post("/enquery",async function(req,res){
  var d = req.body;
  var sql = `INSERT INTO enquiries(businessName,productName,quantity,location,contactPerson,phoneNumber,email,comments) 
  VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
  var data = await exe(sql,[d.businessName,d.productName,d.quantity,d.location,d.contactPerson,d.phoneNumber,d.email,d.comments]);
  // res.send(data);
  res.redirect("/enquiry");

})
// router.post("/enquery",async function(req,res){
//   var d = req.body;
//   var sql = `INSERT INTO enquiries(businessName,productName,quantity,location,contactPerson,phoneNumber,email,comments) 
//   VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
//   var data = await exe(sql,[d.businessName,d.productName,d.quantity,d.location,d.contactPerson,d.phoneNumber,d.email,d.comments]);
//   // res.send(data);
//   res.redirect("/enquiry");
// });

router.get("/add_recipe",function(req,res){
  res.render("admin/add_recipe.ejs")
});


router.post("/submit_recipe", async (req, res) => {
  const {
    heading,
    about_recipe,
    ingredients,
    dish_name,
    step1, step2, step3, step4, step5, step6,
    img1Base64, img2Base64, img3Base64, img4Base64, img5Base64,
    details
  } = req.body;

  const sql = `
    INSERT INTO recipes (
      heading, about_recipe, ingredients, dish_name, 
      step1, step2, step3, step4, step5, step6,
      image1, image2, image3, image4, image5,
      details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await exe(sql, [
    heading,
    about_recipe,
    ingredients,
    dish_name,
    step1, step2, step3, step4, step5, step6,
    img1Base64, img2Base64, img3Base64, img4Base64, img5Base64,
    details
  ]);

  res.redirect("/admin/add_recipe");
});




router.get("/manage_recipe", async function (req, res) {
  const recipes = await exe("SELECT * FROM recipes ORDER BY recipe_id DESC");
  res.render("admin/manage_recipe.ejs", { recipes });
});
router.get("/edit_recipes/:id", async function (req, res) {
  const id = req.params.id;
  const sql = "SELECT * FROM recipes WHERE recipe_id = ?";
  const [recipe] = await exe(sql, [id]);
  
  res.render("admin/edit_recipes.ejs", { recipe });
});


router.post("/update_recipe/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const d = req.body;

    let imagePaths = {};

    // Check and save uploaded images
    for (let i = 1; i <= 5; i++) {
      const imageField = `image${i}`;
      if (req.files && req.files[imageField]) {
        const file = req.files[imageField];
        const filename = Date.now() + "_" + file.name;
        const uploadPath = __dirname + "/../public/uploads/" + filename;

        await file.mv(uploadPath); // move file to uploads folder

        imagePaths[imageField] = "/uploads/" + filename;
      }
    }

    // Build the update query
    let sql = `
      UPDATE recipes SET
        heading = ?, dish_name = ?, about_recipe = ?, ingredients = ?,
        step1 = ?, step2 = ?, step3 = ?, step4 = ?, step5 = ?, step6 = ?, details = ?
    `;
    let values = [
      d.heading,
      d.dish_name,
      d.about_recipe,
      d.ingredients,
      d.step1, d.step2, d.step3,
      d.step4, d.step5, d.step6,
      d.details
    ];

   loaded
    for (let i = 1; i <= 5; i++) {
      if (imagePaths[`image${i}`]) {
        sql += `, image${i} = ?`;
        values.push(imagePaths[`image${i}`]);
      }
    }

    sql += " WHERE recipe_id = ?";
    values.push(id);

    await exe(sql, values);
    res.redirect("/admin/manage_recipe");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Update failed");
  }
});

router.get("/delete_recipes/:id", async (req, res) => {
  const id = req.params.id;

  try {
    
    const result = await exe("SELECT image1, image2, image3, image4, image5 FROM recipes WHERE recipe_id = ?", [id]);

    if (result.length === 0) {
      return res.status(404).send("Recipe not found");
    }

    const recipe = result[0];

    
    for (let i = 1; i <= 5; i++) {
      const imagePath = recipe[`image${i}`];
      if (imagePath) {
        const filePath = path.join(__dirname, "../public", imagePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    
    await exe("DELETE FROM recipes WHERE recipe_id = ?", [id]);

    
    res.redirect("/admin/manage_recipe");

  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).send("Server error while deleting recipe");
  }
});




router.get("/contact_info", async function(req, res) {
  try {

    const sql = `SELECT * FROM contact_info`;

    // const sql = `SELECT * FROM company_info`;
    const data = await exe(sql);

    console.log("Fetched contact info:", data);


    res.render("admin/contact_info.ejs", { data: data[0] || {} });

    // res.render("admin/contact_info.ejs", { data: data || {} });
  } catch (error) {
    console.error("Error fetching contact info:", error);
    res.status(500).send("Internal Server Error");
  }
});




router.post("/update_contact_info",async function(req,res){
  var d = req.body;

  var sql = `UPDATE contact_info SET location=?,phone = ? ,email = ?, working_hours = ? , map_link = ?`;
  var data = await exe(sql,[d.location,d.phone,d.email,d.working_hours,d.map_link]);
  // res.send(data);
  res.redirect("/admin/contact_info");


})




router.get("/banner",async function(req,res){
  var sql = `select * from banner`;
  var banner = await exe(sql);
  res.render("admin/banner.ejs",{banner});
})
router.get("/edit_banner/:bid",async function(req,res){
  var id = req.params.bid;
  var sql = `select * from banner where id = ?`;
  var banner = await exe(sql,[id]);
  res.render("admin/edit_banner.ejs",{banner});
})


router.post("/update_banner", async function(req, res) {
  var d = req.body;
  var image = "";

  if (req.files && req.files.image && req.files.image.name) {
    var file = req.files.image;
    var filename = Date.now() + "_" + file.name;
    await file.mv("public/uploads/" + filename);
    image = filename; 
  } else {
    image = d.old_image; 
  }
  await exe("UPDATE banner SET image=? WHERE id=?", [image, d.id]);
  res.redirect("/admin/banner");
});




router.get("/update_icon", async function (req, res) {
  const data = await exe(`SELECT * FROM incon WHERE incon_id = '1'`);
  res.render("admin/update_icon.ejs", { info: data[0] });
});



router.post("/update_icon", async function (req, res) {
  const b = req.body;

  const sql = `
    UPDATE incon SET 
      instagram = ?,
      facebook = ?,
      youtube = ?
    WHERE incon_id = '1'
  `;

  await exe(sql, [b.instagram, b.facebook, b.youtube]);

  res.redirect("/admin/update_icon");
});












module.exports = router;