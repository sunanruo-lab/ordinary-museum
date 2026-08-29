# 普通生活美术馆 / ORDINARY LIFE MUSEUM

> 把普通日子，挂进美术馆。

这是一次重新搭建的 **mobile-first Web MVP**。核心不是「AI 修图」，而是：

**同一个瞬间，不同的观看方式。**

## 这版已经能做什么

- 首页 / 品牌视觉
- 手机拍照或相册选图
- 六种观看方式：古典油画、法式胶片、梦境印象、清透水彩、复古版画、艺术杂志
- 选图后即时风格预览
- 「正在布展」进度体验
- 浏览器本地 Canvas 风格化生成，不依赖任何 AI API
- 结果页：展览编号、日期、策展人手记
- 原片 / 作品切换
- 保存作品
- 系统分享（浏览器支持时）
- 我的美术馆
- IndexedDB 本地持久化，兼容性不足时回退 localStorage
- 策展人手记页
- PWA manifest + service worker，可作为独立 Web App 使用
- 六套真实 AI 接入 Prompt 已预留在 `services.js`

## 为什么先这样搭

当前版本的目标是先把 **产品体验和视觉语言跑通**，而不是一上来就绑定昂贵的图像生成接口。

现在用户选择照片后，所有处理都在浏览器本地完成；因此：

- 不需要 API Key
- 不需要服务器
- 不需要 Codex 桌面版
- 可以直接部署到 GitHub Pages / Cloudflare Pages / Vercel
- 后续接真实 Vision / Image 模型时，不需要推翻前端交互

## 项目结构

```text
ordinary-museum-rebuild-v1/
├── index.html
├── styles.css
├── services.js          # 六种风格、Prompt、本地生成逻辑
├── app.js               # 页面路由、上传、生成、画廊、分享
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── icon-192.png
│   └── icon-512.png
├── docs/
│   ├── PRODUCT.md
│   ├── AI-INTEGRATION.md
│   └── GITHUB-SETUP.md
└── .gitignore
```

## 最简单的运行方式

### 方式 A：直接打开

双击 `index.html` 即可看到页面并体验大部分功能。

> 某些浏览器在 `file://` 模式下不会启用 Service Worker，但不影响主功能。

### 方式 B：本地服务器（推荐）

如果电脑有 Python：

```bash
python -m http.server 8080
```

然后浏览器打开：

```text
http://localhost:8080
```

## 下一阶段建议

1. 把本项目推到 GitHub `ordinary-museum`。
2. 开 GitHub Pages，得到一个手机可直接访问的 HTTPS 地址。
3. 用 5–10 张真实照片做用户体验测试。
4. 确认最受欢迎的 2–3 种风格，再接真实 AI 图生图。
5. 后端采用代理方式保管 API Key，前端只请求自有接口。
6. 最后再做微信小程序版，避免同时维护两套尚未验证的产品。

## 产品边界

这版的本地 Canvas 效果只是 **交互占位与体验验证**，不是生成式 AI 的最终质量。真正上线时，推荐的链路是：

```text
Web / 小程序
→ 自有后端
→ Vision 分析
→ Prompt Builder
→ 支持参考图的 Image Model
→ 对象存储
→ 返回作品 URL + 策展文字
```

生产环境不要把任何 AI API Key 写进前端代码。
