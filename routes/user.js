var express = require("express");
var router = express.Router();
var exe = require("../conn");
const nodemailer = require("nodemailer");

// const Razorpay = require("razorpay");
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: "rzp_test_06ydm2R5DTbang",
  key_secret: "McMxvN6Tcr4lZMMH8QU9YaBY",
});




router.post("/user_registration",async function(req,res){
  // res.send(req.body);
  var d= req.body;
  var sql = `INSERT INTO user_registration(name,mobile,email,password) VALUES(?,?,?,?)`;
  var data = await exe(sql,[d.name,d.mobile,d.email,d.password]);
  // res.send(data);
  res.redirect("/");
});

router.post("/user_login",async function(req,res){
  // res.send(req.body);
  const match =(`SELECT * FROM user_registration WHERE email = ? AND password = ?`);
  const data = await exe(match,[req.body.email,req.body.password]);
  if(data.length > 0)
  {
    // req.session.user = data[0];
    req.session.user = data[0];
// res.send(req.session.user.user_id.toString()); // ✅ Send user ID as response

    // res.send(req.session.user=user_id);
    res.redirect("/");
  }
  else{
    res.send("PLEASE ENTER VALID DETAILS");
  }

});
router.get("/profile",function(req,res){
  res.render("user/profile.ejs");
});
router.get("/edit_profile",function(req,res){
  res.render("user/edit_profile.ejs");
});
router.post("/update_profile", async function (req, res) {
  var d = req.body;

  var sql = `UPDATE user_registration SET name = ?, mobile = ?, email = ? WHERE user_id = ?`;
  await exe(sql, [d.name, d.mobile, d.email, d.user_id]);

  req.session.user.name = d.name;
  req.session.user.email = d.email;
  req.session.user.mobile = d.mobile;

  res.redirect("/profile");
});
router.get("/forget_password",function(req,res){
  res.render("user/forget_password.ejs");
});
router.post("/send_otp",async function(req,res){
   const email = req.body.email;
  
    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
  
    // 2. Store OTP in session
    req.session.otp = otp;
    req.session.otp_email = email;
    req.session.otp_time = Date.now();
  
    // 3. Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gorakshnathdalavi91@gmail.com",
        pass: "yydh qpqv vovi fjsm", // Gmail App Password
      },
    });
  
    // 4. Send email
    try {
      await transporter.sendMail({
        from: '"Masala Webpage" <gorakshnathdalavi91@gmail.com>',
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
        html: `
    <div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e5e5;border-radius:10px;font-family:Arial,sans-serif;background-color:#ffffff;">
      <div style="text-align:center;">
        <h2 style="color:#007bff;margin-bottom:0;">Masala Webpage</h2>
        <p style="color:#666;margin-top:5px;">OTP Verification Code</p>
      </div>
      <hr style="margin:20px 0;">
      <p>Hello,</p>
      <p>We received a request to verify your email. Please use the following OTP to complete the process:</p>
      <div style="text-align:center; margin: 30px 0;">
        <span style="display:inline-block;font-size:24px;font-weight:bold;color:#333;padding:10px 20px;border:2px dashed #007bff;border-radius:8px;letter-spacing:5px;">${otp}</span>
      </div>
      <p>This OTP is valid for 10 minutes. If you didn’t request this, you can safely ignore this email.</p>
      <br>
      <p style="color:#888;font-size:13px;">– Masala Webpage Support</p>
    </div>
  `
  
      });
  
      console.log("OTP sent to:", email, "| OTP:", otp);
     res.redirect("/verify_otp?status=sent");
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).send("Failed to send OTP");
    }
  });

  router.get("/verify_otp",function(req,res){
    res.render("user/verify_otp.ejs");
  });

  router.post("/verify_otp", function (req, res) {
  const userOtp = req.body.otp;
  const sessionOtp = req.session.otp;
  const otpTime = req.session.otp_time;

  
  const isExpired = Date.now() - otpTime > 10 * 60 * 1000;

  if (isExpired) {
    return res.send("<script>alert('OTP expired! Please try again.'); window.location='/forget_password';</script>");
  }

  if (parseInt(userOtp) === sessionOtp) {
   
    return res.send("<script>alert('OTP Verified! You can now reset your password.'); window.location='/reset_password';</script>");
  } else {
    
    return res.send("<script>alert('Invalid OTP! Please try again.'); window.location='/verify_otp';</script>");
  }
});
router.get("/reset_password", function (req, res) {
  if (!req.session.otp_email) return res.redirect("/forget_password");

  res.render("user/reset_password.ejs", {
    status: req.query.status || null,
  });
});
  router.post("/reset_password", async function (req, res) {
  const { password, confirm } = req.body;

  if (password !== confirm) {
    return res.redirect("/reset_password?status=error");
  }

  const email = req.session.otp_email;

  const sql = `UPDATE user_registration SET password = ? WHERE email = ?`;
  await exe(sql, [password, email]);

  // Clear session
  req.session.otp = null;
  req.session.otp_email = null;
  req.session.otp_time = null;

   res.send("<script>alert('Password updated successfully!Please Login'); window.location='/';</script>");
});



