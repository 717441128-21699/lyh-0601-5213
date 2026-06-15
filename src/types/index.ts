export enum SimulationStatus {
  PENDING_VERIFICATION = 'pending_verification',
  MESHING = 'meshing',
  TWO_PHASE_FLOW = 'two_phase_flow',
  MASS_TRANSFER = 'mass_transfer',
  EFFICIENCY_EVALUATION = 'efficiency_evaluation',
  COMPLETED = 'completed',
  ABNORMAL_ROLLBACK = 'abnormal_rollback',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export const SimulationStatusLabels: Record<SimulationStatus, string> = {
  [SimulationStatus.PENDING_VERIFICATION]: '待校验',
  [SimulationStatus.MESHING]: '网格划分',
  [SimulationStatus.TWO_PHASE_FLOW]: '两相流动',
  [SimulationStatus.MASS_TRANSFER]: '传质反应',
  [SimulationStatus.EFFICIENCY_EVALUATION]: '级效率评估',
  [SimulationStatus.COMPLETED]: '已完成',
  [SimulationStatus.ABNORMAL_ROLLBACK]: '异常回退',
  [SimulationStatus.PAUSED]: '已暂停',
  [SimulationStatus.CANCELLED]: '已取消'
};

export enum UserRole {
  ENGINEER = 'engineer',
  PROCESS_ENGINEER = 'process_engineer',
  CHIEF_ENGINEER = 'chief_engineer',
  CHIEF_SCIENTIST = 'chief_scientist',
  DESIGN_TEAM = 'design_team',
  ADMIN = 'admin'
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ENGINEER]: '湿法冶金工程师',
  [UserRole.PROCESS_ENGINEER]: '工艺工程师',
  [UserRole.CHIEF_ENGINEER]: '总工程师',
  [UserRole.CHIEF_SCIENTIST]: '首席科学家',
  [UserRole.DESIGN_TEAM]: '萃箱设计组',
  [UserRole.ADMIN]: '系统管理员'
};

export enum AlertType {
  EXTRACTION_RATE_LOW = 'extraction_rate_low',
  EMULSIFICATION = 'emulsification',
  DEVIATION_HIGH = 'deviation_high',
  CONVERGENCE_FAILED = 'convergence_failed',
  LOW_EFFICIENCY = 'low_efficiency',
  DEVIATION = 'deviation',
  CONVERGENCE = 'convergence',
  MASS_BALANCE = 'mass_balance'
}

export const AlertTypeLabels: Record<AlertType, string> = {
  [AlertType.EXTRACTION_RATE_LOW]: '萃取率低于目标',
  [AlertType.EMULSIFICATION]: '严重乳化',
  [AlertType.DEVIATION_HIGH]: '分离因子偏差过大',
  [AlertType.CONVERGENCE_FAILED]: '收敛失败',
  [AlertType.LOW_EFFICIENCY]: '萃取率偏低',
  [AlertType.DEVIATION]: '偏差超标',
  [AlertType.CONVERGENCE]: '收敛异常',
  [AlertType.MASS_BALANCE]: '质量不守恒'
};

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
  CRITICAL = 'critical'
}

export const AlertLevelLabels: Record<AlertLevel, string> = {
  [AlertLevel.INFO]: '信息',
  [AlertLevel.WARNING]: '预警',
  [AlertLevel.DANGER]: '危险',
  [AlertLevel.CRITICAL]: '严重'
};

export enum ImpellerType {
  TURBINE = 'turbine',
  PADDLE = 'paddle',
  PROPELLER = 'propeller',
  RUSHTON = 'rushton',
  HElical = 'helical'
}

export const ImpellerTypeLabels: Record<ImpellerType, string> = {
  [ImpellerType.TURBINE]: '涡轮式',
  [ImpellerType.PADDLE]: '桨式',
  [ImpellerType.PROPELLER]: '推进式',
  [ImpellerType.RUSHTON]: 'Rushton涡轮',
  [ImpellerType.HElical]: '螺旋式'
};

export interface FeedConcentration {
  element: string;
  concentration: number;
  unit: string;
}

export interface TimeSeriesData {
  time: number;
  value: number;
}

export interface ExtractionSystem {
  id: string;
  name: string;
  feedConcentrations: FeedConcentration[];
  extractantRatio: Record<string, number>;
  ph: number;
  targetSeparationFactor: number;
  temperature: number;
  isPaused?: boolean;
  pauseReason?: string;
}

