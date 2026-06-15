import {
  SimulationTask,
  SimulationStatus,
  User,
  UserRole,
  ExtractionSystem,
  Recommendation,
  StatisticsData,
  AlertThresholds,
  Alert,
  AlertType,
  AlertLevel,
  ImpellerType,
  CloudData,
  SystemConfig,
  SimilarCase
} from '../types';
import dayjs from 'dayjs';

export const mockUsers: User[] = [
  { id: 'u001', username: 'zhanggong', realName: '张工', role: UserRole.ENGINEER, email: 'zhang@metallurgy.com', phone: '13800138001', department: '湿法冶金部', status: 'active', createdAt: '2025-01-15T10:30:00Z' },
  { id: 'u002', username: 'ligong', realName: '李工', role: UserRole.PROCESS_ENGINEER, email: 'li@metallurgy.com', phone: '13800138002', department: '工艺部', status: 'active', createdAt: '2025-02-20T09:15:00Z' },
  { id: 'u003', username: 'wangzong', realName: '王总', role: UserRole.CHIEF_ENGINEER, email: 'wang@metallurgy.com', phone: '13800138003', department: '总工办', status: 'active', createdAt: '2024-11-05T14:20:00Z' },
  { id: 'u004', username: 'chenshouxi', realName: '陈首席', role: UserRole.CHIEF_SCIENTIST, email: 'chen@metallurgy.com', phone: '13800138004', department: '研究院', status: 'active', createdAt: '2024-09-10T08:00:00Z' },
  { id: 'u005', username: 'shejizu', realName: '设计组', role: UserRole.DESIGN_TEAM, email: 'design@metallurgy.com', phone: '13800138005', department: '设备设计部', status: 'active', createdAt: '2025-03-01T11:45:00Z' },
  { id: 'u006', username: 'admin', realName: '管理员', role: UserRole.ADMIN, email: 'admin@metallurgy.com', phone: '13800138006', department: '信息中心', status: 'active', createdAt: '2024-08-01T00:00:00Z' }
];

export const mockExtractionSystems: ExtractionSystem[] = [
  {
    id: 'sys001',
    name: 'La/Ce分离体系-1',
    feedConcentrations: [
      { element: 'La', concentration: 0.15, unit: 'mol/L' },
      { element: 'Ce', concentration: 0.12, unit: 'mol/L' },
      { element: 'Pr', concentration: 0.08, unit: 'mol/L' },
      { element: 'Nd', concentration: 0.10, unit: 'mol/L' }
    ],
    extractantRatio: { P507: 1.0, kerosene: 3.0, TBP: 0.5 },
    ph: 3.5,
    targetSeparationFactor: 2.5,
    targetExtractionRate: 85,
    temperature: 25
  },
  {
    id: 'sys002',
    name: 'Pr/Nd分离体系-1',
    feedConcentrations: [
      { element: 'Pr', concentration: 0.20, unit: 'mol/L' },
      { element: 'Nd', concentration: 0.18, unit: 'mol/L' },
      { element: 'Sm', concentration: 0.05, unit: 'mol/L' }
    ],
    extractantRatio: { P507: 1.2, kerosene: 2.8, TBP: 0.3 },
    ph: 4.0,
    targetSeparationFactor: 1.8,
    targetExtractionRate: 90,
    temperature: 30
  },
  {
    id: 'sys003',
    name: 'Eu/Gd分离体系-1',
    feedConcentrations: [
      { element: 'Eu', concentration: 0.10, unit: 'mol/L' },
      { element: 'Gd', concentration: 0.12, unit: 'mol/L' },
      { element: 'Tb', concentration: 0.03, unit: 'mol/L' }
    ],
    extractantRatio: { P204: 1.0, kerosene: 3.5, TBP: 0.4 },
    ph: 3.8,
    targetSeparationFactor: 2.2,
    targetExtractionRate: 88,
    temperature: 28
  }
];