router.get("/logout",function(req,res){
  req.session.destroy();
  res.redirect("/");
});
router.get("/", async function (req, res) {
  const userId = req.session.user?.user_id;

  const [products, categories] = await Promise.all([
    exe(`SELECT * FROM product WHERE status = 'active'`),
    exe(`SELECT * FROM category WHERE status = 'active'`)
  ]);

    var sql = "SELECT * FROM recipe";
  var recipe = await exe(sql);
  var spice_story = await exe("SELECT * FROM spice_story");
  var incon = await exe(`SELECT * FROM incon`);


  const popular = await exe(`
    SELECT 
      p.product_id, 
      p.product_name, 
      p.image AS product_image_front,
      p.image2 AS product_image_back,
      p.stockqty,
      p.discount,
      (SELECT price FROM product_price_variants WHERE product_id = p.product_id LIMIT 1) AS price,
      COUNT(oi.product_id) AS order_count
    FROM order_items oi
    JOIN product p ON p.product_id = oi.product_id
    WHERE p.status = 'active'
    GROUP BY oi.product_id
    ORDER BY order_count DESC
    LIMIT 5
  `);

  // Get all variants for popular products
  const popularIds = popular.map(p => p.product_id);
  let productVariants = {};

  if (popularIds.length > 0) {
    const variants = await exe(
      `SELECT product_id, weight, price FROM product_price_variants WHERE product_id IN (?)`,
      [popularIds]
    );

    // Group variants by product_id
    variants.forEach(v => {
      if (!productVariants[v.product_id]) productVariants[v.product_id] = [];
      productVariants[v.product_id].push({ weight: v.weight, price: v.price });
    });
  }

  // Get cart items if user is logged in
  let cartProductIds = [];
  if (userId) {
    const cart = await exe(`SELECT product_id FROM cart WHERE user_id = ? AND status = 'active'`, [userId]);
    cartProductIds = cart.map(i => i.product_id);
  }
  // Render the page
  res.render("user/index.ejs", {
    incon:incon[0],
    spice_story:spice_story,
    recipe:recipe,
    product: products,
    category: categories,
    popular: popular,
    productVariants,
    cartProductIds,
    req
  });
});



router.get("/about", async function(req,res){
  
    var incon = await exe(`SELECT * FROM incon`);

    res.render("user/about.ejs",{incon:incon[0]});
});
router.get("/product", async function(req, res) {
  const category = await exe(`SELECT * FROM category WHERE status = 'active'`);
  const allVariants = await exe(`SELECT * FROM product_price_variants`);
  var incon = await exe(`SELECT * FROM incon`);
  const product = await exe(`
    SELECT p.*, c.category_name 
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE p.status = 'active'
  `);

  const uniqueWeightsMap = new Map();
  const uniqueWeights = [];
  for (let item of allVariants) {
    if (!uniqueWeightsMap.has(item.weight)) {
      uniqueWeightsMap.set(item.weight, true);
      uniqueWeights.push(item);
    }
  }

  let cartProductIds = [];
  if (req.session.user && req.session.user.user_id) {
    const userCart = await exe(`SELECT product_id FROM cart WHERE status = 'active' AND user_id = ?`, [req.session.user.user_id]);
    cartProductIds = userCart.map(item => item.product_id);
  }

  res.render("user/product.ejs", {
    incon:incon[0],
    product,
    category,
    variants: allVariants,
    uniqueWeights,
    cartProductIds,
    req
  });
});



router.get("/gallery",async function(req,res){
    var data = await exe("SELECT * FROM gallery");
    var incon = await exe(`SELECT * FROM incon`);
    var obj = {"data":data,incon:incon[0]};
    res.render("user/gallery.ejs",obj);
});
router.get("/recipes",async function(req,res){
    var incon = await exe(`SELECT * FROM incon`);
    var obj = {incon:incon[0]};
    res.render("user/recipes.ejs",obj);
});
router.get("/enquiry",async function(req,res){
    var incon = await exe(`SELECT * FROM incon`);
    var obj = {incon:incon[0]};
    res.render("user/enquiry.ejs",obj);
});
router.get("/contact_us",async function(req,res){
    var incon = await exe(`SELECT * FROM incon`);
    var obj = {incon:incon[0]};
    res.render("user/contact_us.ejs",obj);
});


