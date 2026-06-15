export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export type UserRole = 'super_admin' | 'region_manager' | 'operator' | 'finance' | 'warehouse';

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',

  ORDERS_VIEW: 'orders:view',
  ORDERS_EDIT: 'orders:edit',
  ORDERS_EXPORT: 'orders:export',

  RECOMMENDATION_VIEW: 'recommendation:view',
  RECOMMENDATION_EDIT: 'recommendation:edit',

  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_EDIT: 'inventory:edit',
  INVENTORY_EXPORT: 'inventory:export',

  PURCHASE_VIEW: 'purchase:view',
  PURCHASE_CREATE: 'purchase:create',
  PURCHASE_SUBMIT: 'purchase:submit',
  PURCHASE_APPROVE_FINANCE: 'purchase:approve:finance',
  PURCHASE_APPROVE_WAREHOUSE: 'purchase:approve:warehouse',
  PURCHASE_REJECT: 'purchase:reject',
  PURCHASE_RESUBMIT: 'purchase:resubmit',

  MARKETING_VIEW: 'marketing:view',
  MARKETING_EDIT: 'marketing:edit',

  RULES_VIEW: 'rules:view',
  RULES_CREATE: 'rules:create',
  RULES_EDIT: 'rules:edit',
  RULES_DELETE: 'rules:delete',

  COLLECTION_VIEW: 'collection:view',
  COLLECTION_TRIGGER: 'collection:trigger',

  SETTINGS_PERMISSIONS: 'settings:permissions',
  SETTINGS_LOGS: 'settings:logs',

  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_MARK_READ: 'notifications:mark_read',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  super_admin: Object.values(PERMISSIONS),
  region_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MARK_READ,
  ],
  operator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_SUBMIT,
    PERMISSIONS.PURCHASE_RESUBMIT,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.MARKETING_EDIT,
    PERMISSIONS.RULES_VIEW,
    PERMISSIONS.COLLECTION_VIEW,
    PERMISSIONS.COLLECTION_TRIGGER,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MARK_READ,
  ],
  finance: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_APPROVE_FINANCE,
    PERMISSIONS.PURCHASE_REJECT,
    PERMISSIONS.INVENTORY_EXPORT,
    PERMISSIONS.RULES_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MARK_READ,
  ],
  warehouse: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_APPROVE_WAREHOUSE,
    PERMISSIONS.PURCHASE_REJECT,
    PERMISSIONS.COLLECTION_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_MARK_READ,
  ],
};

export const ROLE_DATA_SCOPES: Record<UserRole, 'all' | 'region' | 'self'> = {
  super_admin: 'all',
  region_manager: 'region',
  operator: 'region',
  finance: 'all',
  warehouse: 'all',
};

export const ROLE_MENU_ACCESS: Record<UserRole, string[]> = {
  super_admin: [
    '/dashboard', '/orders', '/recommendation', '/recommendation/analytics',
    '/inventory', '/inventory/purchase', '/marketing', '/marketing/automation',
    '/rules', '/data-collection', '/settings/permissions', '/settings/logs',
    '/notifications',
  ],
  region_manager: [
    '/dashboard', '/orders', '/inventory', '/marketing', '/marketing/automation',
    '/notifications',
  ],
  operator: [
    '/dashboard', '/orders', '/inventory', '/inventory/purchase', '/marketing',
    '/marketing/automation', '/rules', '/data-collection', '/notifications',
  ],
  finance: [
    '/dashboard', '/orders', '/inventory', '/inventory/purchase', '/rules',
    '/notifications',
  ],
  warehouse: [
    '/dashboard', '/inventory', '/inventory/purchase', '/orders',
    '/data-collection', '/notifications',
  ],
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleName: string;
  region?: string;
  permissions: PermissionKey[];
  dataScope: 'all' | 'region' | 'self';
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
  ruleId?: string;
}

export interface InboxMessage {
  id: string;
  type: 'alert' | 'system' | 'approval';
  title: string;
  content: string;
  read: boolean;
  userId: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export interface SmsRecord {
  id: string;
  phone: string;
  receiverName: string;
  content: string;
  type: 'alert' | 'marketing' | 'verification';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  failureReason?: string;
  assigneeUserId?: string;
  createdAt: string;
}

export interface DataCollectionTask {
  id: string;
  channel: 'self' | 'social' | 'distributor';
  channelName: string;
  type: 'orders' | 'browsing';
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  collected: number;
  cleaned: number;
  discarded: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CleanRecord {
  id: string;
  taskId: string;
  orderId?: string;
  originalData: Record<string, unknown>;
  issueType: 'duplicate' | 'missing_phone' | 'abnormal_amount' | 'invalid_status' | 'other';
  issueDescription: string;
  action: 'discarded' | 'fixed' | 'flagged';
  fixedData?: Record<string, unknown>;
  poolResult: 'entered' | 'skipped' | 'flagged';
  createdAt: string;
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
  dataQuality?: 'clean' | 'fixed' | 'dirty';
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

export type POStatus =
  | 'draft'
  | 'finance_pending'
  | 'finance_rejected'
  | 'warehouse_pending'
  | 'warehouse_rejected'
  | 'rejected'
  | 'approved'
  | 'completed';

export interface ApprovalHistory {
  step: number;
  stepName: string;
  role: string;
  user: string;
  userId: string;
  action: 'submit' | 'approve' | 'reject' | 'resubmit';
  comment?: string;
  rejectedFrom?: number;
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
  currentStep: number;
  currentApproverRole?: string;
  currentApprover?: string;
  version: number;
  rejectionCount: number;
  lastRejectedFrom?: number;
  lastRejectionComment?: string;
  approvalHistory: ApprovalHistory[];
  createdAt: string;
  createdBy: string;
  createdById: string;
  creatorRegion?: string;
  expectedDate?: string;
}

export interface LifecycleDistribution {
  newCustomers: number;
  activeCustomers: number;
  dormantCustomers: number;
  churnedCustomers: number;
  trend: { date: string; new: number; active: number; dormant: number; churned: number }[];
  byRegion?: { region: string; new: number; active: number; dormant: number; churned: number }[];
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
  region?: string;
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
  region?: string;
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
  category: 'pricing' | 'replenish' | 'reconcile' | 'alert' | 'other';
  enabled: boolean;
  trigger: {
    type: 'schedule' | 'event' | 'threshold';
    config: Record<string, unknown>;
  };
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdBy: string;
  createdById: string;
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
  permissions: PermissionKey[];
  dataScope: 'all' | 'region' | 'self';
}