function generateTimeSeriesData(count: number, min: number, max: number, baseNoise: number = 0.1) {
  const data = [];
  let currentValue = (min + max) / 2;
  for (let i = 0; i < count; i++) {
    const noise = (Math.random() - 0.5) * baseNoise;
    currentValue = Math.max(min, Math.min(max, currentValue + noise));
    data.push({ time: i * 0.1, value: currentValue });
  }
  return data;
}

function generateCloudData(x: number, y: number, z: number): CloudData {
  const data: number[][][] = [];
  let minValue = Infinity;
  let maxValue = -Infinity;
  
  for (let i = 0; i < x; i++) {
    data[i] = [];
    for (let j = 0; j < y; j++) {
      data[i][j] = [];
      for (let k = 0; k < z; k++) {
        const centerX = x / 2;
        const centerY = y / 2;
        const distFromCenter = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2));
        const baseValue = 0.3 + 0.5 * Math.exp(-distFromCenter / (x / 4));
        const noise = (Math.random() - 0.5) * 0.1;
        const value = Math.max(0, Math.min(1, baseValue + noise));
        data[i][j][k] = value;
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    }
  }
  
  return { dimensions: { x, y, z }, data, minValue, maxValue };
}

function generateMockTask(id: string, name: string, status: SimulationStatus, systemIdx: number = 0): SimulationTask {
  const system = { ...mockExtractionSystems[systemIdx % mockExtractionSystems.length] };
  const now = dayjs();
  
  const stages = 10;
  const stageEfficiency = Array.from({ length: stages }, (_, i) => 0.75 + Math.random() * 0.2);
  const concentrationDistribution: Record<string, number[]> = {};
  system.feedConcentrations.forEach(fc => {
    concentrationDistribution[fc.element] = Array.from({ length: stages + 1 }, (_, i) => 
      fc.concentration * Math.exp(-0.15 * i) * (0.95 + Math.random() * 0.1)
    );
  });
  
  const massTransferMatrix = Array.from({ length: stages }, () =>
    Array.from({ length: stages }, () => (0.1 + Math.random() * 0.4).toFixed(4))
  ).map(row => row.map(v => parseFloat(v)));
  
  const alerts: Alert[] = [];
  if (status === SimulationStatus.TWO_PHASE_FLOW || status === SimulationStatus.MASS_TRANSFER) {
    if (Math.random() > 0.6) {
      alerts.push({
        id: `alert-${id}-001`,
        taskId: id,
        type: AlertType.EXTRACTION_RATE_LOW,
        level: AlertLevel.WARNING,
        message: `第${Math.floor(Math.random() * 5 + 1)}级萃取率低于目标下限`,
        stage: Math.floor(Math.random() * 5 + 1),
        timestamp: now.subtract(Math.random() * 30, 'minute').toISOString(),
        acknowledged: false
      });
    }
  }
  
  const statusHistory = [
    { id: `${id}-hist-001`, status: SimulationStatus.PENDING_VERIFICATION, timestamp: now.subtract(3, 'hour').toISOString(), details: '参数校验通过', duration: 300 }
  ];
  
  if (status !== SimulationStatus.PENDING_VERIFICATION) {
    statusHistory.push({ id: `${id}-hist-002`, status: SimulationStatus.MESHING, timestamp: now.subtract(2.5, 'hour').toISOString(), details: '生成自适应网格，节点数: 125,842', duration: 900 });
  }
  if (status !== SimulationStatus.PENDING_VERIFICATION && status !== SimulationStatus.MESHING) {
    statusHistory.push({ id: `${id}-hist-003`, status: SimulationStatus.TWO_PHASE_FLOW, timestamp: now.subtract(1, 'hour').toISOString(), details: '两相流场模拟计算中', duration: 1800 });
  }
  if (status === SimulationStatus.MASS_TRANSFER || status === SimulationStatus.EFFICIENCY_EVALUATION || status === SimulationStatus.COMPLETED) {
    statusHistory.push({ id: `${id}-hist-004`, status: SimulationStatus.MASS_TRANSFER, timestamp: now.subtract(30, 'minute').toISOString(), details: '传质反应耦合计算', duration: 1200 });
  }
  if (status === SimulationStatus.EFFICIENCY_EVALUATION || status === SimulationStatus.COMPLETED) {
    statusHistory.push({ id: `${id}-hist-005`, status: SimulationStatus.EFFICIENCY_EVALUATION, timestamp: now.subtract(10, 'minute').toISOString(), details: '级效率评估与结果分析', duration: Math.floor(1000 + Math.random() * 5000) });
  }
  
  let progress = 0;
  switch (status) {
    case SimulationStatus.PENDING_VERIFICATION: progress = 5; break;
    case SimulationStatus.MESHING: progress = 20 + Math.random() * 15; break;
    case SimulationStatus.TWO_PHASE_FLOW: progress = 40 + Math.random() * 20; break;
    case SimulationStatus.MASS_TRANSFER: progress = 65 + Math.random() * 15; break;
    case SimulationStatus.EFFICIENCY_EVALUATION: progress = 85 + Math.random() * 10; break;
    case SimulationStatus.COMPLETED: progress = 100; break;
    case SimulationStatus.ABNORMAL_ROLLBACK: progress = 45; break;
    default: progress = 0;
  }
  
  const results = status === SimulationStatus.COMPLETED ? {
    volumeFractionCloud: generateCloudData(20, 15, 10),
    concentrationAxialDistribution: concentrationDistribution,
    stageEfficiencyCurve: stageEfficiency,
    raffinateRatePrediction: Array.from({ length: stages }, (_, i) => 0.05 + 0.9 * Math.exp(-0.2 * (i + 1))),
    massTransferCoefficientMatrix: massTransferMatrix,
    materialBalance: { inlet: 1.0, outlet: 0.9987, error: 0.0013 },
    separationFactor: 2.3 + Math.random() * 0.5,
    averageExtractionRate: 0.88 + Math.random() * 0.1
  } : undefined;
  
  const distributionRatio: Record<string, { time: number; value: number }[]> = {};
  system.feedConcentrations.forEach(fc => {
    distributionRatio[fc.element] = generateTimeSeriesData(100, 0.5, 3.0);
  });
  
  return {
    id,
    name,
    system,
    geometry: {
      mixerLength: 2.0 + Math.random() * 0.5,
      mixerWidth: 1.5 + Math.random() * 0.3,
      mixerHeight: 1.8 + Math.random() * 0.2,
      settlerLength: 5.0 + Math.random() * 1.0,
      settlerWidth: 2.0 + Math.random() * 0.5,
      settlerHeight: 1.5 + Math.random() * 0.3,
      impellerType: [ImpellerType.TURBINE, ImpellerType.PADDLE, ImpellerType.RUSHTON][Math.floor(Math.random() * 3)],
      impellerDiameter: 0.6 + Math.random() * 0.2,
      stages,
      baffleConfig: '标准4挡板',
      stirringSpeed: 150 + Math.random() * 100,
      phaseRatio: 1.0 + Math.random() * 0.5
    },
    simulationParams: {
      gridPrecision: 'medium',
      timeStep: 0.01,
      totalTime: 100,
      convergenceThreshold: 1e-6,
      maxIterations: 100
    },
    status,
    statusHistory,
    progress,
    monitoringData: {
      interfacialTension: generateTimeSeriesData(100, 20, 35, 0.5),
      distributionRatio,
      residenceTimeDistribution: generateTimeSeriesData(50, 10, 120, 5),
      extractionRate: Array.from({ length: stages }, (_, i) => 0.8 + Math.random() * 0.18),
      separationFactor: Array.from({ length: 10 }, () => 2.0 + Math.random() * 0.6),
      emulsificationIndex: Array.from({ length: 10 }, () => 0.1 + Math.random() * 0.15)
    },
    alerts,
    adjustmentLog: [],
    results,
    approval: {
      stage1: { approved: status === SimulationStatus.COMPLETED && Math.random() > 0.5, approvedBy: 'u002', approvedAt: status === SimulationStatus.COMPLETED ? now.toISOString() : undefined },
      stage2: { approved: false },
      pushedToDesign: false
    },
    createdAt: now.subtract(4, 'hour').toISOString(),
    createdBy: 'u001',
    updatedAt: now.toISOString()
  };
}

