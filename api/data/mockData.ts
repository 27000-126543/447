import type {
  User,
  AlertItem,
  GMVTrendPoint,
  ChannelStat,
  DashboardOverview,
  Order,
  OrderChannel,
  OrderStatus,
  OrderItem,
  InventoryForecast,
  PurchaseOrder,
  POStatus,
  ApprovalHistory,
  LifecycleDistribution,
  MarketingCampaign,
  ABTestGroup,
  OperationLog,
  RecommendationStrategy,
  RecommendationMetrics,
  RuleConfig,
  PermissionRole,
} from '../../shared/types.js';

const CHANNELS: OrderChannel[] = ['self', 'social', 'distributor'];
const CHANNEL_NAMES: Record<OrderChannel, string> = {
  self: '自营渠道',
  social: '社交电商',
  distributor: '分销商',
};
const REGIONS = ['华北', '华东', '华南', '华中', '西南', '西北'];
const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'refunded', 'cancelled'];
const ORDER_STATUS_NAMES: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  refunded: '已退款',
  cancelled: '已取消',
};
const SKU_CATEGORIES = ['手机数码', '家用电器', '服饰鞋包', '美妆护肤', '食品饮料', '母婴用品', '家居日用', '运动户外'];
const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡'];
const LAST_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '霞', '平', '刚'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(prefix = ''): string {
  return prefix + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}