// router.get("/category_product/:id",async function(req,res){
    
//     var obj = {incon:incon[0]};
//     res.render("user/category_product.ejs",obj);
router.get("/category_product/:id", async function (req, res) {
  try {
    const categoryId = req.params.id;
    var incon = await exe(`SELECT * FROM incon`);

    // Get category name
    const [categoryData] = await exe(`SELECT category_name FROM category WHERE category_id = ?`, [categoryId]);

    // Get all products under the category
    const productData = await exe(`SELECT p.*, c.category_name FROM product p
                                   JOIN category c ON p.category_id = c.category_id
                                   WHERE p.status = 'active' AND p.category_id = ?`, [categoryId]);

    // Get all variants (can be optimized if you have a lot of data)
    const variantData = await exe(`SELECT * FROM product_price_variants`);

    // If user is logged in, get cart items for them
    let cartProductIds = [];
    if (req.session.user && req.session.user.user_id) {
      const userId = req.session.user.user_id;
      const cartData = await exe(`SELECT product_id FROM cart WHERE user_id = ?`, [userId]);
      cartProductIds = cartData.map(item => item.product_id);
    }

    res.render("user/category_product.ejs", {
      categoryName: categoryData?.category_name || "Category Products",
      incon:incon[0],
      product: productData,
      variants: variantData,
      cartProductIds: cartProductIds,
      req: req
    });
  } catch (err) {
    console.error("Category Product Route Error:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/product_details/:id", async function (req, res) {
  const id = req.params.id;
  var incon = await exe(`SELECT * FROM incon`);

  // Get main product
  const [product] = await exe(`
    SELECT product_id, product_name, image, image2, detail, \`usage\`, health_benifits, ingredients, discount, category_id
    FROM product 
    WHERE status = 'active' AND product_id = ?
  `, [id]);

  if (!product) {
    return res.send("Product not found");
  }

  // Get variants
  const variants = await exe(`
    SELECT id, weight, price 
    FROM product_price_variants 
    WHERE product_id = ?
  `, [id]);

  const reviews = await exe(`
    SELECT username, rating, comment, date 
    FROM reviews 
    WHERE product_id = ? 
    ORDER BY date DESC
  `, [id]);

  // res.render("user/product_details.ejs", {
  //   variants,
  //   reviews
  // });

  
const related = await exe(`
  SELECT product_id, product_name, image
  FROM product 
  WHERE status = 'active' 
    AND category_id = ? 
    AND product_id != ? 
  ORDER BY product_id DESC 
  LIMIT 6
`, [product.category_id, id]);

const relatedVariantsMap = {};
for (let rel of related) {
  const variants = await exe(`
    SELECT id, weight, price 
    FROM product_price_variants 
    WHERE product_id = ?
  `, [rel.product_id]);
  relatedVariantsMap[rel.product_id] = variants;
}

res.render("user/product_details.ejs", {
    incon: incon[0],
    product,  // <- फक्त हे
    variants,
    reviews,
    related,
    relatedVariantsMap 
});


});



router.post('/submit_review', async (req, res) => {
  const { product_id, username, rating, comment } = req.body;
  const sql = `INSERT INTO reviews (product_id, username, rating, comment, date) VALUES (?, ?, ?, ?, NOW())`;
  await exe(sql, [product_id, username, rating, comment]);
  res.redirect('/product_details/' + product_id);
});






router.post("/filter-products", async (req, res) => {
  const { category, weight, popular } = req.body;
  var incon = await exe(`SELECT * FROM incon`);  

  let sql = `
    SELECT p.*, c.category_name 
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE 1=1
  `;
  let params = [];

  if (category) {
    sql += " AND p.category_id = ?";
    params.push(category);
  }

  if (popular) {
    sql += " AND p.is_popular = 1";
  }

  // Execute the query
  let productList = await exe(sql, params);

  // Get variants for all products
  let variants = [];
  if (productList.length > 0) {
    const productIds = productList.map(p => p.product_id);
    variants = await exe(`SELECT * FROM product_price_variants WHERE product_id IN (?)`, [productIds]);
  }

  res.render("user/product_list.ejs", {
    incon:incon[0],
    product: productList,
    variants,
    req
  });
});
router.post("/add_tocart", async (req, res) => {
  const userId = req.session.user?.user_id;
  if (!userId) return res.send("Please Login Or SignUp");

  const { product_id, weight_id, price, quantity, discount_price } = req.body;

  try {
    // Check if already in cart
    const existing = await exe(
      "SELECT * FROM cart WHERE status = 'active' AND user_id = ? AND product_id = ? AND weight_id = ?",
      [userId, product_id, weight_id]
    );

    if (existing.length > 0) {
      // Already in cart – update quantity
      await exe(
        "UPDATE cart SET quantity = quantity + ? WHERE cart_id = ?",
        [quantity, existing[0].cart_id]
      );
    } else {
      
      await exe(
        `INSERT INTO cart (user_id, product_id, weight_id, price, discount_price, quantity, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [userId, product_id, weight_id, price, discount_price, quantity]
      );
    }

    res.redirect(`/add_tocart`);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.send("Something went wrong while adding to cart");
  }
});




router.get("/add_tocart", async (req, res) => {
  var incon = await exe(`SELECT * FROM incon`);
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");

  const cartItems = await exe(`
  SELECT 
    c.cart_id, 
    p.product_name, 
    p.image, 
    w.weight, 
    c.price, 
    c.discount_price, 
    c.quantity
  FROM cart c
  JOIN product p ON p.product_id = c.product_id
  JOIN product_price_variants w ON w.id = c.weight_id
  WHERE c.status = 'active' AND c.user_id = ?
`, [userId]);


  res.render("user/add_tocart.ejs", { cart: cartItems,incon:incon[0] });
});

router.get("/remove_cart/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE cart SET status = 'deleted' WHERE cart_id = ${id}`);
  // res.send(sql);
  res.redirect("/add_tocart");

});
router.get("/checkout", async function(req, res) {
  const userId = req.session.user?.user_id;
  var incon = await exe(`SELECT * FROM incon`);
  if (!userId) return res.redirect("/");

  const cart = await exe(`
  SELECT c.cart_id, p.product_id, p.product_name, p.image, w.weight, c.price, c.discount_price, c.quantity
  FROM cart c
  JOIN product p ON p.product_id = c.product_id
  JOIN product_price_variants w ON w.id = c.weight_id
  WHERE c.user_id = ? AND c.status = 'active'
`, [userId]);



  res.render("user/checkout.ejs", { cart , incon:incon[0]});
})


router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // Razorpay works with paisa
    currency: "INR",
    receipt: "order_rcptid_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).send("Error creating order");
  }
});

router.get("/place_order", async (req, res) => {
  if (!req.session.user || !req.session.user.user_id) {
    return res.send("User not logged in. Please login to place order.");
  }

  const {
    razorpay_payment_id,
    name,
    phone,
    email,
    pincode,
    state,
    city,
    landmark,
    address,
    products,
    payment_method
  } = req.query;

  const userId = req.session.user.user_id;

  if (!razorpay_payment_id || !products) {
    return res.send("Payment failed");
  }

}); 







router.post("/cancel_order/:id", async (req, res) => {
  const id = req.params.id;
  await exe("UPDATE orders SET order_status = 'Cancelled' WHERE order_id = ?", [id]);
  res.redirect("/orders");
});


router.get("/orders", async function (req, res) {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");

  var incon = await exe(`SELECT * FROM incon`);
 const orders = await exe(`
  SELECT order_id, order_status, created_at, date_at 
  FROM orders 
  WHERE user_id = ? 
  ORDER BY created_at DESC
`, [userId]);


  const orderIds = orders.map(o => o.order_id);

  let orderItems = [];
  if (orderIds.length > 0) {
    orderItems = await exe(`
      SELECT oi.*, p.product_name, p.image 
      FROM order_items oi
      JOIN product p ON p.product_id = oi.product_id
      WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
    `, orderIds);
  }

  // Group items by order_id
  const groupedItems = {};
  orderItems.forEach(item => {
    if (!groupedItems[item.order_id]) groupedItems[item.order_id] = [];
    groupedItems[item.order_id].push(item);
  });

  res.render("user/orders.ejs", {
    incon:incon[0],
    orders,
    groupedItems
  });
});

router.get("/order_details/:id", async (req, res) => {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");
  var incon = await exe(`SELECT * FROM incon`);
  const orderId = req.params.id;

  // Get order
 const [order] = await exe(`
  SELECT order_id, order_status, name, phone, email, address, landmark, city, state, pincode,
         quantity, total_amount, payment_method, payment_id,
         created_at,date_at
  FROM orders 
  WHERE order_id = ? AND user_id = ?
`, [orderId, userId]);


  if (!order) return res.send("Order not found or unauthorized");

  // Get items
  const items = await exe(`
    SELECT oi.*, p.product_name, p.image 
    FROM order_items oi
    JOIN product p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
  `, [orderId]);

  res.render("user/order_details.ejs", { order, items , incon:incon[0] });
});

 

router.get("/", (req, res) => {
  const q = "SELECT * FROM recipe";
  exe.query(q, (err, data) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).send("Something went wrong!");
    }
console.log("Data passed to index:", data);
  });
});




module.exports = router;