export const mockTasks: SimulationTask[] = [
  generateMockTask('task001', 'La/Ce分离模拟-2026-001', SimulationStatus.COMPLETED, 0),
  generateMockTask('task002', 'Pr/Nd分离模拟-2026-001', SimulationStatus.COMPLETED, 1),
  generateMockTask('task003', 'La/Ce分离优化-002', SimulationStatus.MASS_TRANSFER, 0),
  generateMockTask('task004', 'Eu/Gd分离模拟-001', SimulationStatus.TWO_PHASE_FLOW, 2),
  generateMockTask('task005', '高纯度Nd分离-001', SimulationStatus.PENDING_VERIFICATION, 1),
  generateMockTask('task006', 'La/Ce分离-放大实验', SimulationStatus.EFFICIENCY_EVALUATION, 0),
  generateMockTask('task007', '低浓度稀土回收-001', SimulationStatus.MESHING, 2),
  generateMockTask('task008', '多组分分离优化', SimulationStatus.ABNORMAL_ROLLBACK, 0)
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec001',
    systemId: 'sys001',
    params: {
      targetElements: ['La', 'Ce'],
      impurityElements: ['Pr', 'Nd'],
      optimizationTarget: 'separation_factor',
      phRange: [3.0, 4.5],
      phaseRatioRange: [1.0, 1.5],
      stirringSpeedRange: [150, 200]
    },
    recommendedExtractantRatio: { P507: 1.2, kerosene: 2.8, TBP: 0.4 },
    recommendedImpellerType: ImpellerType.RUSHTON,
    recommendedStirringSpeed: 180,
    recommendedPhaseRatio: 1.3,
    recommendedPh: 3.8,
    recommendedTemperature: 28,
    confidence: 0.92,
    predictedSeparationFactor: 2.8,
    predictedStageEfficiency: 0.91,
    historicalSimilarity: 0.87,
    similarTasks: ['task001', 'task006'],
    modelInfo: {
      algorithm: 'XGBoost + 多目标优化',
      trainingDataSize: 1256,
      lastUpdated: dayjs().subtract(1, 'day').toISOString()
    },
    comparisonSchemes: [
      { name: '方案A(基准)', separationFactor: 2.3, stageEfficiency: 0.85, reagentConsumption: 1.0 },
      { name: '方案B(高效)', separationFactor: 2.6, stageEfficiency: 0.89, reagentConsumption: 1.15 },
      { name: '方案C(推荐)', separationFactor: 2.8, stageEfficiency: 0.91, reagentConsumption: 1.05 },
      { name: '方案D(经济)', separationFactor: 2.1, stageEfficiency: 0.82, reagentConsumption: 0.85 }
    ],
    sensitivityAnalysis: [
      { dimension: 'pH值', value: 0.85 },
      { dimension: '相比', value: 0.72 },
      { dimension: '搅拌转速', value: 0.68 },
      { dimension: '萃取剂配比', value: 0.90 },
      { dimension: '温度', value: 0.55 },
      { dimension: '搅拌桨类型', value: 0.78 }
    ],
    createdAt: dayjs().toISOString()
  },
  {
    id: 'rec002',
    systemId: 'sys002',
    params: {
      targetElements: ['Pr', 'Nd'],
      impurityElements: ['Sm'],
      optimizationTarget: 'multi_objective',
      phRange: [3.5, 4.5],
      phaseRatioRange: [0.8, 1.3],
      stirringSpeedRange: [140, 180]
    },
    recommendedExtractantRatio: { P507: 1.0, kerosene: 3.0, TBP: 0.5 },
    recommendedImpellerType: ImpellerType.TURBINE,
    recommendedStirringSpeed: 160,
    recommendedPhaseRatio: 1.1,
    recommendedPh: 4.0,
    recommendedTemperature: 30,
    confidence: 0.85,
    predictedSeparationFactor: 2.0,
    predictedStageEfficiency: 0.88,
    historicalSimilarity: 0.78,
    similarTasks: ['task002'],
    modelInfo: {
      algorithm: 'XGBoost + 多目标优化',
      trainingDataSize: 1256,
      lastUpdated: dayjs().subtract(1, 'day').toISOString()
    },
    comparisonSchemes: [
      { name: '方案A(基准)', separationFactor: 1.7, stageEfficiency: 0.82, reagentConsumption: 1.0 },
      { name: '方案B(推荐)', separationFactor: 2.0, stageEfficiency: 0.88, reagentConsumption: 1.02 },
      { name: '方案C(高效)', separationFactor: 2.1, stageEfficiency: 0.90, reagentConsumption: 1.12 }
    ],
    sensitivityAnalysis: [
      { dimension: 'pH值', value: 0.82 },
      { dimension: '相比', value: 0.70 },
      { dimension: '搅拌转速', value: 0.65 },
      { dimension: '萃取剂配比', value: 0.88 },
      { dimension: '温度', value: 0.52 },
      { dimension: '搅拌桨类型', value: 0.75 }
    ],
    createdAt: dayjs().toISOString()
  }
];

