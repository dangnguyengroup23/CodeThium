require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000", // frontend URL
  credentials: true, // allow cookies
}));

// PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "230292Huong",
  database: process.env.DB_NAME || "codethium",
});

pool.connect(err => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to PostgreSQL database");
});

// Helpers
const signToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET || "dev_secret",
  { expiresIn: "7d" }
);

const authMiddleware = (req, res, next) => {
  // Try header first, then cookie
  let token = null;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Routes

// Register
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, LOWER($2), $3)
       RETURNING id, username, email, created_at`,
      [username.toLowerCase(), email.toLowerCase(), passwordHash]
    );
    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email or username already exists" });
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, email, password } = req.body;
  if (!password || (!username && !email)) return res.status(400).json({ error: "Missing username/email or password" });

  try {
    const result = await pool.query(
      `SELECT id, username, email, password_hash 
       FROM users 
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)`,
      [email || '', username || '']
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user.id);

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });

    return res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Logout route (optional)
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.post("/api/change-password", authMiddleware, async (req, res) => {
  console.log("req.userId:", req.userId);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long" });
  }

  try {
    const userId = req.userId; // directly from authMiddleware

    // Fetch user by id only
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, user.id]
    );

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/chats", authMiddleware, async (req, res) => {
  const { title, messages } = req.body; // messages: array of { sender, text }
  try {
    const result = await pool.query(
      `INSERT INTO chats (user_id, title, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, title, JSON.stringify(messages)]
    );
    return res.json({ chat: result.rows[0] });
  } catch (err) {
    console.error("Save chat error:", err);
    return res.status(500).json({ error: "Failed to save chat" });
  }
});
app.get("/api/chats", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, message, created_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.userId]
    );
    return res.json({ chats: result.rows });
  } catch (err) {
    console.error("Get chats error:", err);
    return res.status(500).json({ error: "Failed to fetch chats" });
  }
});
app.put("/api/chats/:id", authMiddleware, async (req, res) => {
  const { messages } = req.body; // new full array of messages
  try {
    const result = await pool.query(
      `UPDATE chats SET message = $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [JSON.stringify(messages), req.params.id, req.userId]
    );
    return res.json({ chat: result.rows[0] });
  } catch (err) {
    console.error("Update chat error:", err);
    return res.status(500).json({ error: "Failed to update chat" });
  }
});

app.delete("/api/chats/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM chats WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    return res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error("Delete chat error:", err);
    return res.status(500).json({ error: "Failed to delete chat" });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
