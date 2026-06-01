/**
 * 剪贴板工具
 * - 读取系统剪贴板
 * - 解析支付通知文本，提取金额、商家、平台
 */

// 常见支付平台关键词
const PLATFORM_PATTERNS = [
  { name: 'wechat', keywords: ['微信支付', '微信付款', '微信'] },
  { name: 'alipay', keywords: ['支付宝', '付款成功', '交易提醒'] },
  { name: 'bank', keywords: ['银行卡', '银行扣款', '银行支出', '信用卡', '储蓄卡'] }
]

// 商家关键词映射 → 分类（用于 CSV 自动分类）
export const MERCHANT_CATEGORY_MAP = {
  // 餐饮
  '麦当劳': 'food', '肯德基': 'food', '必胜客': 'food', '海底捞': 'food',
  '星巴克': 'food', '瑞幸': 'food', '喜茶': 'food', '奈雪': 'food',
  '美团': 'food', '饿了么': 'food', '外卖': 'food', '餐厅': 'food',
  '饭': 'food', '面': 'food', '奶茶': 'food', '咖啡': 'food',
  '小吃': 'food', '烧烤': 'food', '火锅': 'food', '料理': 'food',
  '烘焙': 'food', '蛋糕': 'food', '水果': 'food', '超市': 'food',
  // 交通
  '滴滴': 'transport', '曹操': 'transport', 'T3': 'transport',
  '打车': 'transport', '出行': 'transport', '车主': 'transport',
  '地铁': 'transport', '公交': 'transport', '高铁': 'transport',
  '航班': 'transport', '机票': 'transport', '火车': 'transport',
  '加油': 'transport', '中石油': 'transport', '中石化': 'transport',
  '骑行': 'transport', '单车': 'transport', '哈啰': 'transport',
  // 购物
  '淘宝': 'shopping', '天猫': 'shopping', '京东': 'shopping',
  '拼多多': 'shopping', '唯品会': 'shopping', '闲鱼': 'shopping',
  '购物': 'shopping', '商场': 'shopping', '百货': 'shopping',
  '服饰': 'shopping', '优衣库': 'shopping', 'NIKE': 'shopping',
  '数码': 'shopping', '小米': 'shopping', '华为': 'shopping',
  // 住宿
  '酒店': 'hotel', '宾馆': 'hotel', '民宿': 'hotel', '旅馆': 'hotel',
  '住宿': 'hotel', '如家': 'hotel', '汉庭': 'hotel', '锦江': 'hotel',
  // 娱乐
  '电影': 'entertain', '影院': 'entertain', 'KTV': 'entertain',
  '游戏': 'entertain', '充值': 'entertain', '会员': 'entertain',
  '视频': 'entertain', '音乐': 'entertain', '直播': 'entertain',
  '演出': 'entertain', '门票': 'entertain', '景点': 'entertain',
  '健身': 'entertain', '运动': 'entertain',
  // 转账
  '转账': 'transfer', '红包': 'redpacket', '汇款': 'transfer',
  '工资': 'transfer', '薪': 'transfer', '报销': 'transfer',
  '收款': 'transfer', '转入': 'transfer', '提现': 'transfer'
}

/**
 * 读取剪贴板文本
 * @returns {Promise<string>}
 */
export async function readClipboard() {
  try {
    // 检查 API 是否可用
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return ''
    }
    const text = await navigator.clipboard.readText()
    return text || ''
  } catch {
    // 用户可能拒绝了剪贴板权限
    return ''
  }
}

/**
 * 从文本中提取金额
 * 支持格式：¥12.34、￥56.78、12.34元、56.78
 * @param {string} text
 * @returns {{ amount: number, raw: string } | null}
 */
export function extractAmount(text) {
  if (!text) return null

  // 优先级匹配：
  // 1. ¥/￥ 符号后跟数字
  const symbolMatch = text.match(/[¥￥]\s*(\d+\.?\d{0,2})/)
  if (symbolMatch) {
    return { amount: parseFloat(symbolMatch[1]), raw: symbolMatch[0] }
  }

  // 2. 数字后跟 "元"
  const yuanMatch = text.match(/(\d+\.?\d{0,2})\s*元/)
  if (yuanMatch) {
    return { amount: parseFloat(yuanMatch[1]), raw: yuanMatch[0] }
  }

  // 3. 纯数字金额（小数形式，靠近"交易""支付"等关键词）
  const payMatch = text.match(/(?:交易|支付|付款|支出|扣款|消费)[^\d]*(\d+\.?\d{0,2})/)
  if (payMatch) {
    return { amount: parseFloat(payMatch[1]), raw: payMatch[1] }
  }

  // 4. 最后尝试：任何类似金额的数字（如 "12.34"）
  const numMatch = text.match(/(\d+\.\d{2})(?!\d)/)
  if (numMatch) {
    return { amount: parseFloat(numMatch[1]), raw: numMatch[1] }
  }

  return null
}

