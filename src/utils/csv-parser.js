/**
 * CSV 账单解析工具
 * - 解析微信/支付宝导出的 CSV 账单
 * - 自动匹配分类
 * - 返回标准化记录列表
 */

import { guessCategory, MERCHANT_CATEGORY_MAP } from './clipboard'

// 微信账单 CSV 列名映射（常见变体）
const WECHAT_COLUMNS = {
  time: ['交易时间', '支付时间', '时间'],
  merchant: ['交易对方', '商户名称', '商家', '商品', '商户'],
  amount: ['金额(元)', '金额（元）', '金额', '收支金额(元)'],
  type: ['收/支', '交易类型', '类型', '收支类型'],
  orderNumber: ['交易单号', '订单号', '商户单号'],
  description: ['商品说明', '交易说明', '备注', '商品']
}

// 支付宝账单 CSV 列名映射
const ALIPAY_COLUMNS = {
  time: ['交易时间', '支付时间', '交易创建时间'],
  merchant: ['交易对方', '对方名称', '商户名称', '商品名称'],
  amount: ['金额', '交易金额', '收入金额（+元）', '支出金额（-元）'],
  type: ['收/支', '交易状态', '资金状态'],
  orderNumber: ['交易号', '订单号', '商户订单号'],
  description: ['商品说明', '备注', '交易备注']
}

/**
 * 解析 CSV 文本为行数组
 * 处理引号包裹的字段（可能含逗号/换行）
 * @param {string} csvText
 * @returns {string[][]}
 */
function parseCSV(csvText) {
  const rows = []
  let current = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i]
    const next = csvText[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field.trim())
        field = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field.trim())
        if (current.some(f => f !== '')) {
          rows.push(current)
        }
        current = []
        field = ''
        if (ch === '\r') i++ // skip \n
      } else if (ch === '\r') {
        current.push(field.trim())
        if (current.some(f => f !== '')) {
          rows.push(current)
        }
        current = []
        field = ''
      } else {
        field += ch
      }
    }
  }
  // 最后一行
  if (field || current.length > 0) {
    current.push(field.trim())
    if (current.some(f => f !== '')) {
      rows.push(current)
    }
  }
  return rows
}

/**
 * 尝试匹配列名
 * @param {string[]} headers - CSV 表头
 * @param {object} columnMap - 列名映射
 * @returns {object} 列索引映射
 */
function matchColumns(headers, columnMap) {
  const mapping = {}
  for (const [key, aliases] of Object.entries(columnMap)) {
    for (const alias of aliases) {
      const index = headers.findIndex(h => h.includes(alias))
      if (index >= 0) {
        mapping[key] = index
        break
      }
    }
  }
  return mapping
}

/**
 * 检测账单来源
 * @param {string[]} headers
 * @returns {'wechat' | 'alipay' | 'unknown'}
 */
function detectSource(headers) {
  const headerStr = headers.join(' ')
  if (headerStr.includes('微信') || headerStr.includes('WeChat')) return 'wechat'
  if (headerStr.includes('支付宝') || headerStr.includes('Alipay')) return 'alipay'
  // 根据列名判断
  if (headers.some(h => h.includes('交易单号'))) return 'wechat'
  if (headers.some(h => h.includes('交易号'))) return 'alipay'
  return 'unknown'
}

/**
 * 解析金额字符串
 * @param {string} str
 * @returns {{ amount: number, type: string }}
 */
function parseCSVAmount(str, typeStr) {
  let numStr = str.replace(/[¥￥,，\s]/g, '')
  let type = 'expense'

  // 判断收支类型
  if (typeStr) {
    if (typeStr.includes('收入') || typeStr === '收' || typeStr.includes('入账')) {
      type = 'income'
    } else if (typeStr.includes('支出') || typeStr === '支' || typeStr.includes('出账')) {
      type = 'expense'
    }
  }

  // 处理正负号
  if (numStr.startsWith('-')) {
    type = 'expense'
    numStr = numStr.slice(1)
  } else if (numStr.startsWith('+')) {
    type = 'income'
    numStr = numStr.slice(1)
  }

  // 支付宝格式："收入金额"和"支出金额"分开
  const num = parseFloat(numStr)
  if (isNaN(num) || num <= 0) return { amount: 0, type }

  return { amount: num, type }
}

