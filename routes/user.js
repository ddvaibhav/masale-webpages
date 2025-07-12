var express = require("express");
var router = express.Router();
var exe = require("../conn");
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
})
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

  const popular = await exe(`
    SELECT 
      p.product_id, 
      p.product_name, 
      p.image,
      p.stockqty,
      (SELECT price FROM product_price_variants WHERE product_id = p.product_id LIMIT 1) AS price,
      COUNT(oi.product_id) AS order_count
    FROM order_items oi
    JOIN product p ON p.product_id = oi.product_id
    WHERE p.status = 'active'
    GROUP BY oi.product_id
    ORDER BY order_count DESC
    LIMIT 5
  `);

  let cartProductIds = [];
  if (userId) {
    const cart = await exe(`SELECT product_id FROM cart WHERE user_id = ? AND status = 'active'`, [userId]);
    cartProductIds = cart.map(i => i.product_id);
  }

  res.render("user/index.ejs", {
    product: products,
    category: categories,
    popular: popular,
    cartProductIds,
    req
  });
});



router.get("/about",function(req,res){
    res.render("user/about.ejs");
});
router.get("/product", async function(req, res) {
  const category = await exe(`SELECT * FROM category WHERE status = 'active'`);
  const allVariants = await exe(`SELECT * FROM product_price_variants`);
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
    var obj = {"data":data};
    res.render("user/gallery.ejs",obj);
});
router.get("/recipes",function(req,res){
    res.render("user/recipes.ejs");
});
router.get("/enquiry",function(req,res){
    res.render("user/enquiry.ejs");
});
router.get("/contact_us",function(req,res){
    res.render("user/contact_us.ejs");
});


router.get("/category_product/:id",function(req,res){
    res.render("user/category_product.ejs");
});
router.get("/product_details/:id", async function (req, res) {
  const id = req.params.id;

  // Fetch single product
  const product = await exe(`SELECT * FROM product WHERE status = 'active' AND product_id = ?`, [id]);

  // Fetch product variants
  const variants = await exe(`
    SELECT id, weight, price 
    FROM product_price_variants 
    WHERE product_id = ?
  `, [id]);

  res.render("user/product_details.ejs", {
    product: product[0],
    variants // ✅ send as "variants"
  });
});

router.post("/filter-products", async (req, res) => {
  const { category, weight, popular } = req.body;

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
    product: productList,
    variants,
    req
  });
});
router.post("/add_tocart", async (req, res) => {
  const userId = req.session.user?.user_id;
  if (!userId) return res.send("Please Login Or SignUp");

  const { product_id, weight_id, price, quantity } = req.body;

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
      // ✅ INSERT new product into cart
      await exe(
        "INSERT INTO cart (user_id, product_id, weight_id, price, quantity, status) VALUES (?, ?, ?, ?, ?, 'active')",
        [userId, product_id, weight_id, price, quantity]
      );
    }

    res.redirect("/add_tocart"); // or use `/product_details/${product_id}` if needed
  } catch (error) {
    console.error("Add to cart error:", error);
    res.send("Something went wrong while adding to cart");
  }
});



router.get("/add_tocart", async (req, res) => {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");

  const cartItems = await exe(`
    SELECT c.cart_id, p.product_name, p.image, w.weight, c.price, c.quantity
    FROM cart c
    JOIN product p ON p.product_id = c.product_id
    JOIN product_price_variants w ON w.id = c.weight_id
    WHERE c.status = 'active' AND c.user_id = ?
  `, [userId]);

  res.render("user/add_tocart.ejs", { cart: cartItems });
});

router.get("/remove_cart/:id",async function(req,res){
  var id = req.params.id;
  var sql = await exe(`UPDATE cart SET status = 'deleted' WHERE cart_id = ${id}`);
  // res.send(sql);
  res.redirect("/add_tocart");

});
router.get("/checkout", async function(req, res) {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");

  const cart = await exe(`
  SELECT c.cart_id, p.product_id, p.product_name, p.image, w.weight, c.price, c.quantity
  FROM cart c
  JOIN product p ON p.product_id = c.product_id
  JOIN product_price_variants w ON w.id = c.weight_id
  WHERE c.user_id = ? AND c.status = 'active'
`, [userId]);


  res.render("user/checkout.ejs", { cart });
});


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
  const { razorpay_payment_id, name, phone, address, amount, products } = req.query;
  const userId = req.session.user?.user_id;

  if (!razorpay_payment_id || !products) return res.send("Payment failed");

  const productList = decodeURIComponent(products).split(","); // ["1_100_2", "3_50_1"]
  const firstProductId = productList[0].split("_")[0];

  // Calculate total quantity
  let totalQuantity = 0;
  productList.forEach(item => {
    const [, , quantity] = item.split("_");
    totalQuantity += parseInt(quantity);
  });

  // Insert main order
  const orderResult = await exe(`
    INSERT INTO orders (user_id, payment_id, product_id, name, phone, address, total_amount, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, razorpay_payment_id, firstProductId, name, phone, address, amount, totalQuantity]
  );

  const order_id = orderResult.insertId;

  // Insert each item into order_items
  for (const item of productList) {
    const [product_id, price, quantity] = item.split("_");
    await exe(`
      INSERT INTO order_items (order_id, product_id, price, quantity)
      VALUES (?, ?, ?, ?)`,
      [order_id, product_id, price, quantity]
    );
  }

  // Clear cart
  await exe(`DELETE FROM cart WHERE user_id = ?`, [userId]);

  res.render("user/order_success.ejs", { paymentId: razorpay_payment_id });
});





router.get("/order_success",function(req,res){
  res.render("user/order_success.ejs");
});

router.get("/orders", async function (req, res) {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");

  const orders = await exe(`
    SELECT * FROM orders 
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
    orders,
    groupedItems
  });
});

 








module.exports = router;