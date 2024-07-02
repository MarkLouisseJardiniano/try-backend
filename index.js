const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://Hatid:Hatid@cluster0.cg2euxr.mongodb.net/Hatid?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

const User = require("./models/user");

// Endpoint to register a user
app.post("/register", async (req, res) => {
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
app.get("/verify/:token", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

const secretKey = generateSecretKey();

// Endpoint to login a user (sample implementation)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, secretKey);

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});
