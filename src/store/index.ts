import { create } from 'zustand';
import {
  SimulationTask,
  User,
  ExtractionSystem,
  Recommendation,
  RecommendationParams,
  SimilarCase,
  StatisticsData,
  AlertThresholds,
  SimulationStatus,
  Alert,
  AdjustmentLog,
  ApprovalRecord,
  MixerSettlerGeometry,
  SimulationParams,
  MonitoringData,
  ImpellerType,
  SystemConfig
} from '../types';
import {
  mockTasks,
  mockUsers,
  mockExtractionSystems,
  mockRecommendations,
  mockSimilarCases,
  mockStatistics,
  mockAlertThresholds,
  mockSystemConfig
} from '../data/mockData';
import dayjs from 'dayjs';

interface AppState {
  tasks: SimulationTask[];
  users: User[];
  extractionSystems: ExtractionSystem[];
  recommendations: Recommendation[];
  similarCases: SimilarCase[];
  currentRecommendation: Recommendation | null;
  statistics: StatisticsData;
  alertThresholds: AlertThresholds;
  currentUser: User | null;
  currentTask: SimulationTask | null;
  loading: boolean;
  error: string | null;
  recommendationLoading: boolean;
  systemConfig: SystemConfig;
  
  setCurrentUser: (userId: string) => void;
  setCurrentTask: (taskId: string | null) => void;
  getTaskById: (taskId: string) => SimulationTask | undefined;
  addTask: (task: Omit<SimulationTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (taskId: string, status: SimulationStatus, details?: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskMonitoringData: (taskId: string, data: Partial<MonitoringData>) => void;
  addAlert: (taskId: string, alert: Omit<Alert, 'id' | 'taskId' | 'timestamp'>) => void;
  acknowledgeAlert: (taskId: string, alertId: string, userId: string, resolution?: string) => void;
  addAdjustmentLog: (taskId: string, log: Omit<AdjustmentLog, 'id' | 'taskId' | 'timestamp'>) => void;
  updateApproval: (taskId: string, stage: 'stage1' | 'stage2', approved: boolean, userId: string, comments?: string) => void;
  pushToDesign: (taskId: string) => void;
  getRunningTasks: () => SimulationTask[];
  getTasksByStatus: (status: SimulationStatus) => SimulationTask[];
  getUnacknowledgedAlerts: () => Alert[];
  getStatistics: () => StatisticsData;
  getActiveTasks: () => SimulationTask[];
  getPendingApprovalTasks: () => SimulationTask[];
  updateTaskGeometry: (taskId: string, geometry: Partial<MixerSettlerGeometry>) => void;
  updateTaskParams: (taskId: string, params: Partial<SimulationParams>) => void;
  updateAlertThresholds: (thresholds: Partial<AlertThresholds>) => void;
  updateUserRole: (userId: string, role: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (userId: string, user: Partial<Omit<User, 'id' | 'createdAt'>>) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  addExtractionSystem: (system: Omit<ExtractionSystem, 'id'>) => void;
  pauseSystem: (systemId: string, reason: string) => void;
  resumeSystem: (systemId: string) => void;
  refreshStatistics: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  deleteTask: (taskId: string) => void;
  generateRecommendation: (params: RecommendationParams) => Promise<Recommendation>;
  setCurrentRecommendation: (recommendation: Recommendation | null) => void;
  getSimilarCases: (elements?: string[]) => SimilarCase[];
  exportRecommendationReport: (recommendationId: string) => void;
  applyRecommendation: (recommendationId: string) => ExtractionSystem & MixerSettlerGeometry;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: mockTasks,
  users: mockUsers,
  extractionSystems: mockExtractionSystems,
  recommendations: mockRecommendations,
  similarCases: mockSimilarCases,
  currentRecommendation: mockRecommendations[0] || null,
  statistics: mockStatistics,
  alertThresholds: mockAlertThresholds,
  currentUser: mockUsers[0],
  currentTask: null,
  loading: false,
  error: null,
  recommendationLoading: false,
  systemConfig: mockSystemConfig,

  setCurrentUser: (userId: string) => {
    const user = get().users.find(u => u.id === userId);
    set({ currentUser: user || null });
  },

  setCurrentTask: (taskId: string | null) => {
    if (!taskId) {
      set({ currentTask: null });
      return;
    }
    const task = get().tasks.find(t => t.id === taskId);
    set({ currentTask: task || null });
  },

  getTaskById: (taskId: string) => {
    return get().tasks.find(t => t.id === taskId);
  },

  addTask: (taskData) => {
    const newTask: SimulationTask = {
      ...taskData,
      id: `task${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set(state => ({
      tasks: [newTask, ...state.tasks]
    }));
  },

  updateTaskStatus: (taskId: string, status: SimulationStatus, details?: string) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => {
        if (task.id === taskId) {
          const newHistoryRecord = {
            id: `hist-${Date.now()}`,
            status,
            timestamp: now,
            details
          };
          return {
            ...task,
            status,
            statusHistory: [...task.statusHistory, newHistoryRecord],
            updatedAt: now
          };
        }
        return task;
      })
    }));
    
    const currentTask = get().currentTask;
    if (currentTask?.id === taskId) {
      get().setCurrentTask(taskId);
    }
  },

  updateTaskProgress: (taskId: string, progress: number) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, progress: Math.min(100, Math.max(0, progress)), updatedAt: now }
          : task
      )
    }));
  },

  updateTaskMonitoringData: (taskId: string, data: Partial<MonitoringData>) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              monitoringData: { ...task.monitoringData, ...data },
              updatedAt: now 
            }
          : task
      )
    }));
  },

  addAlert: (taskId: string, alertData) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      taskId,
      timestamp: new Date().toISOString()
    };
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, alerts: [...task.alerts, newAlert] }
          : task
      )
    }));
  },

  acknowledgeAlert: (taskId: string, alertId: string, userId: string, resolution?: string) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              alerts: task.alerts.map(alert =>
                alert.id === alertId
                  ? { ...alert, acknowledged: true, acknowledgedBy: userId, acknowledgedAt: now, resolution }
                  : alert
              )
            }
          : task
      )
    }));
  },

  addAdjustmentLog: (taskId: string, logData) => {
    const newLog: AdjustmentLog = {
      ...logData,
      id: `log-${Date.now()}`,
      taskId,
      timestamp: new Date().toISOString()
    };
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, adjustmentLog: [...task.adjustmentLog, newLog] }
          : task
      )
    }));
  },

  updateApproval: (taskId: string, stage: 'stage1' | 'stage2', approved: boolean, userId: string, comments?: string) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => {
        if (task.id === taskId) {
          const newApproval: ApprovalRecord = {
            ...task.approval,
            [stage]: {
              approved,
              approvedBy: userId,
              approvedAt: now,
              comments
            }
          };
          
          if (stage === 'stage2' && approved) {
            newApproval.pushedToDesign = true;
            newApproval.pushedAt = now;
          }
          
          return { ...task, approval: newApproval, updatedAt: now };
        }
        return task;
      })
    }));
  },

  pushToDesign: (taskId: string) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              approval: { ...task.approval, pushedToDesign: true, pushedAt: now },
              updatedAt: now 
            }
          : task
      )
    }));
  },

  getRunningTasks: () => {
    return get().tasks.filter(t => 
      t.status !== SimulationStatus.COMPLETED && 
      t.status !== SimulationStatus.ABNORMAL_ROLLBACK &&
      t.status !== SimulationStatus.PAUSED
    );
  },

  getTasksByStatus: (status: SimulationStatus) => {
    return get().tasks.filter(t => t.status === status);
  },

  getUnacknowledgedAlerts: () => {
    return get().tasks.flatMap(t => t.alerts).filter(a => !a.acknowledged);
  },

  getStatistics: () => {
    const state = get();
    const tasks = state.tasks;
    const today = new Date().toDateString();
    
    const completedToday = tasks.filter(t => 
      t.status === SimulationStatus.COMPLETED && 
      new Date(t.updatedAt).toDateString() === today
    ).length;
    
    const totalToday = tasks.filter(t => 
      new Date(t.createdAt).toDateString() === today
    ).length;
    
    const completedThisWeek = tasks.filter(t => {
      const taskDate = new Date(t.updatedAt);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return t.status === SimulationStatus.COMPLETED && taskDate >= weekAgo;
    }).length;
    
    const totalThisWeek = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo;
    }).length;
    
    const completedThisMonth = tasks.filter(t => {
      const taskDate = new Date(t.updatedAt);
      const now = new Date();
      return t.status === SimulationStatus.COMPLETED && 
             taskDate.getMonth() === now.getMonth() &&
             taskDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalThisMonth = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      const now = new Date();
      return taskDate.getMonth() === now.getMonth() &&
             taskDate.getFullYear() === now.getFullYear();
    }).length;
    
    const completedTasks = tasks.filter(t => t.status === SimulationStatus.COMPLETED).length;
    const totalTasks = tasks.length;
    const activeTasks = state.getRunningTasks().length;
    const pendingTasks = tasks.filter(t => t.status === SimulationStatus.PENDING_VERIFICATION).length;
    const failedTasks = tasks.filter(t => t.status === SimulationStatus.ABNORMAL_ROLLBACK).length;
    
    const avgStageEfficiency = completedTasks > 0
      ? tasks
          .filter(t => t.status === SimulationStatus.COMPLETED && t.results)
          .reduce((sum, t) => sum + (t.results?.averageExtractionRate || 0), 0) / completedTasks
      : 0;
    
    const avgSeparationFactor = completedTasks > 0
      ? tasks
          .filter(t => t.status === SimulationStatus.COMPLETED && t.results)
          .reduce((sum, t) => sum + (t.results?.separationFactor || 0), 0) / completedTasks
      : 0;
    
    const convergenceCountToday = tasks.filter(t => 
      t.status === SimulationStatus.COMPLETED && 
      new Date(t.updatedAt).toDateString() === today
    ).reduce((sum, t) => sum + (t.simulationParams.maxIterations || 0), 0);
    
    const totalConvergenceCount = tasks
      .filter(t => t.status === SimulationStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.simulationParams.maxIterations || 0), 0);
    
    const alerts = state.getUnacknowledgedAlerts();
    const timelyHandledAlerts = alerts.filter(a => {
      const alertTime = new Date(a.timestamp);
      const now = new Date();
      return (now.getTime() - alertTime.getTime()) < 30 * 60 * 1000;
    }).length;
    
    const alertTimelyRate = alerts.length > 0 ? timelyHandledAlerts / alerts.length : 1;
    
    const approvedTasks = tasks.filter(t => t.approval.stage1.approved || t.approval.stage2.approved);
    const avgApprovalTime = approvedTasks.length > 0
      ? approvedTasks.reduce((sum, t) => {
          const createdAt = new Date(t.createdAt);
          const approvedAt = t.approval.stage1.approvedAt 
            ? new Date(t.approval.stage1.approvedAt)
            : t.approval.stage2.approvedAt
              ? new Date(t.approval.stage2.approvedAt)
              : new Date();
          return sum + (approvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / approvedTasks.length
      : 0;
    
    const separationFactor达标率 = completedTasks > 0
      ? tasks.filter(t => 
          t.status === SimulationStatus.COMPLETED && 
          t.results && 
          t.results.separationFactor >= t.system.targetSeparationFactor
        ).length / completedTasks
      : 0;
    
    return {
      ...state.statistics,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      averageStageEfficiency: avgStageEfficiency,
      optimizationConvergenceCount: totalConvergenceCount,
      totalTasks,
      completedTasks,
      failedTasks,
      runningTasks: activeTasks,
      pendingTasks,
      completedToday,
      totalToday,
      completedThisWeek,
      totalThisWeek,
      completedThisMonth,
      totalThisMonth,
      convergenceCountToday,
      totalConvergenceCount,
      alertTimelyRate,
      avgApprovalTime,
      avgSeparationFactor,
      separationFactor达标率,
      monthlyTrend: state.statistics.monthlyTrend,
      radarData: state.statistics.radarData,
      dailyStats: state.statistics.dailyStats
    };
  },

  getActiveTasks: () => {
    return get().tasks.filter(t => 
      t.status === SimulationStatus.MESHING ||
      t.status === SimulationStatus.TWO_PHASE_FLOW ||
      t.status === SimulationStatus.MASS_TRANSFER ||
      t.status === SimulationStatus.EFFICIENCY_EVALUATION
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getPendingApprovalTasks: () => {
    return get().tasks.filter(t => 
      t.status === SimulationStatus.COMPLETED &&
      (!t.approval.stage1.approved || !t.approval.stage2.approved)
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  updateTaskGeometry: (taskId: string, geometry: Partial<MixerSettlerGeometry>) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, geometry: { ...task.geometry, ...geometry }, updatedAt: now }
          : task
      )
    }));
  },

  updateTaskParams: (taskId: string, params: Partial<SimulationParams>) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { ...task, simulationParams: { ...task.simulationParams, ...params }, updatedAt: now }
          : task
      )
    }));
  },

  updateAlertThresholds: (thresholds: Partial<AlertThresholds>) => {
    set(state => ({
      alertThresholds: { ...state.alertThresholds, ...thresholds }
    }));
  },

  updateUserRole: (userId: string, role: string) => {
    set(state => ({
      users: state.users.map(user => 
        user.id === userId ? { ...user, role: role as any } : user
      )
    }));
  },

  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    set(state => ({
      users: [...state.users, newUser]
    }));
  },

  updateUser: (userId: string, userData) => {
    set(state => ({
      users: state.users.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      )
    }));
    
    const currentUser = get().currentUser;
    if (currentUser?.id === userId) {
      set({ currentUser: { ...currentUser, ...userData } });
    }
  },

  deleteUser: (userId: string) => {
    set(state => ({
      users: state.users.filter(user => user.id !== userId)
    }));
    
    const currentUser = get().currentUser;
    if (currentUser?.id === userId) {
      set({ currentUser: null });
    }
  },

  toggleUserStatus: (userId: string) => {
    set(state => ({
      users: state.users.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } 
          : user
      )
    }));
    
    const currentUser = get().currentUser;
    if (currentUser?.id === userId) {
      set({ currentUser: { ...currentUser, status: currentUser.status === 'active' ? 'inactive' : 'active' } });
    }
  },

  addExtractionSystem: (systemData) => {
    const newSystem: ExtractionSystem = {
      ...systemData,
      id: `sys${Date.now()}`
    };
    set(state => ({
      extractionSystems: [...state.extractionSystems, newSystem]
    }));
  },

  pauseSystem: (systemId: string, reason: string) => {
    set(state => ({
      extractionSystems: state.extractionSystems.map(sys => 
        sys.id === systemId 
          ? { ...sys, isPaused: true, pauseReason: reason }
          : sys
      )
    }));
  },

  resumeSystem: (systemId: string) => {
    set(state => ({
      extractionSystems: state.extractionSystems.map(sys => 
        sys.id === systemId 
          ? { ...sys, isPaused: false, pauseReason: undefined }
          : sys
      )
    }));
  },

  refreshStatistics: () => {
    const state = get();
    const tasks = state.tasks;
    
    const completedTasks = tasks.filter(t => t.status === SimulationStatus.COMPLETED).length;
    const totalTasks = tasks.length;
    const runningTasks = state.getRunningTasks().length;
    const failedTasks = tasks.filter(t => t.status === SimulationStatus.ABNORMAL_ROLLBACK).length;
    const pendingTasks = tasks.filter(t => t.status === SimulationStatus.PENDING_VERIFICATION).length;
    
    const avgEfficiency = completedTasks > 0
      ? tasks
          .filter(t => t.status === SimulationStatus.COMPLETED && t.results)
          .reduce((sum, t) => sum + (t.results?.averageExtractionRate || 0), 0) / completedTasks
      : 0;
    
    set(state => ({
      statistics: {
        ...state.statistics,
        completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
        averageStageEfficiency: avgEfficiency,
        totalTasks,
        completedTasks,
        runningTasks,
        pendingTasks,
        failedTasks
      }
    }));
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  deleteTask: (taskId: string) => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));
    
    const currentTask = get().currentTask;
    if (currentTask?.id === taskId) {
      set({ currentTask: null });
    }
  },

  generateRecommendation: async (params: RecommendationParams): Promise<Recommendation> => {
    set({ recommendationLoading: true });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const extractantRatio: Record<string, number> = { P507: 1.0, kerosene: 3.0, TBP: 0.5 };
    if (params.optimizationTarget === 'separation_factor') {
      extractantRatio.P507 = 1.2;
      extractantRatio.kerosene = 2.8;
      extractantRatio.TBP = 0.4;
    } else if (params.optimizationTarget === 'reagent_consumption') {
      extractantRatio.P507 = 0.9;
      extractantRatio.kerosene = 3.2;
      extractantRatio.TBP = 0.55;
    }
    
    const impellerTypes = [ImpellerType.RUSHTON, ImpellerType.TURBINE, ImpellerType.PADDLE, ImpellerType.PROPELLER, ImpellerType.HElical];
    const randomImpeller = impellerTypes[Math.floor(Math.random() * impellerTypes.length)];
    
    const comparisonSchemes = [
      { name: '方案A(基准)', separationFactor: 2.3, stageEfficiency: 0.85, reagentConsumption: 1.0 },
      { name: '方案B(高效)', separationFactor: 2.6, stageEfficiency: 0.89, reagentConsumption: 1.15 },
      { name: '方案C(推荐)', separationFactor: 2.8, stageEfficiency: 0.91, reagentConsumption: 1.05 },
      { name: '方案D(经济)', separationFactor: 2.1, stageEfficiency: 0.82, reagentConsumption: 0.85 }
    ];
    
    const sensitivityAnalysis = [
      { dimension: 'pH值', value: 0.85 + Math.random() * 0.1 },
      { dimension: '相比', value: 0.70 + Math.random() * 0.1 },
      { dimension: '搅拌转速', value: 0.65 + Math.random() * 0.1 },
      { dimension: '萃取剂配比', value: 0.88 + Math.random() * 0.1 },
      { dimension: '温度', value: 0.52 + Math.random() * 0.1 },
      { dimension: '搅拌桨类型', value: 0.75 + Math.random() * 0.1 }
    ];
    
    const newRecommendation: Recommendation = {
      id: `rec${Date.now()}`,
      systemId: `sys${Date.now()}`,
      params,
      recommendedExtractantRatio: extractantRatio,
      recommendedImpellerType: randomImpeller,
      recommendedStirringSpeed: Math.round((params.stirringSpeedRange[0] + params.stirringSpeedRange[1]) / 2),
      recommendedPhaseRatio: Number(((params.phaseRatioRange[0] + params.phaseRatioRange[1]) / 2).toFixed(2)),
      recommendedPh: Number(((params.phRange[0] + params.phRange[1]) / 2).toFixed(1)),
      recommendedTemperature: 25 + Math.floor(Math.random() * 10),
      confidence: 0.80 + Math.random() * 0.15,
      predictedSeparationFactor: 2.0 + Math.random() * 1.0,
      predictedStageEfficiency: 0.80 + Math.random() * 0.15,
      historicalSimilarity: 0.70 + Math.random() * 0.25,
      similarTasks: ['task001', 'task006'],
      modelInfo: {
        algorithm: 'XGBoost + 多目标优化',
        trainingDataSize: 1256,
        lastUpdated: dayjs().toISOString()
      },
      comparisonSchemes,
      sensitivityAnalysis,
      createdAt: dayjs().toISOString()
    };
    
    set(state => ({
      recommendations: [newRecommendation, ...state.recommendations],
      currentRecommendation: newRecommendation,
      recommendationLoading: false
    }));
    
    return newRecommendation;
  },

  setCurrentRecommendation: (recommendation: Recommendation | null) => {
    set({ currentRecommendation: recommendation });
  },

  getSimilarCases: (elements?: string[]): SimilarCase[] => {
    const state = get();
    if (!elements || elements.length === 0) {
      return state.similarCases;
    }
    return state.similarCases;
  },

  exportRecommendationReport: (recommendationId: string) => {
    const recommendation = get().recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;
    
    const reportContent = {
      title: '智能推荐引擎报告',
      generatedAt: new Date().toISOString(),
      recommendation,
      modelInfo: recommendation.modelInfo
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendation-report-${recommendationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  applyRecommendation: (recommendationId: string) => {
    const recommendation = get().recommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }
    
    const feedConcentrations = recommendation.params?.targetElements.map(elem => ({
      element: elem,
      concentration: 0.15,
      unit: 'mol/L'
    })) || [];
    
    return {
      id: recommendation.systemId,
      name: `推荐方案-${recommendation.id}`,
      feedConcentrations,
      extractantRatio: recommendation.recommendedExtractantRatio,
      ph: recommendation.recommendedPh,
      targetSeparationFactor: recommendation.predictedSeparationFactor,
      temperature: recommendation.recommendedTemperature,
      mixerLength: 2.0,
      mixerWidth: 1.5,
      mixerHeight: 1.8,
      settlerLength: 5.0,
      settlerWidth: 2.0,
      settlerHeight: 1.5,
      impellerType: recommendation.recommendedImpellerType,
      impellerDiameter: 0.6,
      stages: 10,
      baffleConfig: '标准4挡板',
      stirringSpeed: recommendation.recommendedStirringSpeed,
      phaseRatio: recommendation.recommendedPhaseRatio
    };
  },

  updateSystemConfig: (config: Partial<SystemConfig>) => {
    set(state => ({
      systemConfig: {
        ...state.systemConfig,
        ...config,
        simulationEngine: {
          ...state.systemConfig.simulationEngine,
          ...config.simulationEngine
        },
        notification: {
          ...state.systemConfig.notification,
          ...config.notification,
          smtp: {
            ...state.systemConfig.notification.smtp,
            ...config.notification?.smtp
          },
          sms: {
            ...state.systemConfig.notification.sms,
            ...config.notification?.sms
          },
          templates: {
            ...state.systemConfig.notification.templates,
            ...config.notification?.templates
          }
        },
        dataExport: {
          ...state.systemConfig.dataExport,
          ...config.dataExport,
          pdfTemplate: {
            ...state.systemConfig.dataExport.pdfTemplate,
            ...config.dataExport?.pdfTemplate
          }
        },
        systemInfo: {
          ...state.systemConfig.systemInfo,
          ...config.systemInfo
        }
      }
    }));
  }
}));
