# 技术规范

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API) | ^3.5 |
| 构建工具 | Vite | ^6 |
| UI 组件库 | Vant | ^4 |
| 路由 | Vue Router | ^4 |
| 状态管理 | Pinia（含 pinia-plugin-persistedstate） | ^2 |
| 语言 | JavaScript | ES2022+ |
| PWA | vite-plugin-pwa | ^0.21 |

## 项目结构

```
jizhang/
├── index.html                     # HTML 入口
├── package.json                   # 依赖配置
├── vite.config.js                 # Vite + PWA 配置
├── CLAUDE.md                      # AI 开发指引
├── .gitignore
├── .github/workflows/
│   └── deploy.yml                 # GitHub Pages 自动部署
├── deploy.sh                      # 手动部署脚本
├── docs/                          # 项目文档
│   ├── requirements.md            # 需求文档
│   ├── tech-spec.md               # 技术规范（本文件）
│   ├── design-spec.md             # 设计规范
│   ├── development-plan.md        # 开发执行计划
│   └── api-spec.md                # 接口规范
├── dev-logs/                      # 开发日志
│   └── YYYY-MM-DD.md
├── public/                        # 静态资源
└── src/
    ├── main.js                    # 应用入口
    ├── App.vue                    # 根组件（路由 + 底部导航 + 欢迎弹窗）
    ├── router/
    │   └── index.js               # 路由配置（6 个路由）
    ├── stores/
    │   ├── records.js             # 支付记录 Store（CRUD + 搜索 + 清除）
    │   ├── preferences.js         # 用户偏好 Store（按钮样式 + 交互开关 + 首次访问标记）
    │   ├── user.js                # 用户信息 Store（头像/昵称/手机号）
    │   └── clipboard.js           # 剪贴板临时数据 Store（非持久化）
    ├── api/
    │   └── index.js               # API 接口层（Mock 实现）
    ├── views/
    │   ├── Home.vue               # 首页（记录列表 + 搜索 + 统计弹窗 + 分类筛选）
    │   ├── Detail.vue             # 记录详情（查看 + 编辑 + 删除）
    │   ├── Add.vue                # 添加记录（收支选择 + 分类 + 表单 + 快速记账）
    │   ├── Statistics.vue         # 统计图表（SVG 饼图 + 柱状图 + 周期切换）
    │   ├── Profile.vue            # 个人中心（头像/昵称/手机号修改）
    │   └── Settings.vue           # 设置（偏好开关 + CSV 导入 + 清除数据）
    ├── components/
    │   ├── RecordCard.vue         # 记录卡片（金额/分类/商家/时间/左滑删除）
    │   ├── EmptyState.vue         # 空状态引导
    │   └── AutoAddPopup.vue       # 自动记账确认弹窗（剪贴板识别）
    ├── composables/
    │   └── useInteraction.js      # 交互统一入口（摇一摇 + 音效 + 震动）
    ├── utils/
    │   ├── clipboard.js           # 剪贴板读取 + 支付文本解析
    │   ├── csv-parser.js          # CSV 账单解析（微信/支付宝格式）
    │   ├── shake.js               # DeviceMotion 摇动检测
    │   ├── sound.js               # Web Audio API 音效合成（5 种）
    │   └── vibrate.js             # 震动反馈封装（4 种模式）
    └── styles/
        └── global.css             # 全局样式 + CSS 变量
```

## 数据模型

```javascript
PaymentRecord {
  id:            string          // 唯一标识
  type:          'income' | 'expense'   // 收支类型
  amount:        number          // 金额（保留两位小数）
  category:      string          // 消费分类（8 项）
  paymentTime:   string          // ISO 8601 支付时间
  merchant:      string          // 商家名称
  platform:      string          // 支付平台
  orderNumber:   string          // 订单编号
  description:   string          // 备注
  createdAt:     string          // 创建时间
}

UserPreference {
  addButtonStyle:      'fab' | 'topbar'  // 添加按钮样式
  firstVisitCompleted: boolean           // 首次访问标记
  dataMigratedV4:      boolean           // 数据迁移标记
  shakeEnabled:        boolean           // 摇一摇开关
  soundEnabled:        boolean           // 音效开关
  vibrateEnabled:      boolean           // 震动开关
}

UserProfile {
  avatar:    string           // 头像 base64
  nickname:  string           // 昵称
  phone:     string           // 手机号（自动脱敏）
}
```

## 数据流

```
用户操作 → Vue 组件 → Pinia Store → localStorage（pinia-plugin-persistedstate）
    ↑            ↓
  API 层（未来对接后端）

持久化 Key：
  - jizhang-records      → 支付记录
  - jizhang-preferences   → 用户偏好
  - jizhang-user          → 用户信息
```

## 编码规范

### Vue 组件
- 使用 `<script setup>` 语法（Composition API）
- 组件名使用 PascalCase
- Props 必须声明类型和默认值
- 事件使用 `defineEmits`

### 样式
- 使用 `<style scoped>` 避免样式污染
- 全局 CSS 变量定义在 `global.css` 中
- 使用 Vant 的 CSS 变量覆盖主题色
- 颜色使用设计规范中定义的变量
- 文字色满足 WCAG AA 对比度标准（≥4.5:1）

### 命名规范
- 文件夹/文件：kebab-case
- Vue 组件文件：PascalCase
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE
- CSS 类名：kebab-case

### Git 提交
- 使用中文提交信息
- 格式：`[类型] 简短描述`
- 类型：feat（新功能）、fix（修复）、style（样式）、docs（文档）、refactor（重构）

## 路由结构

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home.vue | 首页（底部导航"账单"） |
| `/detail/:id` | Detail.vue | 记录详情 + 编辑 |
| `/add` | Add.vue | 添加记录（?type=expense/income, ?auto=1） |
| `/statistics` | Statistics.vue | 统计图表 |
| `/profile` | Profile.vue | 个人中心（底部导航"我的"） |
| `/settings` | Settings.vue | 设置 |
