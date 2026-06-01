/**
 * 示例数据 - 首次使用时自动填充
 */

export const seedData = [
  {
    type: 'expense',
    amount: 128.50,
    category: 'food',
    paymentTime: '2026-06-01T12:30:00+08:00',
    merchant: '黄焖鸡米饭（大厦店）',
    orderNumber: '2026060120012345678',
    platform: 'wechat',
    description: '午餐 - 黄焖鸡米饭'
  },
  {
    type: 'expense',
    amount: 35.00,
    category: 'transport',
    paymentTime: '2026-06-01T08:15:00+08:00',
    merchant: '深圳通',
    orderNumber: '2026060120012345679',
    platform: 'alipay',
    description: '地铁通勤'
  },
  {
    type: 'expense',
    amount: 256.00,
    category: 'shopping',
    paymentTime: '2026-05-31T19:45:00+08:00',
    merchant: '沃尔玛超市',
    orderNumber: '',
    platform: 'wechat',
    description: '超市购物'
  },
  {
    type: 'expense',
    amount: 1500.00,
    category: 'hotel',
    paymentTime: '2026-05-30T10:00:00+08:00',
    merchant: '自如租房',
    orderNumber: '2026053010034567890',
    platform: 'bank',
    description: '房租'
  },
  {
    type: 'expense',
    amount: 19.90,
    category: 'food',
    paymentTime: '2026-05-29T21:20:00+08:00',
    merchant: '美宜佳便利店',
    orderNumber: '',
    platform: 'other',
    description: '便利店零食'
  },
  {
    type: 'income',
    amount: 5000.00,
    category: 'transfer',
    paymentTime: '2026-05-28T09:00:00+08:00',
    merchant: '',
    orderNumber: '',
    platform: 'bank',
    description: '工资收入'
  }
]
