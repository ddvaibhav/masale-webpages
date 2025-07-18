var express = require("express");
var exe = require("../conn");
var router = express.Router();
const authMiddleware = require("./authMiddleware");


router.get("/", authMiddleware, async function (req, res) {
  // 1. Admin details
  var sql = `SELECT * FROM admin WHERE admin_id=?`;
  var data = await exe(sql, [req.session.admin.admin_id]);
  var obj = { admin: data[0] };

  // 2. Order stats
  const stats = await exe(`
    SELECT 
      COUNT(*) AS total_orders,
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

  // 3. Latest orders
  const latestOrders = await exe(`
    SELECT order_id, name, total_amount, order_status, created_at 
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
        p.discount,  
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


router.post("/manage_products", async function (req, res) {
  try {
    const d = req.body;
    const productId = d.product_id;

    // Delete old tags
    await exe("DELETE FROM product_tags WHERE product_id = ?", [productId]);

    // Insert new tags
    const tags = d.tags ? (Array.isArray(d.tags) ? d.tags : [d.tags]) : [];
    for (let tag of tags) {
      await exe("INSERT INTO product_tags (product_id, tag_id) VALUES (?, ?)", [productId, tag]);
    }

    // Handle weight and price variants
    const weights = d['weight[]'] || [];
    const prices = d['price[]'] || [];

    const weightArray = Array.isArray(weights) ? weights : [weights];
    const priceArray = Array.isArray(prices) ? prices : [prices];

    if (weightArray.length !== priceArray.length) {
      throw new Error("Each weight must have a matching price");
    }

    // Delete old variants
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

    res.redirect("/admin/manage_products");
  } catch (err) {
    console.error("Product Update Error:", err);
    res.status(500).send("Error: " + err.message);
  }
});


router.get("/delete_product/:id", async function (req, res) {
  var id = req.params.id;
  var sql = await exe(`UPDATE product SET status = 'deleted' WHERE product_id = ${id}`);
  // res.send(sql);
  res.redirect("/admin/manage_products");
});

router.get("/all_orders", async (req, res) => {
  try {
    const orders = await exe(`
  SELECT o.order_id, o.total_amount, o.order_status, o.created_at AS order_date, o.date_at,
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


router.post("/all_orders", async (req, res) => {
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

router.get("/gallery", async function (req, res) {
  var sql = `SELECT * FROM gallery`;
  var data = await exe(sql)
  res.render("admin/gallery.ejs", { "gallery": data })
})

router.post("/save_gallery", async function (req, res) {

  if (req.files && req.files.gallery_image) {
    req.body.gallery_image = new Date().getTime() + req.files.gallery_image.name;
    req.files.gallery_image.mv("public/uploads/" + req.body.gallery_image)
  }
  var d = req.body;
  var sql = `INSERT INTO gallery (gallery_name,gallery_headline,gallery_image)VALUES(?,?,?)`;
  var data = await exe(sql, [d.gallery_name, d.gallery_headline, d.gallery_image]);

  // res.send(req.body);
  // console.log(req.files)
  res.redirect("/admin/gallery")
})


router.get("/delete_gallery/:id", async function (req, res) {
  var id = req.params.id
  var sql = `DELETE FROM gallery WHERE gallery_id ='${id}'`;
  var data = await exe(sql)
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
    req.files.gallery_image.mv("public/uploads/" + req.body.gallery_image)
  }

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
                  gallery_id =?`
  var data = await exe(sql, [d.gallery_name, d.gallery_headline, d.gallery_image, d.gallery_id])

  res.redirect("/admin/gallery")
                
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
  res.send(req.body)
  // res.redirect("/admin/gallery_category")
  })
  
router.get("/delete_gallery_category/:id",async function(req,res){
  var id = req.params.id;
  var sql = `DELETE FROM gallery_category WHERE gallery_category_id =?`;
  var data = await exe(sql,[id])
  res.redirect("/admin/gallery_category")
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




router.get("/update_icon", async function (req, res) {

  var data = await exe(`SELECT * FROM incon WHERE incon_id = '1'`)

  res.render("admin/update_icon.ejs", { info: data[0] })
})


router.post("/update_icon", async function (req, res) {
  var b = req.body;

  var sql = `UPDATE incon SET 
            instagram = ? ,
            facebook = ? ,
            youtube = ? ,
            location = ? ,
            phone_no = ? ,
            email = ? ,
            whatsapp = ? 

            WHERE incon_id = '1'
            `;

  var data = await exe(sql, [b.instagram , b.facebook , b.youtube , b.location , b.phone_no , b.email , b.whatsapp]);


  res.redirect("/admin/update_icon");

});

module.exports = router;