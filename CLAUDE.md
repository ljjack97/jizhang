# CLAUDE.md - 记账软件项目指引

## 项目简介
这是一个运行在手机上的个人记账 PWA 应用，使用 Vue 3 + Vant 4 构建。支持手动录入支付记录、智能记账（剪贴板识别 + CSV 导入）、统计图表（SVG 饼图 + 柱状图）、摇一摇快速记账。

## 项目状态

```
✅ Phase 1-16 全部完成（Phase 14 跳过）
✅ 可运行   ✅ 可构建   ✅ 已部署 GitHub Pages
```

**已部署地址：** https://ljjack97.github.io/jizhang/

## 文档索引

所有项目规范文档位于 `docs/` 目录：

| 文档 | 路径 | 说明 |
|------|------|------|
| 开发需求 | [docs/requirements.md](docs/requirements.md) | 12 类功能需求 + 非功能需求 |
| 技术规范 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈、项目结构、编码规范、数据流、路由 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 色彩、排版、间距、组件设计、可访问性 |
| 开发计划 | [docs/development-plan.md](docs/development-plan.md) | 16 阶段执行计划（已全部完成） |
| 接口规范 | [docs/api-spec.md](docs/api-spec.md) | API 定义 + Mock 说明 |

## 日常工作流程

### 开发过程中
- 遵循 [docs/tech-spec.md](docs/tech-spec.md) 中的编码规范和项目结构
- 代码修改后确保 `npm run dev` 无报错

### 每日收工前
- 在 `dev-logs/YYYY-MM-DD.md` 中更新当日开发日志
- 记录：完成事项、待办事项、遇到的问题

### 添加新功能
- 先检查 [docs/requirements.md](docs/requirements.md)，确认是否在需求范围内
- 新增 API 先更新 [docs/api-spec.md](docs/api-spec.md)
- 新增通用组件先更新 [docs/design-spec.md](docs/design-spec.md) 的组件设计部分

## 关键约束

1. **小步推进**：每次只完成一个功能
2. **前端为主**：当前阶段不引入真实后端，数据操作通过 Pinia + localStorage
3. **API 层隔离**：所有数据操作经 `src/api/index.js`，方便未来切换后端
4. **移动端优先**：设计和开发以手机屏幕为第一目标
5. **主色调**：淡蓝色 `#5B9BD5`，遵循 [docs/design-spec.md](docs/design-spec.md) 色彩系统
6. **可访问性**：文字对比度 ≥ 4.5:1（WCAG AA），交互元素提供 aria-label

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

## 部署

推送 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages（`gh-pages` 分支）。

手动部署：`bash deploy.sh "commit message"`

## 技术栈速查

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API, `<script setup>`) |
| UI 组件库 | Vant 4 (移动端) |
| 路由 | Vue Router 4 (Hash 模式) |
| 状态管理 | Pinia 2 (pinia-plugin-persistedstate → localStorage) |
| 构建工具 | Vite 6 |
| PWA | vite-plugin-pwa |
| 音效 | Web Audio API (OscillatorNode + GainNode + BiquadFilter) |
| 震动 | navigator.vibrate |
| 摇动检测 | DeviceMotion API |
| 图表 | 纯 CSS SVG 手绘（饼图 + 柱状图） |
| 部署 | GitHub Pages (GitHub Actions) |
