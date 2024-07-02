const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
const router = express.Router(); // Define router for routes

const port = process.env.PORT || 3000; // Use process.env.PORT for port in serverless environments
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Replace with your MongoDB URI directly
const mongoURI = "mongodb+srv://Hatid:Hatid@cluster0.cg2euxr.mongodb.net/Hatid?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

// Sample MongoDB user model import
const User = require("./models/user");

// Endpoint to register a user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new User instance
    const newUser = new User({ name, email, password });

    // Generate verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    // Save user to the database
    await newUser.save();

    // Send verification email (function definition needed)
    sendVerificationEmail(newUser.email, newUser.verificationToken);

    // Respond with success message
    res.status(202).json({
      message:
        "Registration successful. Please check your mail for verification",
    });
  } catch (error) {
    // Log detailed error
    console.log("Error registering user", error);
    // Respond with error message
    res.status(500).json({ message: "Registration failed" });
  }
});

// Endpoint to verify email (sample implementation)
router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email verification failed" });
  }
});

// Sample function to send verification email
function sendVerificationEmail(email, token) {
  // Implement your email sending logic here
  console.log(`Sending verification email to ${email} with token ${token}`);
}

// Endpoint to login a user (sample implementation)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret_here");

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

// Mount router with base path for Netlify Functions
app.use('/.netlify/functions/api', router);

// Export serverless handler
module.exports.handler = app;