function randomDateWithinDays(days: number, endDate?: Date): string {
  const end = endDate || new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const time = randomInt(start.getTime(), end.getTime());
  return new Date(time).toISOString();
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function randomPhone(): string {
  return '1' + randomInt(3, 9) + Array.from({ length: 9 }, () => randomInt(0, 9)).join('');
}

function randomName(): string {
  return randomChoice(FIRST_NAMES) + randomChoice(LAST_NAMES);
}

function randomChineseAddress(region: string): string {
  const cities: Record<string, string[]> = {
    华北: ['北京市', '天津市', '石家庄市', '太原市', '呼和浩特市'],
    华东: ['上海市', '南京市', '杭州市', '合肥市', '福州市', '济南市', '南昌市'],
    华南: ['广州市', '深圳市', '南宁市', '海口市'],
    华中: ['郑州市', '武汉市', '长沙市'],
    西南: ['重庆市', '成都市', '贵阳市', '昆明市', '拉萨市'],
    西北: ['西安市', '兰州市', '西宁市', '银川市', '乌鲁木齐市'],
  };
  const city = randomChoice(cities[region] || cities['华东']);
  const streets = ['中山路', '解放路', '人民路', '建设路', '和平路', '长江路', '黄河路'];
  return `${city}${randomChoice(streets)}${randomInt(1, 999)}号`;
}

function generateSkuName(category: string, index: number): string {
  const names: Record<string, string[]> = {
    手机数码: ['智能手机', '平板电脑', '蓝牙耳机', '智能手表', '充电宝', '数据线', '充电器', '相机'],
    家用电器: ['空调', '冰箱', '洗衣机', '电视', '微波炉', '电饭煲', '热水器', '吸尘器'],
    服饰鞋包: ['T恤', '牛仔裤', '运动鞋', '连衣裙', '羽绒服', '手提包', '围巾', '帽子'],
    美妆护肤: ['面霜', '洗面奶', '口红', '粉底液', '香水', '面膜', '精华液', '防晒霜'],
    食品饮料: ['坚果礼盒', '牛奶', '茶叶', '咖啡豆', '巧克力', '红酒', '饼干', '果汁'],
    母婴用品: ['婴儿奶粉', '纸尿裤', '婴儿车', '奶瓶', '玩具', '儿童服装', '学步车', '辅食'],
    家居日用: ['床上四件套', '枕头', '被子', '收纳盒', '垃圾桶', '洗衣液', '纸巾', '毛巾'],
    运动户外: ['跑步鞋', '瑜伽垫', '篮球', '羽毛球拍', '帐篷', '睡袋', '登山杖', '骑行头盔'],
  };
  const base = randomChoice(names[category] || names['手机数码']);
  return `${base} ${['Pro', 'Max', 'Plus', '标准版', '豪华版', '限定版', '经典款', '新款'][index % 8]}`;
}

export const mockUsers: User[] = [
  {
    id: 'U001',
    username: 'admin',
    name: '陈志远',
    role: 'super_admin',
    roleName: '超级管理员',
    permissions: [
      'user:manage', 'order:view', 'order:edit', 'inventory:view', 'inventory:edit',
      'purchase:approve', 'marketing:manage', 'system:config', 'report:view', 'audit:view',
    ],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: 'U002',
    username: 'region_manager',
    name: '李慧敏',
    role: 'region_manager',
    roleName: '区域经理',
    region: '华东',
    permissions: [
      'order:view', 'order:edit', 'inventory:view', 'report:view',
    ],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
  },
  {
    id: 'U003',
    username: 'operator',
    name: '王俊杰',
    role: 'operator',
    roleName: '运营专员',
    region: '华南',
    permissions: [
      'order:view', 'inventory:view', 'marketing:manage', 'report:view',
    ],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operator',
  },
  {
    id: 'U004',
    username: 'finance',
    name: '赵雅琴',
    role: 'finance',
    roleName: '财务',
    permissions: [
      'order:view', 'purchase:approve', 'report:view', 'reconcile:view',
    ],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=finance',
  },
  {
    id: 'U005',
    username: 'warehouse',
    name: '刘国强',
    role: 'warehouse',
    roleName: '仓储管理员',
    permissions: [
      'inventory:view', 'inventory:edit', 'purchase:approve', 'order:view',
    ],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=warehouse',
  },
];

const POOL_SKU_NAMES: { skuId: string; skuName: string; category: string; price: number; image: string }[] = [];
for (let i = 0; i < 220; i++) {
  const category = SKU_CATEGORIES[i % SKU_CATEGORIES.length];
  const price = randomFloat(29, 4999, 2);
  POOL_SKU_NAMES.push({
    skuId: `SKU${String(i + 1).padStart(5, '0')}`,
    skuName: generateSkuName(category, i),
    category,
    price,
    image: `https://picsum.photos/seed/sku${i + 1}/200/200`,
  });
}

export function generateOrders(count: number): Order[] {
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    const channel = randomChoice(CHANNELS);
    const status = randomChoice(ORDER_STATUSES);
    const region = randomChoice(REGIONS);
    const itemCount = randomInt(1, 4);
    const items: OrderItem[] = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const sku = randomChoice(POOL_SKU_NAMES);
      const qty = randomInt(1, 3);
      items.push({
        skuId: sku.skuId,
        skuName: sku.skuName,
        image: sku.image,
        price: sku.price,
        quantity: qty,
      });
      totalAmount += sku.price * qty;
    }
    totalAmount = Number(totalAmount.toFixed(2));
    const createdAt = randomDateWithinDays(30);
    let paidAt: string | undefined;
    let shippedAt: string | undefined;
    if (status !== 'pending' && status !== 'cancelled') {
      const d = new Date(createdAt);
      d.setHours(d.getHours() + randomInt(1, 24));
      paidAt = d.toISOString();
    }
    if (status === 'shipped' || status === 'completed' || status === 'refunded') {
      const d = new Date(paidAt || createdAt);
      d.setHours(d.getHours() + randomInt(2, 48));
      shippedAt = d.toISOString();
    }
    orders.push({
      id: randomId('ORD'),
      orderNo: `ORD${Date.now().toString().slice(-6)}${String(i + 1).padStart(6, '0')}`,
      channel,
      channelName: CHANNEL_NAMES[channel],
      status,
      statusName: ORDER_STATUS_NAMES[status],
      amount: totalAmount,
      userId: `C${randomInt(1, 500)}`,
      userName: randomName(),
      userPhone: randomPhone(),
      region,
      items,
      createdAt,
      paidAt,
      shippedAt,
      address: randomChineseAddress(region),
    });
  }
  return orders;
}

export const mockOrders: Order[] = generateOrders(1200);

export function generateGMVTrend(days: number): GMVTrendPoint[] {
  const trend: GMVTrendPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    let base = 180000;
    if (weekday === 0 || weekday === 6) base = 280000;
    const value = Math.round(base + (Math.random() - 0.5) * 80000);
    trend.push({
      date: formatDate(d),
      value: Math.max(50000, value),
    });
  }
  return trend;
}

