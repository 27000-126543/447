export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export type UserRole = 'super_admin' | 'region_manager' | 'operator' | 'finance' | 'warehouse';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleName: string;
  region?: string;
  permissions: string[];
  avatar?: string;
}

export interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  channel?: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'resolved';
  assignee?: string;
}

export interface GMVTrendPoint {
  date: string;
  value: number;
}

export interface ChannelStat {
  name: string;
  value: number;
  color: string;
}

export interface DashboardOverview {
  gmv: {
    today: number;
    week: number;
    month: number;
    yoy: number;
    mom: number;
    trend: GMVTrendPoint[];
  };
  channels: ChannelStat[];
  metrics: {
    refundRate: number;
    conversionRate: number;
    avgOrderValue: number;
    inventoryTurnover: number;
  };
  alerts: AlertItem[];
}

export type OrderChannel = 'self' | 'social' | 'distributor';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'refunded' | 'cancelled';

export interface OrderItem {
  skuId: string;
  skuName: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNo: string;
  channel: OrderChannel;
  channelName: string;
  status: OrderStatus;
  statusName: string;
  amount: number;
  userId: string;
  userName: string;
  userPhone: string;
  region: string;
  items: OrderItem[];
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  address?: string;
}

export interface OrderListResponse {
  list: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryForecast {
  skuId: string;
  skuName: string;
  category: string;
  currentStock: number;
  safeStock: number;
  forecast30d: { date: string; actual?: number; predicted: number }[];
  festivalFactors: { date: string; name: string; impact: number }[];
  suggestedReplenish: number;
  unitPrice: number;
}

export type POStatus = 'draft' | 'finance_pending' | 'warehouse_pending' | 'approved' | 'rejected' | 'completed';

export interface ApprovalHistory {
  step: number;
  role: string;
  user: string;
  action: 'submit' | 'approve' | 'reject';
  comment?: string;
  createdAt: string;
  version: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  items: { skuId: string; skuName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  status: POStatus;
  statusName: string;
  currentApprover: string;
  approvalHistory: ApprovalHistory[];
  createdAt: string;
  createdBy: string;
  expectedDate?: string;
}

export interface LifecycleDistribution {
  newCustomers: number;
  activeCustomers: number;
  dormantCustomers: number;
  churnedCustomers: number;
  trend: { date: string; new: number; active: number; dormant: number; churned: number }[];
}

export interface ABTestGroup {
  name: string;
  allocation: number;
  metrics?: { impressions: number; clicks: number; conversions: number };
}

export interface MarketingCampaign {
  id: string;
  name: string;
  targetSegment: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  statusName: string;
  channels: string[];
  abTest?: {
    enabled: boolean;
    groups: ABTestGroup[];
  };
  createdAt: string;
  startDate?: string;
  endDate?: string;
  totalImpressions?: number;
  totalConversions?: number;
  conversionRate?: number;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  detail: string;
  ip?: string;
  createdAt: string;
}

export interface RecommendationStrategy {
  id: string;
  name: string;
  enabled: boolean;
  weights: {
    behavior: number;
    history: number;
    similarity: number;
    popularity: number;
    novelty: number;
  };
  channel: string;
  updatedAt: string;
}

export interface RecommendationMetrics {
  overall: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    revenue: number;
  };
  byChannel: { channel: string; impressions: number; clicks: number; ctr: number; revenue: number }[];
  dailyTrend: { date: string; ctr: number; cvr: number }[];
}

export interface RuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'pricing' | 'replenish' | 'reconcile' | 'other';
  enabled: boolean;
  trigger: {
    type: 'schedule' | 'event' | 'threshold';
    config: Record<string, unknown>;
  };
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'contains';
  value: unknown;
}

export interface RuleAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

export interface PermissionRole {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  dataScope: 'all' | 'region' | 'self';
}
