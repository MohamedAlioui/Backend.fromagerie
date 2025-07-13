import express from "express";
import User from "../models/User.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check database connection before operations
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database connection error" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return res.status(500).json({ message: "Database operation failed" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Create new user
router.post("/", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Create new user
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || "user",
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("User creation error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: "Server error during user creation" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { username, email, role, isActive } = req.body;
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        message: "You cannot deactivate your own account",
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const query = {
        _id: { $ne: userId },
        $or: []
      };
      
      if (username) query.$or.push({ username });
      if (email) query.$or.push({ email });
      
      const existingUser = await User.findOne(query);

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Username already taken",
        });
      }
    }

    // Build update data object
    const updateData = {};
    if (username !== undefined) updateData.username = username.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // Validate that we have something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Check database connection before operations
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database connection error" });
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("User update error:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }

    res.status(500).json({ message: "Server error during user update" });
  }
});

// Reset user password
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check database connection before operations
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database connection error" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return res.status(500).json({ message: "Database operation failed" });
    }

    res.status(500).json({ message: "Server error during password reset" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    // Check database connection before operations
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database connection error" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("User deletion error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return res.status(500).json({ message: "Database operation failed" });
    }

    res.status(500).json({ message: "Server error during user deletion" });
  }
});

export default router;