/**
 * 解析日期时间字符串
 * @param {string} str
 * @returns {string} ISO 8601
 */
function parseCSVTime(str) {
  try {
    // 尝试常见格式
    const cleaned = str.trim()
    // 2024-05-15 20:30:45
    // 2024/05/15 20:30
    // 2024年05月15日 20:30:45
    let normalized = cleaned
      .replace(/[年月]/g, '-')
      .replace(/[日]/g, '')
      .replace(/\//g, '-')
      .trim()

    const date = new Date(normalized)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch {
    // fall through
  }
  return new Date().toISOString()
}

/**
 * 解析 CSV 账单文本，返回标准化记录列表
 * @param {string} csvText - CSV 文件原始文本
 * @returns {{ records: Array, source: string, errors: string[] }}
 */
export function parseCSVBill(csvText) {
  const errors = []
  const rows = parseCSV(csvText)

  if (rows.length < 2) {
    return { records: [], source: 'unknown', errors: ['CSV 文件为空或格式不正确'] }
  }

  const headers = rows[0]
  const source = detectSource(headers)

  // 根据来源选择合适的列映射
  let columnMap
  if (source === 'wechat') {
    columnMap = matchColumns(headers, WECHAT_COLUMNS)
  } else if (source === 'alipay') {
    columnMap = matchColumns(headers, ALIPAY_COLUMNS)
  } else {
    // 通用匹配：尝试所有列名
    columnMap = matchColumns(headers, WECHAT_COLUMNS)
    if (!columnMap.time) {
      columnMap = matchColumns(headers, ALIPAY_COLUMNS)
    }
  }

  if (!columnMap.time && !columnMap.amount) {
    return {
      records: [],
      source,
      errors: ['无法识别 CSV 列名，请确保包含"交易时间"和"金额"列']
    }
  }

  const records = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length === 0 || row.every(c => !c)) continue

    try {
      const timeStr = columnMap.time >= 0 ? (row[columnMap.time] || '') : ''
      const merchantStr = columnMap.merchant >= 0 ? (row[columnMap.merchant] || '') : ''
      const amountStr = columnMap.amount >= 0 ? (row[columnMap.amount] || '') : ''
      const typeStr = columnMap.type >= 0 ? (row[columnMap.type] || '') : ''

      const { amount, type } = parseCSVAmount(amountStr, typeStr)
      if (!amount || amount <= 0) continue

      const paymentTime = parseCSVTime(timeStr)
      const merchant = merchantStr.trim()
      const category = guessCategory(merchant)

      records.push({
        type,
        amount,
        category,
        merchant,
        paymentTime,
        platform: source === 'wechat' ? 'wechat' : source === 'alipay' ? 'alipay' : 'other',
        orderNumber: columnMap.orderNumber >= 0 ? (row[columnMap.orderNumber] || '').trim() : '',
        description: columnMap.description >= 0 ? (row[columnMap.description] || '').trim().slice(0, 50) : ''
      })
    } catch (e) {
      errors.push(`第 ${i + 1} 行解析失败: ${e.message}`)
    }
  }

  return { records, source, errors }
}

/**
 * CSV 导入结果统计
 * @param {Array} records
 * @returns {object}
 */
export function getImportStats(records) {
  const income = records.filter(r => r.type === 'income')
  const expense = records.filter(r => r.type === 'expense')
  const incomeTotal = income.reduce((s, r) => s + r.amount, 0)
  const expenseTotal = expense.reduce((s, r) => s + r.amount, 0)

  // 按分类统计
  const categoryStats = {}
  records.forEach(r => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { count: 0, total: 0 }
    }
    categoryStats[r.category].count++
    categoryStats[r.category].total += r.amount
  })

  return {
    total: records.length,
    incomeCount: income.length,
    expenseCount: expense.length,
    incomeTotal,
    expenseTotal,
    categoryStats
  }
}
