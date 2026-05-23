import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import handler from "./api/restore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(join(__dirname, "public")));

app.post("/api/restore", async (req, res) => {
  await handler(req, res);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 本地服务器已启动: http://localhost:${PORT}`);
});
