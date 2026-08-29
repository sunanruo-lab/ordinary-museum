# 普通生活美术馆 V3 · Mock Fidelity

这版不再以“最小可用 Demo”为目标，而是以原始 Mock 的页面结构与交互为母版，尽量补回完整产品体验。

## 已补回的流程与功能

- 首页 / 今日作品 / 开始布展
- 拍照或相册选择
- Mock 照片分析页
- 六大展厅：电影厅、摄影厅、绘画厅、手稿厅、超现实厅、杂志厅
- 六种风格卡片 + 策展人推荐
- 正在布展页 + 动态进度
- 浏览器本地图像风格处理（真实 AI 接入前的占位实现）
- 结果页：作品标题、媒介、展览编号、日期、策展人手记
- 原片 / 作品切换
- 收藏 / 取消收藏
- 下载保存作品
- Web Share / 复制分享文案
- 再做一幅
- 我的美术馆 + 真实作品数量
- 无作品时示例展陈
- 作品详情回看
- 策展人手记列表
- 私人 AI 策展 Mock
- 本地 IndexedDB 持久化，降级为 LocalStorage
- 菜单页 / Prompt 结构说明 / 清空本地作品
- PWA Service Worker
- 手机优先 + 桌面自适应

## 产品原则

不是“AI 修图”。

> 同一个瞬间，不同的观看方式。

## GitHub Pages 更新

1. 解压 ZIP。
2. 在 `ordinary-museum` 仓库点击 `+` → `Upload files`。
3. 上传本目录里的文件，不要上传 ZIP 本身。
4. 覆盖旧版同名文件。
5. Commit message 建议：`Rebuild V3 mock fidelity`。
6. GitHub Pages 会自动重新部署。
7. 如果仍显示旧版，强制刷新浏览器，或清理站点缓存。V3 已更新 Service Worker 缓存名。

## 接真实 AI 时

建议保持前端页面和状态流不变，只替换 `services.js` 背后的实现：

前端 → 后端 / 云函数 → Vision → Prompt Builder → 图生图模型 → 策展文字 → 云存储。

不要把 API Key 写进公开 GitHub 仓库或前端 JS。