export const mockSimilarCases: SimilarCase[] = [
  {
    taskName: 'La/Ce分离模拟-2026-001',
    actualSeparationFactor: 2.65,
    stageEfficiency: 0.89,
    extractantRatio: { P507: 1.0, kerosene: 3.0, TBP: 0.5 },
    ph: 3.5,
    phaseRatio: 1.2,
    stirringSpeed: 170,
    impellerType: ImpellerType.RUSHTON
  },
  {
    taskName: 'La/Ce分离-放大实验',
    actualSeparationFactor: 2.78,
    stageEfficiency: 0.92,
    extractantRatio: { P507: 1.2, kerosene: 2.8, TBP: 0.4 },
    ph: 3.8,
    phaseRatio: 1.3,
    stirringSpeed: 180,
    impellerType: ImpellerType.RUSHTON
  },
  {
    taskName: '高纯度La分离优化-003',
    actualSeparationFactor: 2.55,
    stageEfficiency: 0.87,
    extractantRatio: { P507: 1.1, kerosene: 2.9, TBP: 0.45 },
    ph: 3.6,
    phaseRatio: 1.25,
    stirringSpeed: 175,
    impellerType: ImpellerType.TURBINE
  },
  {
    taskName: '低浓度Ce回收实验',
    actualSeparationFactor: 2.42,
    stageEfficiency: 0.85,
    extractantRatio: { P507: 0.9, kerosene: 3.2, TBP: 0.55 },
    ph: 3.4,
    phaseRatio: 1.15,
    stirringSpeed: 165,
    impellerType: ImpellerType.PADDLE
  }
];