export const mockGMVTrend: GMVTrendPoint[] = generateGMVTrend(30);

export const mockChannelStats: ChannelStat[] = [
  { name: '自营渠道', value: 1856420, color: '#3B82F6' },
  { name: '社交电商', value: 1245830, color: '#10B981' },
  { name: '分销商', value: 896710, color: '#F59E0B' },
];

const totalGMV = mockGMVTrend.reduce((sum, p) => sum + p.value, 0);
export const mockDashboardOverview: DashboardOverview = {
  gmv: {
    today: mockGMVTrend[mockGMVTrend.length - 1].value,
    week: mockGMVTrend.slice(-7).reduce((sum, p) => sum + p.value, 0),
    month: totalGMV,
    yoy: 12.5,
    mom: 8.3,
    trend: mockGMVTrend,
  },
  channels: mockChannelStats,
  metrics: {
    refundRate: 2.8,
    conversionRate: 4.6,
    avgOrderValue: 386.5,
    inventoryTurnover: 5.2,
  },
  alerts: [],
};

export function generateInventoryForecast(count: number): InventoryForecast[] {
  const list: InventoryForecast[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const sku = POOL_SKU_NAMES[i % POOL_SKU_NAMES.length];
    const currentStock = randomInt(50, 800);
    const safeStock = randomInt(80, 200);
    const forecast30d: { date: string; actual?: number; predicted: number }[] = [];
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const base = randomInt(20, 150);
      forecast30d.push({
        date: formatDate(date),
        predicted: Math.round(base * (0.8 + Math.random() * 0.6)),
      });
    }
    const festivalFactors: { date: string; name: string; impact: number }[] = [];
    const festivalDates = [7, 14, 21];
    const festivalNames = ['618促销', '周末促销', '品牌日'];
    festivalDates.forEach((fd, idx) => {
      if (fd < 30) {
        const date = new Date(today);
        date.setDate(date.getDate() + fd);
        festivalFactors.push({
          date: formatDate(date),
          name: festivalNames[idx],
          impact: randomFloat(1.3, 2.5, 1),
        });
      }
    });
    const avgDaily = Math.round(forecast30d.reduce((s, f) => s + f.predicted, 0) / 30);
    const suggestedReplenish = Math.max(0, safeStock + avgDaily * 14 - currentStock);
    list.push({
      skuId: sku.skuId,
      skuName: sku.skuName,
      category: sku.category,
      currentStock,
      safeStock,
      forecast30d,
      festivalFactors,
      suggestedReplenish,
      unitPrice: sku.price,
    });
  }
  return list;
}

export const mockInventoryForecast: InventoryForecast[] = generateInventoryForecast(220);

function generateApprovalHistory(status: POStatus, createdBy: string): ApprovalHistory[] {
  const history: ApprovalHistory[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - randomInt(1, 15));
  let version = 1;
  history.push({
    step: 1,
    role: '运营专员',
    user: createdBy,
    action: 'submit',
    comment: '提交采购申请',
    createdAt: baseDate.toISOString(),
    version,
  });
  if (status !== 'draft') {
    version++;
    baseDate.setHours(baseDate.getHours() + randomInt(2, 8));
    history.push({
      step: 2,
      role: '财务',
      user: '赵雅琴',
      action: 'approve',
      comment: '财务审核通过',
      createdAt: baseDate.toISOString(),
      version,
    });
  }
  if (status === 'warehouse_pending' || status === 'approved' || status === 'completed') {
    version++;
    baseDate.setHours(baseDate.getHours() + randomInt(2, 8));
    history.push({
      step: 3,
      role: '仓储管理员',
      user: '刘国强',
      action: 'approve',
      comment: '仓储确认收货安排',
      createdAt: baseDate.toISOString(),
      version,
    });
  }
  if (status === 'rejected') {
    const maxRejectStep = history.length;
    const rejectStep = maxRejectStep >= 2 ? randomChoice([2, Math.min(3, maxRejectStep)]) : 1;
    history.length = rejectStep;
    const lastRecord = history[history.length - 1];
    if (!lastRecord) return history;
    const d = new Date(lastRecord.createdAt);
    d.setHours(d.getHours() + randomInt(1, 4));
    history.push({
      step: rejectStep + 1,
      role: rejectStep === 2 ? '财务' : '仓储管理员',
      user: rejectStep === 2 ? '赵雅琴' : '刘国强',
      action: 'reject',
      comment: randomChoice(['预算不足，请调整采购数量', '该商品不在采购目录内', '供应商资质待审核']),
      createdAt: d.toISOString(),
      version,
    });
  }
  if (status === 'completed') {
    if (history.length === 0) return history;
    const d = new Date(history[history.length - 1].createdAt);
    d.setDate(d.getDate() + randomInt(1, 3));
    history.push({
      step: 4,
      role: '仓储管理员',
      user: '刘国强',
      action: 'approve',
      comment: '已完成入库',
      createdAt: d.toISOString(),
      version: ++version,
    });
  }
  return history;
}

