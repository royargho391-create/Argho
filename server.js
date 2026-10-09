import express from "express";
import helmet from "helmet";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "argho.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "Argho API", timestamp: new Date().toISOString() });
});

app.post("/api/newsletter", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
  }
  try {
    db.prepare("INSERT INTO newsletter (email) VALUES (?)").run(email);
    return res.status(201).json({ ok: true, message: "Thanks for joining the Argho update list!" });
  } catch (error) {
    if (String(error?.code).includes("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ ok: false, message: "This email is already on the list." });
    }
    console.error("Newsletter save failed:", error);
    return res.status(500).json({ ok: false, message: "Could not save your signup. Please try again later." });
  }
});

app.post("/api/contact", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const message = String(req.body?.message || "").trim();

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ ok: false, message: "Name must be 2–100 characters." });
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
  }
  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({ ok: false, message: "Message must be 10–5000 characters." });
  }

  try {
    db.prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)").run(name, email, message);
    return res.status(201).json({ ok: true, message: "Message received. Thanks for reaching out!" });
  } catch (error) {
    console.error("Contact save failed:", error);
    return res.status(500).json({ ok: false, message: "Could not send your message. Please try again later." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api", (_req, res) => res.status(404).json({ ok: false, message: "API endpoint not found." }));

app.listen(PORT, () => {
  console.log(`Argho website running at http://localhost:${PORT}`);
});

process.on("SIGINT", () => { db.close(); process.exit(0); });
process.on("SIGTERM", () => { db.close(); process.exit(0); });
