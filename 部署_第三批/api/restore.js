import { client } from "@gradio/client";
import { HfInference } from "@huggingface/inference";

// 方案 A: Hugging Face Inference API (简单直接)
const HF_MODELS = {
  face_restore: "TencentARC/gfpgan",
  colorize: "PaddlePaddle/DeOldify",
  upscale: "nightmareai/real-esrgan",
};

// 方案 B: Gradio Spaces (备选，更稳定)
const SPACES = {
  face_restore: "akhaliq/GFPGAN",
  colorize: "PaddlePaddle/DeOldify",
  upscale: "nightmareai/real-esrgan",
};

// ---- 方案 A: HF Inference API ----
async function callHF(type, imageBase64, token) {
  const hf = new HfInference(token);

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const result = await hf.imageToImage(
    { model: HF_MODELS[type], data: buffer, parameters: {} },
    { wait_for_model: true }
  );

  const ab = await result.arrayBuffer();
  return "data:image/png;base64," + Buffer.from(ab).toString("base64");
}

// ---- 方案 B: Gradio Spaces ----
async function callSpace(type, imageBase64) {
  const app = await client(SPACES[type]);

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: "image/png" });

  // 查看 Space 支持的 API endpoints
  const info = await app.view_api();
  console.log(`[Space ${type}] endpoints:`, JSON.stringify(info));

  // 尝试常见 endpoint 名称
  const tryEndpoints = ["/predict", "/inference", "/infer", "/run", "/process"];
  let result = null;

  for (const ep of tryEndpoints) {
    try {
      // 根据类型构造参数
      let params;
      if (type === "face_restore") params = [blob, false, 1, 2, 0];
      else if (type === "colorize") params = [blob, false];
      else params = [blob, 2, false];

      result = await app.predict(ep, params);
      break;
    } catch (e) {
      continue;
    }
  }

  // 如果常见 endpoint 都失败，尝试 info 中的第一个
  if (!result) {
    const endpoints = info?.named_endpoints || info?.unnamed_endpoints || {};
    const firstKey = Object.keys(endpoints)[0];
    if (firstKey) {
      result = await app.predict(firstKey, [blob]);
    }
  }

  if (!result) throw new Error("无法找到可用的 API endpoint");

  // 解析返回结果
  const output = result.data[0];
  if (typeof output === "string") {
    const resp = await fetch(output);
    const ab = await resp.arrayBuffer();
    return "data:image/png;base64," + Buffer.from(ab).toString("base64");
  } else if (output?.url) {
    const resp = await fetch(output.url);
    const ab = await resp.arrayBuffer();
    return "data:image/png;base64," + Buffer.from(ab).toString("base64");
  } else if (output instanceof Blob) {
    const ab = await output.arrayBuffer();
    return "data:image/png;base64," + Buffer.from(ab).toString("base64");
  }
  throw new Error("无法解析模型返回结果");
}

// ---- 主处理函数 (自动降级) ----
async function processImage(type, imageBase64, token) {
  // 先尝试 HF Inference API
  try {
    console.log(`[${type}] 尝试 HF Inference API...`);
    return await callHF(type, imageBase64, token);
  } catch (e) {
    console.log(`[${type}] HF API 失败: ${e.message}`);
    console.log(`[${type}] 切换到 Gradio Space...`);
    return await callSpace(type, imageBase64);
  }
}

// ---- HTTP Handler ----
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image, type, token } = req.body;
    if (!image || !type)
      return res.status(400).json({ error: "缺少 image 或 type 参数" });

    const validTypes = Object.keys(HF_MODELS);
    if (!validTypes.includes(type))
      return res
        .status(400)
        .json({ error: `type 必须是: ${validTypes.join(", ")}` });

    // 使用前端传入的 token 或环境变量
    const hfToken = token || process.env.HF_TOKEN;

    console.log(`[API] 收到请求 type=${type}`);
    const resultImage = await processImage(type, image, hfToken);
    console.log(`[API] 完成 type=${type}`);

    res.status(200).json({ success: true, image: resultImage, type });
  } catch (err) {
    console.error("[API] 错误:", err);
    res.status(500).json({
      error: `处理失败: ${err.message}`,
      hint: "Hugging Face Space 可能正在冷启动，请30秒后重试",
    });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};