const PO_STATUS_NAMES: Record<POStatus, string> = {
  draft: '草稿',
  finance_pending: '财务待审批',
  warehouse_pending: '仓储待确认',
  approved: '审批通过',
  rejected: '已驳回',
  completed: '已完成',
};

export function generatePurchaseOrders(count: number): PurchaseOrder[] {
  const list: PurchaseOrder[] = [];
  const statuses: POStatus[] = ['draft', 'finance_pending', 'warehouse_pending', 'approved', 'rejected', 'completed'];
  const currentApprovers: Record<POStatus, string> = {
    draft: '-',
    finance_pending: '赵雅琴',
    warehouse_pending: '刘国强',
    approved: '-',
    rejected: '-',
    completed: '-',
  };
  for (let i = 0; i < count; i++) {
    const status = randomChoice(statuses);
    const itemCount = randomInt(2, 6);
    const items: { skuId: string; skuName: string; quantity: number; unitPrice: number }[] = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const sku = randomChoice(POOL_SKU_NAMES);
      const qty = randomInt(10, 500);
      items.push({
        skuId: sku.skuId,
        skuName: sku.skuName,
        quantity: qty,
        unitPrice: sku.price,
      });
      totalAmount += sku.price * qty;
    }
    const createdAt = randomDateWithinDays(20);
    const expectedDate = new Date(createdAt);
    expectedDate.setDate(expectedDate.getDate() + randomInt(7, 20));
    list.push({
      id: randomId('PO'),
      poNo: `PO${Date.now().toString().slice(-4)}${String(i + 1).padStart(4, '0')}`,
      items,
      totalAmount: Number(totalAmount.toFixed(2)),
      status,
      statusName: PO_STATUS_NAMES[status],
      currentApprover: currentApprovers[status],
      approvalHistory: generateApprovalHistory(status, '王俊杰'),
      createdAt,
      createdBy: '王俊杰',
      expectedDate: expectedDate.toISOString(),
    });
  }
  return list;
}

export const mockPurchaseOrders: PurchaseOrder[] = generatePurchaseOrders(50);

export function generateLifecycleDistribution(): LifecycleDistribution {
  const today = new Date();
  const trend: { date: string; new: number; active: number; dormant: number; churned: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    trend.push({
      date: formatDate(d),
      new: randomInt(80, 200),
      active: randomInt(1200, 2500),
      dormant: randomInt(500, 1000),
      churned: randomInt(20, 80),
    });
  }
  return {
    newCustomers: 1820,
    activeCustomers: 18560,
    dormantCustomers: 7230,
    churnedCustomers: 960,
    trend,
  };
}

export const mockLifecycleDistribution: LifecycleDistribution = generateLifecycleDistribution();

const CAMPAIGN_STATUS_NAMES: Record<string, string> = {
  draft: '草稿',
  running: '进行中',
  paused: '已暂停',
  completed: '已完成',
};

function generateABTest(): { enabled: boolean; groups: ABTestGroup[] } {
  const enabled = Math.random() > 0.4;
  if (!enabled) {
    return { enabled: false, groups: [{ name: '对照组', allocation: 100 }] };
  }
  const groups: ABTestGroup[] = [
    {
      name: '对照组',
      allocation: 50,
      metrics: {
        impressions: randomInt(50000, 200000),
        clicks: randomInt(2000, 10000),
        conversions: randomInt(100, 800),
      },
    },
    {
      name: '实验组',
      allocation: 50,
      metrics: {
        impressions: randomInt(50000, 200000),
        clicks: randomInt(2500, 12000),
        conversions: randomInt(150, 1000),
      },
    },
  ];
  return { enabled: true, groups };
}

