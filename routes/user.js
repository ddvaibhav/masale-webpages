var express = require("express");
var router = express.Router();
var exe = require("../conn");
var check_login = require("./check_login");
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
router.get("/profile",check_login,function(req,res){
  res.render("user/profile.ejs");
});
router.get("/edit_profile",check_login,function(req,res){
  res.render("user/edit_profile.ejs");
});
router.post("/update_profile",check_login, async function (req, res) {
  var d = req.body;

  var sql = `UPDATE user_registration SET name = ?, mobile = ?, email = ? WHERE user_id = ?`;
  await exe(sql, [d.name, d.mobile, d.email, d.user_id]);

  req.session.user.name = d.name;
  req.session.user.email = d.email;
  req.session.user.mobile = d.mobile;

  res.redirect("/profile");
});
router.get("/logout",function(req,res){
  req.session.destroy();
  res.redirect("/");
});
router.get("/", async function (req, res) {

  var incon = await exe(`SELECT * FROM incon`)
  var recipe = await exe(`SELECT * FROM recipe`);
  var contactinfo = await exe("SELECT * FROM contact_info");
  var spice_story = await exe(`SELECT * FROM spice_story`);
  const userId = req.session.user?.user_id;

  const [products, categories] = await Promise.all([
    exe(`SELECT * FROM product WHERE status = 'active'`),
    exe(`SELECT * FROM category WHERE status = 'active'`)
  ]);

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



  let info = await exe("select * from slider");
  // Render the page
  res.render("user/index.ejs", {
    product: products,
    incon:incon[0],
    category: categories,
    spice_story:spice_story,
    recipe:recipe,
    popular: popular,
    productVariants,
    cartProductIds,
    info:info,
    contactinfo:contactinfo[0],
    req
  });
});




router.get("/about",async function(req,res){
  var incon = await exe(`SELECT * FROM incon`)
    var contactinfo = await exe("SELECT * FROM contact_info");
    res.render("user/about.ejs",{incon:incon[0],contactinfo:contactinfo[0]});
});
router.get("/product", async function(req, res) {
  var incon = await exe(`SELECT * FROM incon`);
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

  var banner = await exe("select * from banner");
  var contactinfo = await exe("SELECT * FROM contact_info");

  res.render("user/product.ejs", {
    incon:incon[0],
    product,
    category,
    banner:banner,
    variants: allVariants,
    uniqueWeights,
    cartProductIds,
    contactinfo:contactinfo[0],
    req
  });
});



router.get("/gallery",async function(req,res){
    var incon = await exe(`SELECT * FROM incon`)
    var data = await exe("SELECT * FROM gallery");
      var contactinfo = await exe("SELECT * FROM contact_info");
    var obj = {"data":data , incon:incon[0],contactinfo:contactinfo[0]};
    res.render("user/gallery.ejs",obj);
});

router.get("/recipes", async function (req, res) {
  let recipes = await exe("SELECT * FROM recipes");
  var incon = await exe(`SELECT * FROM incon`)
    var contactinfo = await exe("SELECT * FROM contact_info");
  let updatedRecipes = recipes.map(r => {
    return {
      ...r,
      ingredients_list: r.ingredients
        ? r.ingredients.split(",").map(i => i.trim())
        : []
    };
  });

  res.render("user/recipes.ejs", {
    incon:incon[0],
    data: updatedRecipes,
    mainRecipe: updatedRecipes[0],
    contactinfo:contactinfo[0]
  });
});



router.get("/enquiry",async function(req,res){

  var contactinfo = await exe("SELECT * FROM contact_info");
    var incon = await exe(`SELECT * FROM incon`);
    res.render("user/enquiry.ejs",{"contactinfo":contactinfo[0],
     "incon": incon[0]
    });

    // res.render("user/enquiry.ejs",{incon:incon[0]});
});
router.get("/contact_us",async function(req,res){
  var incon = await exe(`SELECT * FROM incon`)
  var contactinfo = await exe(`SELECT * FROM contact_info`);
    res.render("user/contact_us.ejs",{"contactinfo":contactinfo[0] , incon:incon[0]});
});


