import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Button,
  Progress,
  Steps,
  Descriptions,
  Table,
  Tag,
  Space,
  Divider,
  message,
  Modal,
  Empty,
  Tooltip,
  FloatButton,
  Badge,
  List,
  Avatar,
  Timeline,
  Popconfirm
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  BoxPlotOutlined,
  MonitorOutlined,
  BarChartOutlined,
  AuditOutlined,
  HistoryOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  SettingOutlined,
  ExperimentOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { StatusBadge, AlertBadge } from '@/components/common/StatusBadge';
import {
  SimulationStatus,
  SimulationStatusLabels,
  AlertLevel,
  ImpellerTypeLabels,
  SimulationTask,
  TimeSeriesData
} from '@/types';
import {
  formatDateTime,
  formatNumber,
  formatPercentage,
  getStatusColor,
  getAlertLevelColor,
  getImpellerTypeLabel,
  getUserRoleLabel
} from '@/utils';
import dayjs from 'dayjs';
import { exportToCSV, exportToJSON } from '@/utils';
import { downloadReport } from '@/services/pdfService';
import { exportFullData } from '@/services/exportService';

/**
 * 模拟任务详情页面
 * 展示任务的完整信息，包括参数配置、实时监控、结果分析等
 */
const TaskDetail: React.FC = () => {
  // 获取URL参数中的任务ID
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 从状态管理中获取任务数据
  const { 
    getTaskById, 
    updateTaskStatus, 
    updateApproval,
    acknowledgeAlert,
    currentUser,
    deleteTask
  } = useAppStore();
  
  // 状态管理
  const [task, setTask] = useState<SimulationTask | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [alertPanelVisible, setAlertPanelVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取任务数据
  useEffect(() => {
    if (id) {
      const taskData = getTaskById(id);
      setTask(taskData);
      if (!taskData) {
        message.error('未找到该任务');
      }
    }
  }, [id, getTaskById]);

  // 定义7个状态流转步骤
  const statusSteps = useMemo(() => [
    { title: '待校验', status: SimulationStatus.PENDING_VERIFICATION },
    { title: '网格划分', status: SimulationStatus.MESHING },
    { title: '两相流动', status: SimulationStatus.TWO_PHASE_FLOW },
    { title: '传质反应', status: SimulationStatus.MASS_TRANSFER },
    { title: '级效率评估', status: SimulationStatus.EFFICIENCY_EVALUATION },
    { title: '已完成', status: SimulationStatus.COMPLETED }
  ], []);

  // 获取当前状态在步骤中的索引
  const getCurrentStepIndex = (): number => {
    if (!task) return -1;
    if (task.status === SimulationStatus.ABNORMAL_ROLLBACK) return -1;
    if (task.status === SimulationStatus.PAUSED) {
      const historyStatuses = task.statusHistory.map(h => h.status);
      for (let i = statusSteps.length - 1; i >= 0; i--) {
        if (historyStatuses.includes(statusSteps[i].status)) {
          return i;
        }
      }
      return 0;
    }
    return statusSteps.findIndex(s => s.status === task.status);
  };

  // 操作按钮处理函数
  const handleStart = () => {
    if (!task) return;
    setLoading(true);
    setTimeout(() => {
      updateTaskStatus(task.id, SimulationStatus.MESHING, '用户手动启动模拟');
      setTask(getTaskById(task.id));
      message.success('模拟已启动');
      setLoading(false);
    }, 500);
  };

  const handlePause = () => {
    if (!task) return;
    Modal.confirm({
      title: '确认暂停模拟',
      content: '暂停后可以随时继续，当前计算进度将被保存。',
      onOk: () => {
        updateTaskStatus(task.id, SimulationStatus.PAUSED, '用户手动暂停');
        setTask(getTaskById(task.id));
        message.success('模拟已暂停');
      }
    });
  };

  const handleCancel = () => {
    if (!task) return;
    Modal.confirm({
      title: '确认取消模拟',
      content: '取消后当前任务将被标记为异常回退，已生成的数据将会保留。此操作不可恢复。',
      okText: '确认取消',
      okType: 'danger',
      onOk: () => {
        updateTaskStatus(task.id, SimulationStatus.ABNORMAL_ROLLBACK, '用户取消模拟');
        setTask(getTaskById(task.id));
        message.success('模拟已取消');
      }
    });
  };

  const handleExportPDF = async () => {
    if (!task) return;
    message.loading({ content: '正在生成PDF报告...', key: 'pdf' });
    try {
      await downloadReport(task);
      message.success({ content: 'PDF报告导出成功', key: 'pdf' });
    } catch (error) {
      message.error({ content: 'PDF导出失败', key: 'pdf' });
    }
  };

  const handleExportData = () => {
    if (!task) return;
    Modal.confirm({
      title: '导出数据',
      content: '请选择导出格式：',
      okText: '导出CSV',
      cancelText: '导出JSON',
      onOk: () => {
        exportFullData(task, {
          format: 'csv',
          filterBy: {},
          includeMassTransferMatrix: true,
          includeLogisticsData: true
        });
        message.success('CSV数据导出成功');
      },
      onCancel: () => {
        exportFullData(task, {
          format: 'json',
          filterBy: {},
          includeMassTransferMatrix: true,
          includeLogisticsData: true
        });
        message.success('JSON数据导出成功');
      }
    });
  };

  const handleDelete = () => {
    if (!task) return;
    Modal.confirm({
      title: '确认删除任务',
      content: '删除后所有数据将被永久清除，此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      onOk: () => {
        deleteTask(task.id);
        message.success('任务已删除');
        navigate('/tasks');
      }
    });
  };

  // 审批处理函数
  const handleApproval = (stage: 'stage1' | 'stage2', approved: boolean) => {
    if (!task || !currentUser) return;
    
    const title = stage === 'stage1' 
      ? (approved ? '工艺工程师确认' : '驳回审批')
      : (approved ? '总工程师确认' : '驳回审批');
    
    Modal.confirm({
      title,
      content: approved ? '确认通过审批？' : '请确认驳回该审批申请。',
      onOk: () => {
        updateApproval(task.id, stage, approved, currentUser.id, approved ? '审核通过' : '审核驳回');
        setTask(getTaskById(task.id));
        message.success(approved ? '审批已通过' : '已驳回');
      }
    });
  };

  // 预警确认处理
  const handleAcknowledgeAlert = (alertId: string) => {
    if (!task || !currentUser) return;
    Modal.confirm({
      title: '确认预警',
      content: '确认已阅读并处理该预警？',
      onOk: () => {
        acknowledgeAlert(task.id, alertId, currentUser.id, '已确认处理');
        setTask(getTaskById(task.id));
        message.success('预警已确认');
      }
    });
  };

  // 判断操作按钮是否可用
  const canStart = task?.status === SimulationStatus.PENDING_VERIFICATION || 
                   task?.status === SimulationStatus.PAUSED ||
                   task?.status === SimulationStatus.ABNORMAL_ROLLBACK;
  const canPause = task?.status !== SimulationStatus.COMPLETED && 
                   task?.status !== SimulationStatus.PAUSED &&
                   task?.status !== SimulationStatus.ABNORMAL_ROLLBACK &&
                   task?.status !== SimulationStatus.PENDING_VERIFICATION;
  const canCancel = task?.status !== SimulationStatus.COMPLETED && 
                    task?.status !== SimulationStatus.ABNORMAL_ROLLBACK;

  // 获取创建人信息
  const getCreatorInfo = () => {
    if (!task) return '-';
    const users = useAppStore.getState().users;
    const creator = users.find(u => u.id === task.createdBy);
    return creator ? creator.username : '-';
  };

  // 获取审批人信息
  const getApproverName = (userId?: string) => {
    if (!userId) return '-';
    const users = useAppStore.getState().users;
    const user = users.find(u => u.id === userId);
    return user ? user.username : '-';
  };

  // 两相界面张力图表配置
  const getInterfacialTensionChart = () => {
    if (!task) return null;
    const data = task.monitoringData.interfacialTension;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '时间 (s)',
        data: data.map(d => d.time.toFixed(1))
      },
      yAxis: {
        type: 'value',
        name: '界面张力 (mN/m)',
        min: 15,
        max: 40
      },
      series: [{
        name: '界面张力',
        type: 'line',
        smooth: true,
        data: data.map(d => d.value),
        areaStyle: { opacity: 0.3 },
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }]
    };
  };

  // 组份分配比图表配置
  const getDistributionRatioChart = () => {
    if (!task) return null;
    const elements = Object.keys(task.monitoringData.distributionRatio);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: elements, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '时间 (s)',
        data: task.monitoringData.distributionRatio[elements[0]]?.map(d => d.time.toFixed(1)) || []
      },
      yAxis: {
        type: 'value',
        name: '分配比'
      },
      series: elements.map((el, idx) => ({
        name: el,
        type: 'line',
        smooth: true,
        data: task.monitoringData.distributionRatio[el]?.map(d => d.value) || [],
        lineStyle: { color: colors[idx % colors.length] },
        itemStyle: { color: colors[idx % colors.length] }
      }))
    };
  };

  // 停留时间分布图表配置
  const getResidenceTimeChart = () => {
    if (!task) return null;
    const data = task.monitoringData.residenceTimeDistribution;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '停留时间 (s)',
        data: data.map(d => d.time.toFixed(1))
      },
      yAxis: {
        type: 'value',
        name: '分布密度'
      },
      series: [{
        name: '停留时间分布',
        type: 'line',
        smooth: true,
        data: data.map(d => d.value),
        areaStyle: { opacity: 0.3, color: '#722ed1' },
        lineStyle: { color: '#722ed1' },
        itemStyle: { color: '#722ed1' }
      }]
    };
  };

  // 级效率曲线图表配置
  const getStageEfficiencyChart = () => {
    if (!task?.results) return null;
    const data = task.results.stageEfficiencyCurve;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '级数',
        data: Array.from({ length: data.length }, (_, i) => `第${i + 1}级`)
      },
      yAxis: {
        type: 'value',
        name: '级效率',
        min: 0.5,
        max: 1,
        axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' }
      },
      series: [{
        name: '级效率',
        type: 'bar',
        data: data,
        itemStyle: {
          color: (params: any) => {
            const val = params.value;
            if (val >= 0.9) return '#52c41a';
            if (val >= 0.8) return '#faad14';
            return '#ff4d4f';
          }
        },
        markLine: {
          data: [{ yAxis: 0.85, name: '目标值', lineStyle: { color: '#fa8c16', type: 'dashed' } }]
        }
      }]
    };
  };

  // 萃取率预测图表配置
  const getExtractionRateChart = () => {
    if (!task?.results) return null;
    const predictionData = task.results.raffinateRatePrediction;
    const stages = Array.from({ length: predictionData.length }, (_, i) => i + 1);
    
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['萃余率预测', '累积萃取率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '级数',
        data: stages.map(s => `第${s}级`)
      },
      yAxis: [
        {
          type: 'value',
          name: '萃余率',
          min: 0,
          max: 1,
          axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' }
        },
        {
          type: 'value',
          name: '累积萃取率',
          min: 0,
          max: 1,
          axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' }
        }
      ],
      series: [
        {
          name: '萃余率预测',
          type: 'line',
          smooth: true,
          data: predictionData,
          lineStyle: { color: '#f5222d' },
          itemStyle: { color: '#f5222d' },
          areaStyle: { opacity: 0.2 }
        },
        {
          name: '累积萃取率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: predictionData.map(v => 1 - v),
          lineStyle: { color: '#52c41a' },
          itemStyle: { color: '#52c41a' }
        }
      ]
    };
  };

  // 体积分数云图（热力图）配置
  const getVolumeFractionChart = () => {
    if (!task?.results) return null;
    const cloud = task.results.volumeFractionCloud;
    const heatmapData: any[] = [];
    
    // 取中间切片展示
    const zSlice = Math.floor(cloud.dimensions.z / 2);
    for (let x = 0; x < cloud.dimensions.x; x++) {
      for (let y = 0; y < cloud.dimensions.y; y++) {
        heatmapData.push([x, y, cloud.data[x][y][zSlice]]);
      }
    }

    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          return `位置: (${params.data[0]}, ${params.data[1]})<br/>体积分数: ${params.data[2].toFixed(4)}`;
        }
      },
      grid: { left: '10%', right: '10%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        name: 'X轴',
        data: Array.from({ length: cloud.dimensions.x }, (_, i) => i),
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        name: 'Y轴',
        data: Array.from({ length: cloud.dimensions.y }, (_, i) => i),
        splitArea: { show: true }
      },
      visualMap: {
        min: cloud.minValue,
        max: cloud.maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        }
      },
      series: [{
        name: '体积分数',
        type: 'heatmap',
        data: heatmapData,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 调整日志表格列定义
  const adjustmentLogColumns = [
    {
      title: '调整时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (val: string) => formatDateTime(val),
      width: 180
    },
    {
      title: '调整人',
      dataIndex: 'adjustedBy',
      key: 'adjustedBy',
      render: (val: string) => getApproverName(val),
      width: 120
    },
    {
      title: '参数名称',
      dataIndex: 'parameter',
      key: 'parameter',
      width: 150
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (val: number) => formatNumber(val),
      width: 100
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (val: number) => formatNumber(val),
      width: 100
    },
    {
      title: '调整原因',
      dataIndex: 'reason',
      key: 'reason'
    }
  ];

  // 如果任务不存在，显示空状态
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Empty description="未找到该任务" />
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/tasks')}
          className="mt-4"
        >
          返回任务列表
        </Button>
      </div>
    );
  }

  // Tab页配置
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="flex items-center gap-1">
          <InfoCircleOutlined />
          概览
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* 进度条 */}
          <Card title="模拟进度" size="small">
            <div className="mb-4">
              <Progress 
                percent={Math.round(task.progress)} 
                status={
                  task.status === SimulationStatus.COMPLETED ? 'success' :
                  task.status === SimulationStatus.ABNORMAL_ROLLBACK ? 'exception' :
                  'active'
                }
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
            
            {/* 状态时间线 Steps */}
            <Steps
              current={getCurrentStepIndex()}
              status={
                task.status === SimulationStatus.ABNORMAL_ROLLBACK ? 'error' :
                task.status === SimulationStatus.PAUSED ? 'wait' : 'process'
              }
              size="small"
              items={statusSteps.map((step, idx) => ({
                title: step.title,
                description: task.statusHistory.find(h => h.status === step.status) 
                  ? formatDateTime(task.statusHistory.find(h => h.status === step.status)!.timestamp)
                  : undefined
              }))}
            />
            
            {task.status === SimulationStatus.ABNORMAL_ROLLBACK && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertOutlined />
                  <span className="font-medium">模拟异常终止</span>
                </div>
                <p className="text-sm text-red-500 mt-1">
                  {task.statusHistory.find(h => h.status === SimulationStatus.ABNORMAL_ROLLBACK)?.details || '未知原因'}
                </p>
              </div>
            )}
            
            {task.status === SimulationStatus.PAUSED && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600">
                  <PauseCircleOutlined />
                  <span className="font-medium">模拟已暂停</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  {task.statusHistory.find(h => h.status === SimulationStatus.PAUSED)?.details || '点击"启动"继续模拟'}
                </p>
              </div>
            )}
          </Card>

          {/* 参数卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 基本信息卡片 */}
            <Card 
              title={
                <span className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-blue-500" />
                  基本信息
                </span>
              } 
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="任务ID">{task.id}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatDateTime(task.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="创建人">{getCreatorInfo()}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <StatusBadge status={task.status} size="sm" />
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">{formatDateTime(task.updatedAt)}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 萃取体系参数卡片 */}
            <Card 
              title={
                <span className="flex items-center gap-2">
                  <ExperimentOutlined className="text-purple-500" />
                  萃取体系参数
                </span>
              } 
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="料液浓度">
                  {task.system.feedConcentrations.map((fc, idx) => (
                    <Tag key={idx} color="blue">
                      {fc.element}: {formatNumber(fc.concentration)} {fc.unit}
                    </Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="萃取剂配比">
                  {Object.entries(task.system.extractantRatio).map(([key, val], idx) => (
                    <Tag key={idx} color="purple">
                      {key}: {val}
                    </Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="pH值">
                  <span className="font-medium">{task.system.ph}</span>
                </Descriptions.Item>
                <Descriptions.Item label="温度">
                  <span className="font-medium">{task.system.temperature} °C</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 几何构造卡片 */}
            <Card 
              title={
                <span className="flex items-center gap-2">
                  <ApartmentOutlined className="text-green-500" />
                  几何构造
                </span>
              } 
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="级数">
                  <span className="font-medium">{task.geometry.stages} 级</span>
                </Descriptions.Item>
                <Descriptions.Item label="混合室尺寸">
                  {formatNumber(task.geometry.mixerLength)} × {formatNumber(task.geometry.mixerWidth)} × {formatNumber(task.geometry.mixerHeight)} m
                </Descriptions.Item>
                <Descriptions.Item label="澄清室尺寸">
                  {formatNumber(task.geometry.settlerLength)} × {formatNumber(task.geometry.settlerWidth)} × {formatNumber(task.geometry.settlerHeight)} m
                </Descriptions.Item>
                <Descriptions.Item label="搅拌桨类型">
                  <Tag color="green">{getImpellerTypeLabel(task.geometry.impellerType)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="搅拌桨直径">
                  {formatNumber(task.geometry.impellerDiameter)} m
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 模拟参数卡片 */}
            <Card 
              title={
                <span className="flex items-center gap-2">
                  <SettingOutlined className="text-orange-500" />
                  模拟参数
                </span>
              } 
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="搅拌转速">
                  <span className="font-medium">{formatNumber(task.geometry.stirringSpeed)} rpm</span>
                </Descriptions.Item>
                <Descriptions.Item label="相比">
                  <span className="font-medium">{formatNumber(task.geometry.phaseRatio)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="目标萃取率">
                  <span className="font-medium">{formatPercentage(task.system.targetSeparationFactor / 3)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="网格精度">
                  <Tag color={task.simulationParams.gridPrecision === 'fine' ? 'red' : task.simulationParams.gridPrecision === 'medium' ? 'orange' : 'green'}>
                    {task.simulationParams.gridPrecision === 'fine' ? '精细' : task.simulationParams.gridPrecision === 'medium' ? '中等' : '粗糙'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="收敛阈值">
                  {task.simulationParams.convergenceThreshold}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>

          {/* 模拟结果摘要 */}
          {task.results && (
            <Card 
              title={
                <span className="flex items-center gap-2">
                  <BarChartOutlined className="text-cyan-500" />
                  模拟结果摘要
                </span>
              } 
              size="small"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(task.results.averageExtractionRate)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">平均萃取率</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(task.results.separationFactor)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">分离因子</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(task.results.materialBalance.error)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">质量平衡误差</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {task.geometry.stages}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">总级数</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )
    },
    {
      key: '3d',
      label: (
        <span className="flex items-center gap-1">
          <BoxPlotOutlined />
          3D可视化
        </span>
      ),
      children: (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BoxPlotOutlined className="text-6xl text-gray-400 mb-4" />
          <p className="text-lg text-gray-500 font-medium">3D可视化模块加载中</p>
          <p className="text-sm text-gray-400 mt-2">
            该模块将展示萃取槽内两相流动、浓度分布的三维可视化效果
          </p>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              流场展示
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              浓度云图
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              动态演示
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'monitoring',
      label: (
        <span className="flex items-center gap-1">
          <MonitorOutlined />
          实时监控
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card title="两相界面张力" size="small">
            <ReactECharts 
              option={getInterfacialTensionChart()} 
              style={{ height: 300 }} 
              notMerge={true}
            />
          </Card>
          
          <Card title="组份分配比" size="small">
            <ReactECharts 
              option={getDistributionRatioChart()} 
              style={{ height: 350 }} 
              notMerge={true}
            />
          </Card>
          
          <Card title="混合室停留时间分布" size="small">
            <ReactECharts 
              option={getResidenceTimeChart()} 
              style={{ height: 300 }} 
              notMerge={true}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'analysis',
      label: (
        <span className="flex items-center gap-1">
          <BarChartOutlined />
          结果分析
        </span>
      ),
      children: task.results ? (
        <div className="space-y-6">
          <Card title="级效率曲线" size="small">
            <ReactECharts 
              option={getStageEfficiencyChart()} 
              style={{ height: 300 }} 
              notMerge={true}
            />
          </Card>
          
          <Card title="萃取率预测" size="small">
            <ReactECharts 
              option={getExtractionRateChart()} 
              style={{ height: 350 }} 
              notMerge={true}
            />
          </Card>
          
          <Card 
            title={
              <span className="flex items-center gap-2">
                体积分数云图
                <Tag color="blue">Z = {Math.floor(task.results.volumeFractionCloud.dimensions.z / 2)} 截面</Tag>
              </span>
            } 
            size="small"
          >
            <ReactECharts 
              option={getVolumeFractionChart()} 
              style={{ height: 400 }} 
              notMerge={true}
            />
          </Card>

          {/* 质量衡算信息 */}
          <Card title="质量衡算" size="small">
            <Descriptions column={3} size="small">
              <Descriptions.Item label="入口总质量">
                {formatNumber(task.results.materialBalance.inlet)} mol
              </Descriptions.Item>
              <Descriptions.Item label="出口总质量">
                {formatNumber(task.results.materialBalance.outlet)} mol
              </Descriptions.Item>
              <Descriptions.Item label="相对误差">
                <Tag color={task.results.materialBalance.error < 0.01 ? 'green' : 'orange'}>
                  {formatPercentage(task.results.materialBalance.error)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96">
          <Empty description="模拟尚未完成，暂无结果数据" />
        </div>
      )
    },
    {
      key: 'approval',
      label: (
        <span className="flex items-center gap-1">
          <AuditOutlined />
          审批流程
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* 审批流程图 */}
          <Card title="审批流程" size="small">
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: '工艺工程师确认',
                  description: task.approval.stage1.approved 
                    ? `${getApproverName(task.approval.stage1.approvedBy)} 于 ${formatDateTime(task.approval.stage1.approvedAt!)} 确认`
                    : '待工艺工程师审核',
                  status: task.approval.stage1.approved ? 'finish' : 'wait',
                  icon: task.approval.stage1.approved ? <CheckCircleOutlined className="text-green-500" /> : <ClockCircleOutlined className="text-gray-400" />
                },
                {
                  title: '总工程师确认',
                  description: task.approval.stage2.approved 
                    ? `${getApproverName(task.approval.stage2.approvedBy)} 于 ${formatDateTime(task.approval.stage2.approvedAt!)} 确认`
                    : task.approval.stage1.approved 
                      ? '待总工程师审核'
                      : '需先通过工艺工程师确认',
                  status: task.approval.stage2.approved ? 'finish' : task.approval.stage1.approved ? 'wait' : 'error',
                  icon: task.approval.stage2.approved ? <CheckCircleOutlined className="text-green-500" /> : <ClockCircleOutlined className="text-gray-400" />
                },
                {
                  title: '推送至萃箱设计组',
                  description: task.approval.pushedToDesign 
                    ? `已于 ${formatDateTime(task.approval.pushedAt!)} 推送`
                    : '待总工程师确认后自动推送',
                  status: task.approval.pushedToDesign ? 'finish' : 'wait',
                  icon: task.approval.pushedToDesign ? <CheckCircleOutlined className="text-green-500" /> : <ClockCircleOutlined className="text-gray-400" />
                }
              ]}
            />
          </Card>

          {/* 审批操作按钮 */}
          {task.status === SimulationStatus.COMPLETED && (
            <Card title="审批操作" size="small">
              <div className="space-y-4">
                {/* 第一级审批 - 工艺工程师 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AuditOutlined className="text-blue-500" />
                      <span className="font-medium">第一级审批：工艺工程师确认</span>
                    </div>
                    {task.approval.stage1.approved ? (
                      <Tag color="success">已通过</Tag>
                    ) : (
                      <Tag color="warning">待审批</Tag>
                    )}
                  </div>
                  {task.approval.stage1.comments && (
                    <p className="text-sm text-gray-600 mb-3">
                      审批意见：{task.approval.stage1.comments}
                    </p>
                  )}
                  {!task.approval.stage1.approved && (
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApproval('stage1', true)}
                      >
                        确认通过
                      </Button>
                      <Button 
                        danger 
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApproval('stage1', false)}
                      >
                        驳回
                      </Button>
                    </Space>
                  )}
                </div>

                {/* 第二级审批 - 总工程师 */}
                <div className={`p-4 rounded-lg ${task.approval.stage1.approved ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AuditOutlined className="text-purple-500" />
                      <span className="font-medium">第二级审批：总工程师确认</span>
                    </div>
                    {task.approval.stage2.approved ? (
                      <Tag color="success">已通过</Tag>
                    ) : task.approval.stage1.approved ? (
                      <Tag color="warning">待审批</Tag>
                    ) : (
                      <Tag color="default">待上一级审批</Tag>
                    )}
                  </div>
                  {task.approval.stage2.comments && (
                    <p className="text-sm text-gray-600 mb-3">
                      审批意见：{task.approval.stage2.comments}
                    </p>
                  )}
                  {!task.approval.stage2.approved && task.approval.stage1.approved && (
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApproval('stage2', true)}
                      >
                        确认通过
                      </Button>
                      <Button 
                        danger 
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleApproval('stage2', false)}
                      >
                        驳回
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </Card>
          )}

          {task.status !== SimulationStatus.COMPLETED && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <AlertOutlined className="text-yellow-500 text-2xl mb-2" />
              <p className="text-yellow-700">模拟尚未完成，暂无法进行审批</p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'logs',
      label: (
        <span className="flex items-center gap-1">
          <HistoryOutlined />
          调整日志
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* 参数调整历史 */}
          <Card 
            title={
              <span className="flex items-center gap-2">
                <HistoryOutlined className="text-blue-500" />
                参数调整历史记录
              </span>
            } 
            size="small"
          >
            {task.adjustmentLog.length > 0 ? (
              <Table
                columns={adjustmentLogColumns}
                dataSource={task.adjustmentLog}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <Empty description="暂无参数调整记录" />
            )}
          </Card>

          {/* 状态变更时间线 */}
          <Card 
            title={
              <span className="flex items-center gap-2">
                <ClockCircleOutlined className="text-green-500" />
                状态变更历史
              </span>
            } 
            size="small"
          >
            <Timeline
              items={task.statusHistory.map(record => ({
                color: record.status === SimulationStatus.ABNORMAL_ROLLBACK ? 'red' : 
                       record.status === SimulationStatus.PAUSED ? 'orange' : 
                       record.status === SimulationStatus.COMPLETED ? 'green' : 'blue',
                children: (
                  <div className="py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={record.status} size="sm" />
                      <span className="text-sm text-gray-500">{formatDateTime(record.timestamp)}</span>
                    </div>
                    {record.details && (
                      <p className="text-sm text-gray-600">{record.details}</p>
                    )}
                    {record.duration && (
                      <p className="text-xs text-gray-400 mt-1">
                        持续时间: {record.duration < 60 ? `${record.duration}秒` : `${(record.duration / 60).toFixed(1)}分钟`}
                      </p>
                    )}
                  </div>
                )
              }))}
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部操作栏 */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 左侧：返回按钮、任务名称、状态 */}
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/tasks')}
                className="flex-shrink-0"
              >
                返回
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-800 truncate">
                    {task.name}
                  </h1>
                  <StatusBadge status={task.status} size="md" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  任务ID: {task.id}
                </p>
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip title={canStart ? '启动模拟' : '当前状态无法启动'}>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                  disabled={!canStart}
                  loading={loading && canStart}
                >
                  启动
                </Button>
              </Tooltip>
              
              <Tooltip title={canPause ? '暂停模拟' : '当前状态无法暂停'}>
                <Button 
                  icon={<PauseCircleOutlined />}
                  onClick={handlePause}
                  disabled={!canPause}
                >
                  暂停
                </Button>
              </Tooltip>
              
              <Tooltip title={canCancel ? '取消模拟' : '当前状态无法取消'}>
                <Button 
                  danger
                  icon={<StopOutlined />}
                  onClick={handleCancel}
                  disabled={!canCancel}
                >
                  取消
                </Button>
              </Tooltip>
              
              <Divider type="vertical" className="h-8" />
              
              <Tooltip title="导出PDF报告">
                <Button 
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                >
                  导出PDF
                </Button>
              </Tooltip>
              
              <Tooltip title="导出原始数据">
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExportData}
                >
                  导出数据
                </Button>
              </Tooltip>
              
              <Popconfirm
                title="确认删除此任务？"
                description="删除后所有数据将被永久清除，此操作不可恢复。"
                onConfirm={handleDelete}
                okText="确认删除"
                okType="danger"
                cancelText="取消"
              >
                <Button 
                  danger
                  ghost
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* 左侧Tabs内容 */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-sm">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                type="card"
              />
            </Card>
          </div>

          {/* 右侧预警面板 - 桌面端固定显示 */}
          <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-28">
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellOutlined className="text-orange-500" />
                      <span className="font-semibold">预警信息</span>
                    </div>
                    <Badge 
                      count={task.alerts.filter(a => !a.acknowledged).length} 
                      color="red"
                    />
                  </div>
                }
                size="small"
                className="shadow-sm"
              >
                {task.alerts.length > 0 ? (
                  <List
                    size="small"
                    dataSource={task.alerts}
                    renderItem={(alert) => (
                      <List.Item
                        className={`p-3 rounded-lg mb-2 ${
                          alert.acknowledged 
                            ? 'bg-gray-50' 
                            : alert.level === AlertLevel.CRITICAL 
                              ? 'bg-red-50 border border-red-200'
                              : alert.level === AlertLevel.DANGER
                                ? 'bg-orange-50 border border-orange-200'
                                : 'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <AlertBadge
                              type={alert.type}
                              level={alert.level}
                              size="sm"
                            />
                            {!alert.acknowledged && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                              >
                                确认
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>第{alert.stage}级</span>
                            <span>{formatDateTime(alert.timestamp)}</span>
                          </div>
                          {alert.acknowledged && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="text-xs text-gray-400">
                                已由 {getApproverName(alert.acknowledgedBy)} 于 {formatDateTime(alert.acknowledgedAt!)} 确认
                              </span>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无预警信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端浮动预警按钮 */}
      <div className="xl:hidden">
        <FloatButton
          icon={
            <Badge 
              count={task.alerts.filter(a => !a.acknowledged).length} 
              size="small"
            >
              <AlertOutlined />
            </Badge>
          }
          type="primary"
          tooltip="查看预警"
          onClick={() => setAlertPanelVisible(true)}
        />
      </div>

      {/* 移动端预警抽屉 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BellOutlined className="text-orange-500" />
            <span>预警信息</span>
            <Badge 
              count={task.alerts.filter(a => !a.acknowledged).length} 
              color="red"
              className="ml-2"
            />
          </div>
        }
        open={alertPanelVisible}
        onCancel={() => setAlertPanelVisible(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 400 }}
      >
        {task.alerts.length > 0 ? (
          <List
            size="small"
            dataSource={task.alerts}
            renderItem={(alert) => (
              <List.Item
                className={`p-3 rounded-lg mb-2 ${
                  alert.acknowledged 
                    ? 'bg-gray-50' 
                    : alert.level === AlertLevel.CRITICAL 
                      ? 'bg-red-50 border border-red-200'
                      : alert.level === AlertLevel.DANGER
                        ? 'bg-orange-50 border border-orange-200'
                        : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <AlertBadge
                      type={alert.type}
                      level={alert.level}
                      size="sm"
                    />
                    {!alert.acknowledged && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handleAcknowledgeAlert(alert.id);
                        }}
                      >
                        确认
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>第{alert.stage}级</span>
                    <span>{formatDateTime(alert.timestamp)}</span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无预警信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </div>
  );
};

export default TaskDetail;