export function generateMarketingCampaigns(count: number): MarketingCampaign[] {
  const list: MarketingCampaign[] = [];
  const statuses: Array<'draft' | 'running' | 'paused' | 'completed'> = ['draft', 'running', 'paused', 'completed'];
  const segments = ['全部用户', '新注册用户', '沉睡用户', '高价值用户', '流失召回用户'];
  const campaignNames = [
    '新春大促活动', '618年中大促', '双十一狂欢节', '双十二盛典', '会员专属折扣',
    '新人注册礼包', '限时秒杀活动', '满减优惠活动', '品牌联合推广', '社交分享裂变',
    '节日主题活动', '周年庆回馈', '拼团优惠', '邀请好友返利', '签到打卡活动',
    '新品首发预热', '清仓特卖会', '积分兑换季', 'VIP专属日', '生日礼遇',
    '开学季特惠', '情人节专场', '母亲节感恩', '父亲节献礼', '圣诞跨年狂欢',
  ];
  for (let i = 0; i < count; i++) {
    const status = randomChoice(statuses);
    const totalImpressions = randomInt(100000, 500000);
    const totalConversions = randomInt(500, 5000);
    const createdAt = randomDateWithinDays(60);
    const startDate = new Date(createdAt);
    startDate.setDate(startDate.getDate() + randomInt(0, 5));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + randomInt(3, 30));
    list.push({
      id: randomId('CAMP'),
      name: campaignNames[i % campaignNames.length],
      targetSegment: randomChoice(segments),
      status,
      statusName: CAMPAIGN_STATUS_NAMES[status],
      channels: ['self', 'social', 'distributor'].slice(0, randomInt(1, 3)),
      abTest: generateABTest(),
      createdAt,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalImpressions,
      totalConversions,
      conversionRate: Number(((totalConversions / totalImpressions) * 100).toFixed(2)),
    });
  }
  return list;
}

export const mockMarketingCampaigns: MarketingCampaign[] = generateMarketingCampaigns(25);

const ALERT_TITLES: Record<string, Array<{ title: string; description: string }>> = {
  critical: [
    { title: '库存告急', description: 'SKU00123 库存低于安全水位，当前库存仅余 25 件' },
    { title: '支付系统异常', description: '支付接口响应超时，近5分钟失败率达 12.5%' },
    { title: '订单履约延迟', description: '华东仓待发货订单超过 500 单，超出处理能力' },
    { title: '数据同步失败', description: 'ERP 系统数据同步中断已超过 30 分钟' },
  ],
  warning: [
    { title: '退款率偏高', description: '社交电商渠道近7日退款率达 5.2%，超过阈值 4%' },
    { title: '库存预警', description: '15 个 SKU 库存接近安全水位，建议提前补货' },
    { title: '活动效果不及预期', description: '双十一预热活动 CTR 仅 1.8%，低于目标 3%' },
    { title: '服务器负载偏高', description: '主数据库 CPU 使用率达 82%，持续 10 分钟以上' },
  ],
  info: [
    { title: '新用户注册高峰', description: '今日新注册用户突破 500 人，环比增长 35%' },
    { title: '补货完成', description: '采购单 PO00128 已完成入库，共计 25 个 SKU' },
    { title: '活动上线', description: '618预热活动已成功推送到所有渠道' },
    { title: '数据报表生成', description: '5月销售数据报表已生成，请查收' },
  ],
};

export function generateAlerts(count: number): AlertItem[] {
  const list: AlertItem[] = [];
  const types: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];
  const statuses: Array<'pending' | 'processing' | 'resolved'> = ['pending', 'processing', 'resolved'];
  for (let i = 0; i < count; i++) {
    const type = randomChoice(types);
    const template = randomChoice(ALERT_TITLES[type]);
    list.push({
      id: randomId('ALT'),
      type,
      title: template.title,
      description: template.description,
      channel: randomChoice(['self', 'social', 'distributor', 'system']),
      createdAt: randomDateWithinDays(15),
      status: randomChoice(statuses),
      assignee: randomChoice(['陈志远', '李慧敏', '王俊杰', '赵雅琴', '刘国强']),
    });
  }
  return list;
}

