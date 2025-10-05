// ===============================
// NASA Habitat Login/Signup Backend (In-memory DB)
// ===============================

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// ===============================
// NASA Habitat Login/Signup + Habitat Save Backend
// ============================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===============================
// Helpers (for ES module dirname)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// IN-MEMORY DATABASE
// ===============================
let usersDB = []; // Each user looks like: { id, name, email, password, createdAt }

const JWT_SECRET = "supersecret_nasa_key"; // Change this for production

// ===============================
// HABITAT DATA FILE SETUP
// ===============================
const dataDir = path.join(__dirname, "data");
const dataPath = path.join(dataDir, "habitats.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, "[]", "utf8");
}

// ===============================
// SAVE HABITAT DESIGN
// ===============================
app.post("/api/save", (req, res) => {
  const habitat = req.body;

  if (!habitat || !habitat.config || !habitat.zones) {
    return res.status(400).json({ message: "Invalid habitat data" });
  }

  try {
    const existing = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const newHabitat = { id: Date.now(), ...habitat };
    existing.push(newHabitat);

    fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2), "utf8");

    res.json({ message: "Habitat saved successfully", habitat: newHabitat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving habitat", error: err.message });
  }
});

// ===============================
// GET ALL SAVED HABITATS
// ===============================
app.get("/api/habitats", (req, res) => {
  try {
    const habitats = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    res.json(habitats);
  } catch (err) {
    res.status(500).json({ message: "Error reading habitats", error: err.message });
  }
});

// ===============================
// SIGNUP (REGISTER)
// ===============================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = usersDB.find((u) => u.email === email);
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    usersDB.push(newUser);

    const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: "2h" });

    res.status(201).json({
      message: "Signup successful",
      user: { id: newUser.id, name, email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// ===============================
// LOGIN
// ===============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = usersDB.find((u) => u.email === email);
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "2h" });

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// ===============================
// PROFILE (Protected Route)
// ===============================
app.get("/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = usersDB.find((u) => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile loaded",
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ===============================
// GET ALL USERS (DEBUG)
// ===============================
app.get("/users", (req, res) => {
  res.json({
    total: usersDB.length,
    users: usersDB.map(({ id, name, email, createdAt }) => ({
      id,
      name,
      email,
      createdAt,
    })),
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
