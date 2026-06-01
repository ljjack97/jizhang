# 接口规范

## 基础信息

- 基础路径：`/api`
- 请求格式：JSON
- 响应格式：JSON
- 当前阶段：使用 Mock 数据，不发起真实网络请求

## 通用响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 记录不存在 |
| 2001 | 服务端错误 |

---

## 数据模型

```javascript
PaymentRecord {
  id:            string          // 唯一标识
  type:          'income' | 'expense'   // 收支类型
  amount:        number          // 金额
  category:      string          // 分类：food/transport/shopping/hotel/entertain/transfer/redpacket/other
  paymentTime:   string          // ISO 8601
  merchant:      string          // 商家名称
  platform:      'wechat' | 'alipay' | 'bank' | 'other'
  orderNumber:   string          // 订单编号
  description:   string          // 备注
  createdAt:     string          // ISO 8601
}
```

---

## 1. 获取记录列表

```
GET /api/records?page=1&pageSize=20&sort=paymentTime&order=desc
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |
| sort | string | 否 | 排序字段，默认 paymentTime |
| order | string | 否 | asc / desc，默认 desc |

---

## 2. 获取单条记录

```
GET /api/records/:id
```

---

## 3. 新增记录

```
POST /api/records
```

**请求体：**
```json
{
  "type": "expense",
  "amount": 128.50,
  "category": "food",
  "paymentTime": "2026-06-01T14:30:00+08:00",
  "merchant": "麦当劳",
  "platform": "wechat",
  "orderNumber": "2024060120012345678",
  "description": "午餐消费"
}
```

---

## 4. 更新记录

```
PUT /api/records/:id
```

请求体同新增（部分字段可选）。

---

## 5. 删除记录

```
DELETE /api/records/:id
```

---

## 6. 搜索记录

```
GET /api/records/search?keyword=麦当劳&startDate=2026-06-01&endDate=2026-06-01&category=food
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（匹配订单号、备注、金额、商家） |
| startDate | string | 否 | 开始日期 YYYY-MM-DD |
| endDate | string | 否 | 结束日期 YYYY-MM-DD |
| category | string | 否 | 分类筛选 |

---

## 7. 批量导入

```
POST /api/records/batch
```

**请求体：**
```json
{
  "records": [
    { "type": "expense", "amount": 25.00, "category": "food", ... },
    { "type": "expense", "amount": 10.00, "category": "transport", ... }
  ]
}
```

---

## Mock 实现说明

当前阶段 `src/api/index.js` 直接操作 Pinia Store，所有方法同步返回结果。3 个 Store 通过 `pinia-plugin-persistedstate` 自动持久化到 localStorage：

| Store | localStorage Key |
|-------|-----------------|
| records | `jizhang-records` |
| preferences | `jizhang-preferences` |
| user | `jizhang-user` |

未来对接后端时，只需修改 `src/api/index.js` 的方法实现，改为 `fetch` 调用，其他代码无需变动。
