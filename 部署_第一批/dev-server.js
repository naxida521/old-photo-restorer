import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import handler from "./api/restore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

app.post("/api/restore", async (req, res) => {
  await handler(req, res);
});

app.listen(3000, () => {
  console.log("✅ http://localhost:3000");
});