export interface MixerSettlerGeometry {
  mixerLength: number;
  mixerWidth: number;
  mixerHeight: number;
  settlerLength: number;
  settlerWidth: number;
  settlerHeight: number;
  impellerType: ImpellerType;
  impellerDiameter: number;
  stages: number;
  baffleConfig: string;
  stirringSpeed: number;
  phaseRatio: number;
}

export interface SimulationParams {
  gridPrecision: 'coarse' | 'medium' | 'fine';
  timeStep: number;
  totalTime: number;
  convergenceThreshold: number;
  maxIterations: number;
}

export interface StatusRecord {
  id: string;
  status: SimulationStatus;
  timestamp: string;
  details?: string;
  duration?: number;
}

export interface Alert {
  id: string;
  taskId: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  stage: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolution?: string;
}

export interface AdjustmentLog {
  id: string;
  taskId: string;
  timestamp: string;
  adjustedBy: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface CloudData {
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  data: number[][][];
  minValue: number;
  maxValue: number;
}

export interface SimulationResults {
  volumeFractionCloud: CloudData;
  concentrationAxialDistribution: Record<string, number[]>;
  stageEfficiencyCurve: number[];
  raffinateRatePrediction: number[];
  massTransferCoefficientMatrix: number[][];
  materialBalance: {
    inlet: number;
    outlet: number;
    error: number;
  };
  separationFactor: number;
  averageExtractionRate: number;
}

export interface MonitoringData {
  interfacialTension: TimeSeriesData[];
  distributionRatio: Record<string, TimeSeriesData[]>;
  residenceTimeDistribution: TimeSeriesData[];
  extractionRate: number[];
  separationFactor: number[];
  emulsificationIndex: number[];
}

export interface ApprovalStage {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface ApprovalRecord {
  stage1: ApprovalStage;
  stage2: ApprovalStage;
  pushedToDesign: boolean;
  pushedAt?: string;
}

export interface SimulationTask {
  id: string;
  name: string;
  system: ExtractionSystem;
  geometry: MixerSettlerGeometry;
  simulationParams: SimulationParams;
  status: SimulationStatus;
  statusHistory: StatusRecord[];
  progress: number;
  monitoringData: MonitoringData;
  alerts: Alert[];
  adjustmentLog: AdjustmentLog[];
  results?: SimulationResults;
  approval: ApprovalRecord;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  avatar?: string;
}

export interface RecommendationParams {
  targetElements: string[];
  impurityElements: string[];
  optimizationTarget: 'separation_factor' | 'stage_efficiency' | 'reagent_consumption' | 'multi_objective';
  phRange: [number, number];
  phaseRatioRange: [number, number];
  stirringSpeedRange: [number, number];
}

export interface Recommendation {
  id: string;
  systemId: string;
  params?: RecommendationParams;
  recommendedExtractantRatio: Record<string, number>;
  recommendedImpellerType: ImpellerType;
  recommendedStirringSpeed: number;
  recommendedPhaseRatio: number;
  recommendedPh: number;
  recommendedTemperature: number;
  confidence: number;
  predictedSeparationFactor: number;
  predictedStageEfficiency: number;
  historicalSimilarity: number;
  similarTasks: string[];
  modelInfo: {
    algorithm: string;
    trainingDataSize: number;
    lastUpdated: string;
  };
  comparisonSchemes?: {
    name: string;
    separationFactor: number;
    stageEfficiency: number;
    reagentConsumption: number;
  }[];
  sensitivityAnalysis?: {
    dimension: string;
    value: number;
  }[];
  createdAt: string;
}

export interface SimilarCase {
  taskName: string;
  actualSeparationFactor: number;
  stageEfficiency: number;
  extractantRatio: Record<string, number>;
  ph: number;
  phaseRatio: number;
  stirringSpeed: number;
  impellerType: ImpellerType;
}

export interface StatisticsData {
  completionRate: number;
  averageStageEfficiency: number;
  optimizationConvergenceCount: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  pendingTasks: number;
  completedToday: number;
  totalToday: number;
  completedThisWeek: number;
  totalThisWeek: number;
  completedThisMonth: number;
  totalThisMonth: number;
  convergenceCountToday: number;
  totalConvergenceCount: number;
  alertTimelyRate: number;
  avgApprovalTime: number;
  avgSeparationFactor: number;
  separationFactor达标率: number;
  monthlyTrend: {
    month: string;
    completed: number;
    efficiency: number;
  }[];
  radarData: {
    dimension: string;
    value: number;
    threshold: number;
  }[];
  dailyStats: {
    date: string;
    completed: number;
    efficiency: number;
    convergenceCount: number;
  }[];
}

/**
 * 预警级别配置
 */
export interface AlertLevelConfig {
  /** 级别标识 */
  level: 'critical' | 'danger' | 'warning';
  /** 级别名称 */
  label: string;
  /** 显示颜色 */
  color: string;
  /** 图标名称 */
  icon: string;
  /** 通知方式 */
  notifyMethods: ('in_app' | 'email' | 'sms')[];
}

/**
 * 自动调整参数配置
 */
export interface AutoAdjustConfig {
  /** 搅拌转速调整范围（RPM） */
  stirringSpeedRange: [number, number];
  /** 相比调整范围 */
  phaseRatioRange: [number, number];
  /** 最大自动调整次数 */
  maxAdjustTimes: number;
}

/**
 * 预警阈值配置
 */
export interface AlertThresholds {
  /** 萃取率下限阈值（百分比，如85表示85%） */
  minExtractionRate: number;
  /** 乳化严重程度阈值（0-100） */
  maxEmulsificationIndex: number;
  /** 分离因子偏差阈值（百分比） */
  maxDeviationPercentage: number;
  /** 质量平衡误差阈值（百分比） */
  maxMassBalanceError: number;
  /** 界面张力下限阈值（mN/m） */
  minInterfacialTension: number;
  /** 停留时间偏差阈值（百分比） */
  maxResidenceTimeDeviation: number;
  /** 收敛迭代次数阈值 */
  convergenceIterations: number;
  /** 预警级别配置 */
  alertLevels: AlertLevelConfig[];
  /** 自动调整参数配置 */
  autoAdjust: AutoAdjustConfig;
}

export interface AppSettings {
  alertThresholds: AlertThresholds;
  currentUserId: string;
  theme: 'light' | 'dark';
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  filterBy: {
    extractantType?: string;
    phRange?: [number, number];
    phaseRatioRange?: [number, number];
  };
  includeMassTransferMatrix: boolean;
  includeLogisticsData: boolean;
}

/**
 * 网格精度级别
 */
export type GridPrecision = 'low' | 'medium' | 'high' | 'ultra';

/**
 * 网格精度标签映射
 */
export const GridPrecisionLabels: Record<GridPrecision, string> = {
  low: '低',
  medium: '中',
  high: '高',
  ultra: '超高'
};

/**
 * 导出格式类型
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

/**
 * 导出格式标签映射
 */
export const ExportFormatLabels: Record<ExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  excel: 'Excel'
};

/**
 * 短信服务商类型
 */
export type SmsProvider = 'aliyun' | 'tencent' | 'huawei';

/**
 * 短信服务商标签映射
 */
export const SmsProviderLabels: Record<SmsProvider, string> = {
  aliyun: '阿里云',
  tencent: '腾讯云',
  huawei: '华为云'
};

/**
 * 模拟引擎配置
 */
export interface SimulationEngineConfig {
  defaultGridPrecision: GridPrecision;
  maxParallelTasks: number;
  maxTaskDuration: number;
  dataRetentionDays: number;
  autoCleanExpiredData: boolean;
}

/**
 * SMTP邮件配置
 */
export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  sender: string;
}

/**
 * 短信API配置
 */
export interface SmsConfig {
  provider: SmsProvider;
  apiKey: string;
  apiSecret: string;
}

/**
 * 通知模板配置
 */
export interface NotificationTemplates {
  alert: string;
  approval: string;
  completion: string;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  smtp: SmtpConfig;
  sms: SmsConfig;
  templates: NotificationTemplates;
}

/**
 * PDF报告模板配置
 */
export interface PdfTemplateConfig {
  companyName: string;
  logo: string;
  footer: string;
}

/**
 * 数据导出配置
 */
export interface DataExportConfig {
  defaultFormat: ExportFormat;
  pdfTemplate: PdfTemplateConfig;
  enablePermissionControl: boolean;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  version: string;
  databaseSize: string;
  storageUsage: string;
  lastBackupTime: string;
  uptime: string;
}

/**
 * 系统配置
 */
export interface SystemConfig {
  simulationEngine: SimulationEngineConfig;
  notification: NotificationConfig;
  dataExport: DataExportConfig;
  systemInfo: SystemInfo;
}