router.get("/category_product/:id", async function (req, res) {
  try {
    const categoryId = req.params.id;

    // Get category name
    const [categoryData] = await exe(`SELECT category_name FROM category WHERE category_id = ?`, [categoryId]);
    var incon = await exe(`SELECT * FROM incon`)
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

      var contactinfo = await exe("SELECT * FROM contact_info");

    res.render("user/category_product.ejs", {
      incon:incon[0],
      categoryName: categoryData?.category_name || "Category Products",
      product: productData,
      variants: variantData,
      cartProductIds: cartProductIds,
      contactinfo:contactinfo[0],
      req: req
    });
  } catch (err) {
    console.error("Category Product Route Error:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/product_details/:id", async function (req, res) {
  const id = req.params.id;
  var incon = await exe(`SELECT * FROM incon`)
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
  incon:incon[0],
  product,
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
  var incon = await exe(`SELECT * FROM incon`)
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
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");
  var incon = await exe(`SELECT * FROM incon`)
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

  var contactinfo = await exe("SELECT * FROM contact_info");

  res.render("user/add_tocart.ejs", { cart: cartItems , incon:incon[0],"contactinfo":contactinfo[0] });
});

router.get("/remove_cart/:id",async function(req,res){
  var id = req.params.id;
  var incon = await exe(`SELECT * FROM incon`);
  var sql = await exe(`UPDATE cart SET status = 'deleted' WHERE cart_id = ${id}`);
  // res.send(sql);
  res.redirect("/add_tocart");

});
router.get("/checkout",check_login, async function(req, res) {
  const userId = req.session.user?.user_id;
  var incon = await exe(`SELECT * FROM incon`)
  var contactinfo = await exe("SELECT * FROM contact_info");
  if (!userId) return res.redirect("/");

  const cart = await exe(`
  SELECT c.cart_id, p.product_id, p.product_name, p.image, w.weight, c.price, c.discount_price, c.quantity
  FROM cart c
  JOIN product p ON p.product_id = c.product_id
  JOIN product_price_variants w ON w.id = c.weight_id
  WHERE c.user_id = ? AND c.status = 'active'
`, [userId]);

var contact = await exe(`SELECT * FROM contact_info`);



  res.render("user/checkout.ejs", { cart , incon:incon[0],contact:contact[0],"contactinfo":contactinfo[0]});
});


router.post("/create-order",check_login, async (req, res) => {
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

router.get("/place_order",check_login, async (req, res) => {
  var incon = await exe(`SELECT * FROM incon`);
  var contactinfo = await exe("SELECT * FROM contact_info");
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
    // amount, 
    products,
    payment_method
  } = req.query;

  const userId = req.session.user?.user_id;
  if (!razorpay_payment_id || !products) return res.send("Payment failed");

  const productList = decodeURIComponent(products).split(","); 
  const [firstProductId, firstPrice, firstDiscountPrice, firstQty, firstWeight] = productList[0].split("_");

  let totalQuantity = 0;
  let totalDiscountAmount = 0;
  let totalSavings = 0;

  productList.forEach(item => {
    const [_, price, discount_price, qty] = item.split("_");
    const quantity = parseInt(qty) || 0;
    const originalPrice = parseFloat(price) || 0;
    const discountPrice = parseFloat(discount_price) || 0;

    totalQuantity += quantity;
    totalDiscountAmount += discountPrice * quantity;
    totalSavings += (originalPrice - discountPrice) * quantity;
  });

  // 🛠️ Insert into orders table (added weight field)
const query = `
  INSERT INTO orders (
    user_id, product_id, name, phone, address, total_amount,
    payment_id, quantity, payment_method, price, discount_price,
    email, pincode, state, city, landmark, weight
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const values = [
  userId,
  firstProductId,
  name,
  phone,
  address,
  totalDiscountAmount,
  razorpay_payment_id,
  totalQuantity,
  payment_method,
  parseFloat(firstPrice),
  parseFloat(firstDiscountPrice),
  email,
  pincode,
  state,
  city,
  landmark,
  firstWeight
];

const orderResult = await exe(query, values);






  

  const order_id = orderResult.insertId;

  // 🛠️ Insert into order_items table with weight
  for (const item of productList) {
    const [product_id, price, discount_price, quantity, weight] = item.split("_");

    await exe(`
      INSERT INTO order_items (order_id, product_id, price, discount_price, quantity, weight)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        product_id,
        parseFloat(price) || 0,
        parseFloat(discount_price) || 0,
        quantity,
        weight || ''
      ]
    );
  }

  // 🧹 Clear user cart
  await exe(`DELETE FROM cart WHERE user_id = ?`, [userId]);

  // ✅ Render success
  res.render("user/order_success.ejs", {
    incon:incon[0],
    "contactinfo":contactinfo[0],
    paymentId: razorpay_payment_id
  });
});










router.post("/cancel_order/:id",check_login, async (req, res) => {
  const id = req.params.id;
  await exe("UPDATE orders SET order_status = 'Cancelled' WHERE order_id = ?", [id]);
  res.redirect("/orders");
});


router.get("/orders", check_login, async function (req, res) {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect("/");
  var incon = await exe(`SELECT * FROM incon`);
  var contactinfo = await exe("SELECT * FROM contact_info");

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
    contactinfo:contactinfo[0],
    groupedItems
  });
});

router.get("/order_details/:id",check_login, async (req, res) => {
  const userId = req.session.user?.user_id;
  var incon = await exe(`SELECT * FROM incon`)
  if (!userId) return res.redirect("/");

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

  res.render("user/order_details.ejs", { order, items , incon:incon[0]});
});

 








module.exports = router;