export const mockAlerts: AlertItem[] = generateAlerts(35);

const AUDIT_ACTIONS = [
  { action: '登录系统', target: '用户认证' },
  { action: '退出登录', target: '用户认证' },
  { action: '创建订单', target: '订单管理' },
  { action: '修改订单', target: '订单管理' },
  { action: '取消订单', target: '订单管理' },
  { action: '退款审核', target: '订单管理' },
  { action: '添加库存', target: '库存管理' },
  { action: '调整库存', target: '库存管理' },
  { action: '创建采购单', target: '采购管理' },
  { action: '审批采购单', target: '采购管理' },
  { action: '驳回采购单', target: '采购管理' },
  { action: '创建营销活动', target: '营销管理' },
  { action: '启动营销活动', target: '营销管理' },
  { action: '停用营销活动', target: '营销管理' },
  { action: '修改用户权限', target: '系统管理' },
  { action: '新增用户', target: '系统管理' },
  { action: '修改规则配置', target: '规则引擎' },
  { action: '导出报表', target: '报表中心' },
  { action: '查看敏感数据', target: '数据安全' },
  { action: '修改推荐策略', target: '推荐系统' },
];

export function generateOperationLogs(count: number): OperationLog[] {
  const list: OperationLog[] = [];
  for (let i = 0; i < count; i++) {
    const user = randomChoice(mockUsers);
    const actionTemplate = randomChoice(AUDIT_ACTIONS);
    list.push({
      id: randomId('LOG'),
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: actionTemplate.action,
      target: actionTemplate.target,
      detail: `${user.name} ${actionTemplate.action}`,
      ip: `${randomInt(10, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
      createdAt: randomDateWithinDays(30),
    });
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const mockOperationLogs: OperationLog[] = generateOperationLogs(80);

export const mockRecommendationStrategies: RecommendationStrategy[] = [
  {
    id: 'RS001',
    name: '首页个性化推荐',
    enabled: true,
    weights: {
      behavior: 0.35,
      history: 0.25,
      similarity: 0.20,
      popularity: 0.15,
      novelty: 0.05,
    },
    channel: 'self',
    updatedAt: randomDateWithinDays(3),
  },
  {
    id: 'RS002',
    name: '商品详情页相关推荐',
    enabled: true,
    weights: {
      behavior: 0.15,
      history: 0.10,
      similarity: 0.55,
      popularity: 0.15,
      novelty: 0.05,
    },
    channel: 'self',
    updatedAt: randomDateWithinDays(5),
  },
  {
    id: 'RS003',
    name: '社交电商猜你喜欢',
    enabled: true,
    weights: {
      behavior: 0.30,
      history: 0.20,
      similarity: 0.15,
      popularity: 0.25,
      novelty: 0.10,
    },
    channel: 'social',
    updatedAt: randomDateWithinDays(7),
  },
];

export function generateRecommendationMetrics(): RecommendationMetrics {
  const today = new Date();
  const dailyTrend: { date: string; ctr: number; cvr: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyTrend.push({
      date: formatDate(d),
      ctr: randomFloat(2.5, 6.5, 2),
      cvr: randomFloat(0.8, 3.5, 2),
    });
  }
  return {
    overall: {
      impressions: 2580000,
      clicks: 103200,
      conversions: 18576,
      ctr: 4.0,
      cvr: 1.8,
      revenue: 6845320,
    },
    byChannel: [
      { channel: '自营渠道', impressions: 1250000, clicks: 56250, ctr: 4.5, revenue: 3856420 },
      { channel: '社交电商', impressions: 820000, clicks: 30340, ctr: 3.7, revenue: 1825710 },
      { channel: '分销商', impressions: 510000, clicks: 16610, ctr: 3.26, revenue: 1163190 },
    ],
    dailyTrend,
  };
}

export const mockRecommendationMetrics: RecommendationMetrics = generateRecommendationMetrics();

export const mockRuleConfigs: RuleConfig[] = [
  {
    id: 'RULE001',
    name: '库存自动补货规则',
    description: '当SKU库存低于安全水位的80%时自动触发采购建议',
    category: 'replenish',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: { cron: '0 0 2 * * *' },
    },
    conditions: [
      { id: 'C1', field: 'currentStock', operator: 'lt', value: 0.8 },
      { id: 'C2', field: 'category', operator: 'contains', value: '手机数码' },
    ],
    actions: [
      { id: 'A1', type: 'createPurchaseSuggestion', params: { autoSubmit: false, notify: true } },
    ],
    createdAt: randomDateWithinDays(60),
    updatedAt: randomDateWithinDays(10),
  },
  {
    id: 'RULE002',
    name: '节假日自动定价上浮',
    description: '大促前7天对热门商品自动上调价格10%',
    category: 'pricing',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: { cron: '0 0 0 * * *' },
    },
    conditions: [
      { id: 'C1', field: 'isFestival', operator: 'eq', value: true },
      { id: 'C2', field: 'salesRank', operator: 'lte', value: 100 },
    ],
    actions: [
      { id: 'A1', type: 'adjustPrice', params: { rate: 1.1, duration: '7d' } },
    ],
    createdAt: randomDateWithinDays(90),
    updatedAt: randomDateWithinDays(20),
  },
  {
    id: 'RULE003',
    name: '高退款率自动预警',
    description: '单渠道单日退款率超过5%时自动发送告警',
    category: 'other',
    enabled: true,
    trigger: {
      type: 'event',
      config: { event: 'orderRefunded' },
    },
    conditions: [
      { id: 'C1', field: 'refundRate', operator: 'gt', value: 0.05 },
      { id: 'C2', field: 'timeWindow', operator: 'eq', value: '1d' },
    ],
    actions: [
      { id: 'A1', type: 'sendAlert', params: { level: 'warning', channels: ['email', 'sms'] } },
    ],
    createdAt: randomDateWithinDays(45),
    updatedAt: randomDateWithinDays(5),
  },
  {
    id: 'RULE004',
    name: '大客户自动折扣',
    description: '历史订单金额超过10万的客户自动享受95折',
    category: 'pricing',
    enabled: true,
    trigger: {
      type: 'event',
      config: { event: 'orderCreated' },
    },
    conditions: [
      { id: 'C1', field: 'userTotalSpent', operator: 'gt', value: 100000 },
    ],
    actions: [
      { id: 'A1', type: 'applyDiscount', params: { rate: 0.95 } },
    ],
    createdAt: randomDateWithinDays(120),
    updatedAt: randomDateWithinDays(30),
  },
  {
    id: 'RULE005',
    name: '订单超时自动取消',
    description: '待支付订单超过30分钟自动取消',
    category: 'other',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: { cron: '0 */5 * * * *' },
    },
    conditions: [
      { id: 'C1', field: 'status', operator: 'eq', value: 'pending' },
      { id: 'C2', field: 'pendingMinutes', operator: 'gt', value: 30 },
    ],
    actions: [
      { id: 'A1', type: 'cancelOrder', params: { reason: '支付超时' } },
    ],
    createdAt: randomDateWithinDays(100),
    updatedAt: randomDateWithinDays(15),
  },
  {
    id: 'RULE006',
    name: '财务对账自动核对',
    description: '每日凌晨自动核对渠道账单与系统订单',
    category: 'reconcile',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: { cron: '0 0 3 * * *' },
    },
    conditions: [
      { id: 'C1', field: 'reconcileDate', operator: 'eq', value: 'yesterday' },
    ],
    actions: [
      { id: 'A1', type: 'runReconciliation', params: { autoFix: false } },
      { id: 'A2', type: 'sendReport', params: { to: 'finance@company.com' } },
    ],
    createdAt: randomDateWithinDays(80),
    updatedAt: randomDateWithinDays(10),
  },
  {
    id: 'RULE007',
    name: '滞销商品自动降价',
    description: '库存超过90天未动销的商品自动降价15%',
    category: 'pricing',
    enabled: false,
    trigger: {
      type: 'schedule',
      config: { cron: '0 0 1 * * 1' },
    },
    conditions: [
      { id: 'C1', field: 'daysWithoutSales', operator: 'gt', value: 90 },
      { id: 'C2', field: 'currentStock', operator: 'gt', value: 50 },
    ],
    actions: [
      { id: 'A1', type: 'adjustPrice', params: { rate: 0.85 } },
    ],
    createdAt: randomDateWithinDays(70),
    updatedAt: randomDateWithinDays(25),
  },
  {
    id: 'RULE008',
    name: '异常订单自动标记',
    description: '单次下单金额超过5万元的订单自动标记为待审核',
    category: 'other',
    enabled: true,
    trigger: {
      type: 'threshold',
      config: { field: 'orderAmount', threshold: 50000 },
    },
    conditions: [
      { id: 'C1', field: 'amount', operator: 'gt', value: 50000 },
    ],
    actions: [
      { id: 'A1', type: 'flagOrder', params: { reason: '大额订单审核' } },
      { id: 'A2', type: 'notify', params: { role: 'operator' } },
    ],
    createdAt: randomDateWithinDays(55),
    updatedAt: randomDateWithinDays(8),
  },
];

export const mockPermissionRoles: PermissionRole[] = [
  {
    id: 'PR001',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限',
    permissions: [
      'user:manage', 'user:view', 'role:manage', 'role:view',
      'order:view', 'order:edit', 'order:export',
      'inventory:view', 'inventory:edit', 'inventory:export',
      'purchase:view', 'purchase:create', 'purchase:approve',
      'marketing:view', 'marketing:manage',
      'report:view', 'report:export',
      'rule:view', 'rule:manage',
      'strategy:view', 'strategy:manage',
      'audit:view', 'system:config',
    ],
    dataScope: 'all',
  },
  {
    id: 'PR002',
    name: '区域经理',
    code: 'region_manager',
    description: '负责所辖区域的运营管理',
    permissions: [
      'user:view',
      'order:view', 'order:edit', 'order:export',
      'inventory:view',
      'purchase:view',
      'marketing:view',
      'report:view', 'report:export',
    ],
    dataScope: 'region',
  },
  {
    id: 'PR003',
    name: '运营专员',
    code: 'operator',
    description: '负责日常运营及营销活动管理',
    permissions: [
      'order:view',
      'inventory:view',
      'purchase:view', 'purchase:create',
      'marketing:view', 'marketing:manage',
      'report:view',
      'rule:view',
    ],
    dataScope: 'self',
  },
  {
    id: 'PR004',
    name: '财务',
    code: 'finance',
    description: '负责财务审批与对账',
    permissions: [
      'order:view', 'order:export',
      'inventory:view',
      'purchase:view', 'purchase:approve',
      'report:view', 'report:export',
      'rule:view',
    ],
    dataScope: 'all',
  },
  {
    id: 'PR005',
    name: '仓储管理员',
    code: 'warehouse',
    description: '负责库存管理与入库确认',
    permissions: [
      'order:view',
      'inventory:view', 'inventory:edit',
      'purchase:view', 'purchase:approve',
      'report:view',
    ],
    dataScope: 'self',
  },
];

export const users: Record<string, User & { password: string }> = {
  admin: { ...mockUsers[0], password: 'admin123' },
  region_manager: { ...mockUsers[1], password: '123456' },
  operator: { ...mockUsers[2], password: '123456' },
  finance: { ...mockUsers[3], password: '123456' },
  warehouse: { ...mockUsers[4], password: '123456' },
};

export const dashboardData: DashboardOverview = {
  ...mockDashboardOverview,
  alerts: mockAlerts.slice(0, 5),
};

export const inventoryForecasts = mockInventoryForecast;
export const purchaseOrders = mockPurchaseOrders;
export const lifecycleData = mockLifecycleDistribution;
export const marketingCampaigns = mockMarketingCampaigns;
export const orders = mockOrders;
export const recommendationStrategies = mockRecommendationStrategies;
export const recommendationMetrics = mockRecommendationMetrics;
export const rules = mockRuleConfigs;
export const permissionRoles = mockPermissionRoles;
export const operationLogs = mockOperationLogs;