export const mockStatistics: StatisticsData = {
  completionRate: 0.87,
  averageStageEfficiency: 0.89,
  optimizationConvergenceCount: 156,
  totalTasks: 124,
  completedTasks: 108,
  failedTasks: 8,
  runningTasks: 5,
  pendingTasks: 3,
  completedToday: 3,
  totalToday: 4,
  completedThisWeek: 18,
  totalThisWeek: 21,
  completedThisMonth: 23,
  totalThisMonth: 26,
  convergenceCountToday: 25,
  totalConvergenceCount: 12480,
  alertTimelyRate: 0.92,
  avgApprovalTime: 2.5,
  avgSeparationFactor: 2.35,
  separationFactor达标率: 0.88,
  monthlyTrend: [
    { month: '2026-01', completed: 18, efficiency: 0.85 },
    { month: '2026-02', completed: 22, efficiency: 0.87 },
    { month: '2026-03', completed: 25, efficiency: 0.88 },
    { month: '2026-04', completed: 20, efficiency: 0.90 },
    { month: '2026-05', completed: 23, efficiency: 0.89 }
  ],
  radarData: [
    { dimension: '级效率', value: 0.89, threshold: 0.85 },
    { dimension: '分离系数', value: 0.85, threshold: 0.80 },
    { dimension: '收敛速度', value: 0.78, threshold: 0.80 },
    { dimension: '稳定性', value: 0.92, threshold: 0.85 },
    { dimension: '准确性', value: 0.88, threshold: 0.85 },
    { dimension: '计算效率', value: 0.75, threshold: 0.80 }
  ],
  dailyStats: Array.from({ length: 30 }, (_, i) => ({
    date: dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD'),
    completed: Math.floor(Math.random() * 5) + 1,
    efficiency: 0.85 + Math.random() * 0.1,
    convergenceCount: Math.floor(Math.random() * 10) + 3
  }))
};

