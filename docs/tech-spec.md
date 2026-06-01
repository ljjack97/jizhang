# 技术规范

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API) | ^3.5 |
| 构建工具 | Vite | ^6 |
| UI 组件库 | Vant | ^4 |
| 路由 | Vue Router | ^4 |
| 状态管理 | Pinia | ^2 |
| 语言 | JavaScript | ES2022+ |
| PWA | vite-plugin-pwa | ^0.21 |

## 项目结构

```
jizhang/
├── index.html                 # HTML 入口
├── package.json               # 依赖配置
├── vite.config.js             # Vite 配置
├── CLAUDE.md                  # AI 开发指引
├── docs/                      # 项目文档
│   ├── requirements.md        # 需求文档
│   ├── tech-spec.md           # 技术规范（本文件）
│   ├── design-spec.md         # 设计规范
│   ├── development-plan.md    # 开发执行计划
│   └── api-spec.md            # 接口规范
├── dev-logs/                  # 开发日志
│   └── YYYY-MM-DD.md          # 每日日志
├── public/                    # 静态资源
│   └── favicon.ico
└── src/
    ├── main.js                # 应用入口
    ├── App.vue                # 根组件
    ├── router/
    │   └── index.js           # 路由配置
    ├── stores/
    │   └── records.js         # 支付记录 Store
    ├── api/
    │   └── index.js           # API 接口层（mock）
    ├── views/
    │   ├── Home.vue           # 首页
    │   ├── Detail.vue         # 详情页
    │   ├── Add.vue            # 添加页
    │   ├── Search.vue         # 搜索页
    │   └── Settings.vue       # 设置页
    ├── components/
    │   ├── RecordCard.vue     # 记录卡片
    │   ├── EmptyState.vue     # 空状态
    │   └── AppHeader.vue      # 顶部导航
    ├── utils/
    │   └── storage.js         # localStorage 工具
    └── styles/
        └── global.css         # 全局样式
```

## 编码规范

### Vue 组件
- 使用 `<script setup>` 语法（Composition API）
- 组件名使用 PascalCase
- Props 必须声明类型和默认值
- 事件使用 `defineEmits`

### 样式
- 使用 `<style scoped>` 避免样式污染
- 全局主题变量定义在 `global.css` 中
- 使用 Vant 的 CSS 变量覆盖主题色
- 颜色使用设计规范中定义的变量

### 命名规范
- 文件夹/文件：kebab-case（如 `record-card.vue` 不需要，Vue 组件用 PascalCase）
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- CSS 类名：kebab-case

### Git 提交
- 使用中文提交信息
- 格式：`[类型] 简短描述`
- 类型：feat（新功能）、fix（修复）、style（样式）、docs（文档）、refactor（重构）

## 数据流

```
用户操作 → Vue 组件 → Pinia Store → localStorage
                ↑            ↓
              API 层（未来对接后端）
```

当前阶段 API 层直接操作 Pinia Store，不发起真实 HTTP 请求。
