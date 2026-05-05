require('dotenv').config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const session = require("express-session");

const admin_route = require("./routes/admin.js");
const accountsroute = require("./routes/accounts");
const userroute = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 1000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? app.get('origin_whitelist') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files & views
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// File uploads (with limits)
const fileUpload = require('express-fileupload');
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit: true
}));

// Global locals
app.use((req, res, next) => {
  res.locals.admin = req.session.admin;
  res.locals.user = req.session.user;
  next();
});

// Admin notification middleware
const exe = require("./conn.js");
app.use(async (req, res, next) => {
  if (req.url.startsWith('/admin')) {
    try {
      const [row] = await exe(`SELECT COUNT(*) AS unseenCount FROM orders WHERE is_seen = 0`);
      res.locals.unseenCount = row.unseenCount || 0;
    } catch (err) {
      console.error("Error fetching unseen orders:", err);
      res.locals.unseenCount = 0;
    }
  }
  next();
});

// Routes
app.use("/", userroute);
app.use("/admin", admin_route);
app.use("/accounts", accountsroute);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

