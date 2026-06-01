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

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "uuid-1",
        "amount": 128.50,
        "paymentTime": "2024-01-15T14:30:00+08:00",
        "orderNumber": "2024011520012345678",
        "platform": "wechat",
        "description": "午餐消费",
        "createdAt": "2024-01-15T14:31:00+08:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 2. 获取单条记录

```
GET /api/records/:id
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid-1",
    "amount": 128.50,
    "paymentTime": "2024-01-15T14:30:00+08:00",
    "orderNumber": "2024011520012345678",
    "platform": "wechat",
    "description": "午餐消费",
    "createdAt": "2024-01-15T14:31:00+08:00"
  }
}
```

---

## 3. 新增记录

```
POST /api/records
```

**请求体：**
```json
{
  "amount": 128.50,
  "paymentTime": "2024-01-15T14:30:00+08:00",
  "orderNumber": "2024011520012345678",
  "platform": "wechat",
  "description": "午餐消费"
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid-1",
    "amount": 128.50,
    "paymentTime": "2024-01-15T14:30:00+08:00",
    "orderNumber": "2024011520012345678",
    "platform": "wechat",
    "description": "午餐消费",
    "createdAt": "2024-01-15T14:31:00+08:00"
  }
}
```

---

## 4. 删除记录

```
DELETE /api/records/:id
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

---

## 5. 搜索记录

```
GET /api/records/search?keyword=午餐&startDate=2024-01-01&endDate=2024-01-31
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（匹配订单号、备注） |
| startDate | string | 否 | 开始日期 YYYY-MM-DD |
| endDate | string | 否 | 结束日期 YYYY-MM-DD |

---

## 6. 触发爬虫抓取（预留）

```
POST /api/scrape/trigger
```

**请求体：**
```json
{
  "platforms": ["wechat", "alipay"]
}
```

---

## 7. 查询爬虫状态（预留）

```
GET /api/scrape/status
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "idle",
    "lastRunTime": "2024-01-15T14:30:00+08:00",
    "lastResult": {
      "total": 5,
      "success": 4,
      "failed": 1
    }
  }
}
```

---

## Mock 实现说明

当前阶段 `src/api/index.js` 直接操作 Pinia Store，所有方法同步返回结果。未来对接后端时，只需修改该文件的方法实现，改为 `fetch` 调用，其他代码无需变动。
