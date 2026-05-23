# 老照片 AI 修复工具

自动去划痕 + 黑白上色 + 超清放大，一键修复老照片。

## 技术方案

- **前端:** HTML + CSS + JavaScript（无框架）
- **后端:** Vercel Serverless Function（Node.js）
- **AI 模型:** Hugging Face Inference API
  - GFPGAN — 人脸修复 / 去划痕
  - DeOldify — 黑白照片上色
  - Real-ESRGAN — 超分辨率放大
- **部署:** Vercel（免费）

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 安装 Vercel CLI
npm i -g vercel

# 3. 本地运行
vercel dev

# 4. 打开 http://localhost:3000
```

## 部署到线上

```bash
# 1. 登录 Vercel（首次需要）
vercel login

# 2. 部署
vercel --prod

# 3. 按提示操作，完成后会给你一个线上链接
```

### 设置环境变量（可选）

在 Vercel Dashboard → Settings → Environment Variables 中添加：

- `HF_TOKEN` = 你的 Hugging Face API Token

申请地址：https://huggingface.co/settings/tokens（免费）

不设置也可以，部分模型可能调用受限。

## 项目结构

```
├── api/
│   └── restore.js       # API 代理，调用 HF 模型
├── public/
│   └── index.html        # 前端页面
├── package.json
├── vercel.json
└── .env.example
```