/**
 * 从文本中提取商家名称
 * @param {string} text
 * @returns {string}
 */
export function extractMerchant(text) {
  if (!text) return ''

  // 策略 1：查找 "商户" / "商家" 后的关键词
  const merchantPrefix = text.match(/(?:商户|商家|收款方)[：:]\s*(.+?)(?:[，,。\s]|$)/)
  if (merchantPrefix) {
    const candidate = merchantPrefix[1].trim()
    if (candidate.length <= 20) return candidate
  }

  // 策略 2：移除金额和常见前缀后，提取可能的商家名
  let cleaned = text
    .replace(/[¥￥]\s*\d+\.?\d{0,2}/g, '')          // 去掉 ¥金额
    .replace(/\d+\.?\d{0,2}\s*元/g, '')             // 去掉 金额元
    .replace(/\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}/g, '') // 去掉日期时间
    .replace(/\d{16,}/g, '')                         // 去掉订单号
    .replace(/订单号[：:]?\s*\d+/g, '')              // 去掉订单号
    .replace(/微信支付|微信付款|支付宝|交易提醒|付款成功/g, '')
    .replace(/支付成功|交易完成|已支付/g, '')
    .replace(/[\s，。,！!：:（(）)]+/g, ' ')
    .trim()

  // 策略 3：检查是否包含已知商家名
  for (const keyword of Object.keys(MERCHANT_CATEGORY_MAP)) {
    if (text.includes(keyword)) {
      // 尝试获取更完整的商家名（关键词前后若干字符）
      const idx = text.indexOf(keyword)
      const start = Math.max(0, idx - 3)
      const end = Math.min(text.length, idx + keyword.length + 4)
      const context = text.slice(start, end).replace(/[¥￥\d]/g, '').trim()
      if (context.length >= 2 && context.length <= 15) {
        return context
      }
      return keyword
    }
  }

  // 策略 4：取清洗后的第一个有意义的词
  const parts = cleaned.split(/\s+/).filter(p => p.length >= 2 && !/^\d+$/.test(p))
  if (parts.length > 0) {
    return parts[0].slice(0, 15)
  }

  return ''
}

/**
 * 识别支付平台
 * @param {string} text
 * @returns {'wechat' | 'alipay' | 'bank' | 'other'}
 */
export function extractPlatform(text) {
  if (!text) return 'other'
  for (const platform of PLATFORM_PATTERNS) {
    if (platform.keywords.some(kw => text.includes(kw))) {
      return platform.name
    }
  }
  return 'other'
}

/**
 * 判断文本是否像一条支付通知
 * @param {string} text
 * @returns {boolean}
 */
export function isPaymentText(text) {
  if (!text) return false
  const paymentKeywords = [
    '支付', '付款', '交易', '扣款', '支出', '消费',
    '¥', '￥', '元', '订单', '商户', '收款',
    '微信', '支付宝', '银行卡'
  ]
  return paymentKeywords.some(kw => text.includes(kw))
}

/**
 * 解析支付文本，返回完整结构
 * @param {string} text
 * @returns {{ amount: number, merchant: string, platform: string, category: string, type: string } | null}
 */
export function parsePaymentText(text) {
  if (!text || !isPaymentText(text)) return null

  const amountResult = extractAmount(text)
  if (!amountResult || amountResult.amount <= 0) return null

  const merchant = extractMerchant(text)
  const platform = extractPlatform(text)
  // 用商家名推测分类
  const category = guessCategory(merchant)

  return {
    amount: amountResult.amount,
    merchant,
    platform,
    category,
    type: 'expense' // 默认支出
  }
}

/**
 * 根据商家名称推测分类
 * @param {string} merchant
 * @returns {string}
 */
export function guessCategory(merchant) {
  if (!merchant) return 'other'
  for (const [keyword, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (merchant.includes(keyword)) return category
  }
  return 'other'
}
