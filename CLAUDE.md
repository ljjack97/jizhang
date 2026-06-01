# CLAUDE.md - 记账软件项目指引

## 项目简介
这是一个运行在手机上的个人记账 PWA 应用，使用 Vue 3 + Vant 4 构建。支持手动录入支付记录和（未来）爬虫自动抓取。

## 快速恢复
用户说 **「开始记账项目」** → 读取 `C:\Users\HP\.claude\plans\ui-quizzical-truffle.md` → 从 Phase 10 开始执行。

## 文档索引

所有项目规范文档位于 `docs/` 目录：

| 文档 | 路径 | 说明 |
|------|------|------|
| 开发需求 | [docs/requirements.md](docs/requirements.md) | 功能需求 + 非功能需求 |
| 技术规范 | [docs/tech-spec.md](docs/tech-spec.md) | 技术栈、项目结构、编码规范、数据流 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 色彩、排版、间距、组件设计 |
| 开发计划 | [docs/development-plan.md](docs/development-plan.md) | 8 阶段执行计划 + 完成标准 |
| 接口规范 | [docs/api-spec.md](docs/api-spec.md) | API 定义 + Mock 说明 |

## 日常工作流程

### 开始开发前
1. 阅读 [docs/development-plan.md](docs/development-plan.md)，确认当前 Phase
2. 阅读对应的需求和技术规范
3. 参考 [docs/design-spec.md](docs/design-spec.md) 确保 UI 一致

### 开发过程中
- 遵循 [docs/tech-spec.md](docs/tech-spec.md) 中的编码规范和项目结构
- 每个 Phase 不贪多，完成并验证后再进入下一 Phase
- 代码修改后确保 `npm run dev` 无报错

### 每日收工前
- 在 `dev-logs/YYYY-MM-DD.md` 中更新当日开发日志
- 记录：完成事项、待办事项、遇到的问题

### 添加新功能
- 先检查 [docs/requirements.md](docs/requirements.md)，确认是否在需求范围内
- 新增 API 先更新 [docs/api-spec.md](docs/api-spec.md)
- 新增通用组件先更新 [docs/design-spec.md](docs/design-spec.md) 的组件设计部分

## 关键约束

1. **小步推进**：每次只完成一个 Phase 中的一部分
2. **前端为主**：当前阶段不引入真实后端，数据操作通过 Pinia + localStorage
3. **API 层隔离**：所有数据操作经 `src/api/index.js`，方便未来切换后端
4. **移动端优先**：设计和开发以手机屏幕为第一目标
5. **主色调**：淡蓝色 `#5B9BD5`，遵循 [docs/design-spec.md](docs/design-spec.md) 色彩系统

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

## 技术栈速查

- Vue 3 (Composition API, `<script setup>`)
- Vant 4 (移动端 UI 组件库)
- Vue Router 4 (路由)
- Pinia (状态管理 + localStorage 持久化)
- Vite 6 (构建工具)
- vite-plugin-pwa (PWA 支持)