export const mockAlertThresholds: AlertThresholds = {
  minExtractionRate: 85,
  maxEmulsificationIndex: 70,
  maxDeviationPercentage: 15,
  maxMassBalanceError: 2,
  minInterfacialTension: 10,
  maxResidenceTimeDeviation: 20,
  convergenceIterations: 100,
  alertLevels: [
    {
      level: 'critical',
      label: '严重',
      color: '#dc2626',
      icon: 'AlertOctagon',
      notifyMethods: ['in_app', 'email', 'sms']
    },
    {
      level: 'danger',
      label: '危险',
      color: '#ea580c',
      icon: 'AlertTriangle',
      notifyMethods: ['in_app', 'email']
    },
    {
      level: 'warning',
      label: '警告',
      color: '#d97706',
      icon: 'AlertCircle',
      notifyMethods: ['in_app']
    }
  ],
  autoAdjust: {
    stirringSpeedRange: [100, 300],
    phaseRatioRange: [0.5, 2.0],
    maxAdjustTimes: 3
  }
};

export const mockSystemConfig: SystemConfig = {
  simulationEngine: {
    defaultGridPrecision: 'medium',
    maxParallelTasks: 5,
    maxTaskDuration: 24,
    dataRetentionDays: 30,
    autoCleanExpiredData: true
  },
  notification: {
    smtp: {
      host: 'smtp.metallurgy.com',
      port: 465,
      username: 'notify@metallurgy.com',
      password: '********',
      sender: '湿法冶金模拟平台 <notify@metallurgy.com>'
    },
    sms: {
      provider: 'aliyun',
      apiKey: 'LTAI5t7vFqgH7kJfZq********',
      apiSecret: '********'
    },
    templates: {
      alert: '【预警通知】模拟任务{taskName}出现{alertType}，请及时处理。',
      approval: '【审批通知】任务{taskName}已完成，等待您的审批。',
      completion: '【完成通知】任务{taskName}已成功完成，结果已生成。'
    }
  },
  dataExport: {
    defaultFormat: 'excel',
    pdfTemplate: {
      companyName: 'XX有色金属研究院',
      logo: '',
      footer: '湿法冶金模拟平台 · 机密文件 · 第{page}页/共{total}页'
    },
    enablePermissionControl: true
  },
  systemInfo: {
    version: 'v1.2.3',
    databaseSize: '2.4 GB',
    storageUsage: '45.8 GB / 100 GB',
    lastBackupTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    uptime: '15天 8小时 32分钟'
  }
};
