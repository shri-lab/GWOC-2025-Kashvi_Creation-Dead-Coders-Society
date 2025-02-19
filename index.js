const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const methodOverride = require("method-override");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const Product = require("./models/Product");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files like CSS, images, etc.
app.set("view engine", "ejs");
app.use(methodOverride("_method"));

// ✅ Session Middleware (for cart functionality)
app.use(
  session({
    secret: "ecommerce-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ MongoDB Connection (Single Connection)
// const mongoURI = process.env.MONGO_URI;
const mongoURI = 'mongodb+srv://goofyjock:spxr1UKkEq2DYUH2@cluster0.crmb2.mongodb.net/';
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ✅ Review Schema
const reviewSchema = new mongoose.Schema({
  username: String,
  content: String,
  approved: { type: Boolean, default: false },
});

const Review = mongoose.model("Review", reviewSchema);

// ✅ Blog Schema
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model("Blog", blogSchema);

// ======================== ROUTES ========================

// ✅ General Pages
app.get("/", (req, res) => res.render("main"));
app.get("/admin", (req, res) => res.render("admin"));

app.get("/about", (req, res) => res.render("about"));
app.get("/contactUs", (req, res) => res.render("contactUs"));
app.get("/login-fail", (req, res) => res.render("login-fail"));
app.get("/ownerDashboard", (req, res) => res.render("ownerDashboard"));
app.get("/foot", (req, res) => res.render("footer"));
app.get("/faq", (req, res) => res.render("faq"));
app.get("/terms", (req, res) => res.render("terms"));
app.get("/home-vid", (req, res) => res.render("home-vid"));

// ✅ Community Page - Show Approved Reviews
app.get("/reviews", async (req, res) => {
  const reviews = await Review.find({ approved: true });
  res.render("community", { reviews });
});

// ✅ Submit a Review
app.post("/submit-review", async (req, res) => {
  const newReview = new Review({
    username: req.body.username,
    content: req.body.content,
  });
  await newReview.save();
  res.redirect("/reviews");
});

// ✅ Owner Page - Approve/Reject Reviews


// ✅ Approve a Review
app.post("/approve/:id", async (req, res) => {
  await Review.findByIdAndUpdate(req.params.id, { approved: true });
  res.redirect("/owner");
});

// ✅ Delete a Review
app.post("/delete/:id", async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.redirect("/owner");
});


app.get("/blog", async (req, res) => {
  const blogs = await Blog.find();
  res.render("blog", { blogs });
});

app.post("/add", async (req, res) => {
  const newPost = new Blog({
    title: req.body.title,
    content: req.body.content,
  });
  await newPost.save();
  res.redirect("/blog");
});

// ✅ User Authentication (Hardcoded)
const users = {
  admin: "admin",
  user: "admin",
};

app.post("/login", (req, res) => {
  console.log("Received Request Body:", req.body);
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    res.render("ownerDashboard");


    app.get("/owner", async (req, res) => {
      const reviews = await Review.find();
      res.render("owner", { reviews });
    });


    app.get("/upload", (req, res) => res.render("upload"));


    // ✅ Blog Routes
app.get("/writeBlog", async (req, res) => {
  const blogs = await Blog.find();
  res.render("writeBlog", { blogs });
});


  } else {
    res.redirect("/login-fail");
  }
});

// ======================== ECOMMERCE ROUTES ========================

// ✅ Multer for File Uploads
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Catalogue - Show All Products with Filtering
app.get("/catalogue", async (req, res) => {
  const category = req.query.category || "All";
  const filter = category === "All" ? {} : { category };
  const products = await Product.find(filter);
  const cartLength = req.session.cart ? req.session.cart.length : 0;
  res.render("catalogue", { products, category,cartLength});
});

// ✅ Product Details Page
app.get("/product/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render("product", { product });
});

// ✅ Add to Cart
app.post("/cart/add/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect("/");

  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push({ _id: product._id, name: product.name, price: product.price, category:product.category, image:product.image});

  res.redirect("/cart");
});

// ✅ View Cart Page
app.get("/cart", (req, res) => {
  const cart = req.session.cart || [];
  res.render("cart", { cart });
});

// ✅ Remove Item from Cart (Fixed `_id` Issue)
app.post("/cart/remove/:id", (req, res) => {
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter((item) => item._id.toString() !== req.params.id);
  }
  res.redirect("/cart");
});

// ✅ Upload Product Page


// ✅ Handle Product Upload (POST)
app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }


  const storage = multer.diskStorage({
    destination: "./public/uploads/", // Store image in 'uploads' directory
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
  });
  
  const upload = multer({ storage });
  
  
  
  
  const imagePath = `/uploads/${req.file.filename}`; // Path to store in DB

  const newProduct = new Product({
    name: req.body.name,
    details: req.body.details,
    category: req.body.category,
    image: imagePath, // Store image path in MongoDB
    price: req.body.price,
  });

  await newProduct.save();
  res.redirect("/catalogue");
});

// ======================== START SERVER ========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
