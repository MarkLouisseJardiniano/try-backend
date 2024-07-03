const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");

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

module.exports = router;
