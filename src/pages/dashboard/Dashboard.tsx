import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  BarChart3,
  FileText,
  ChevronRight,
  Layers,
  Droplets,
  Activity
} from 'lucide-react';
import { useAppStore } from '@/store';
import KPICard from '@/components/common/KPICard';
import { StatusBadge, AlertBadge } from '@/components/common/StatusBadge';
import { formatDateTime, formatNumber, formatPercentage, getStatusLabel } from '@/utils';
import { Card, Empty, Tooltip } from 'antd';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    getStatistics,
    getActiveTasks,
    getPendingApprovalTasks,
    getUnacknowledgedAlerts,
    currentUser
  } = useAppStore();

  const statistics = getStatistics();
  const activeTasks = getActiveTasks().slice(0, 5);
  const pendingApprovalTasks = getPendingApprovalTasks().slice(0, 5);
  const alerts = getUnacknowledgedAlerts().slice(0, 5);

  const kpiData = [
    {
      title: '今日任务完成率',
      value: formatPercentage(statistics.completionRate),
      subtitle: `已完成 ${statistics.completedToday} / ${statistics.totalToday} 个任务`,
      icon: CheckCircle2,
      color: 'success' as const,
      trend: { value: 12.5, isPositive: true }
    },
    {
      title: '进行中模拟',
      value: statistics.runningTasks,
      subtitle: `待处理 ${statistics.pendingTasks} 个`,
      icon: Activity,
      color: 'primary' as const,
      trend: { value: 8.3, isPositive: true }
    },
    {
      title: '平均级效率',
      value: formatPercentage(statistics.averageStageEfficiency),
      subtitle: '目标值 ≥ 85%',
      icon: TrendingUp,
      color: 'accent' as const,
      trend: { value: 2.1, isPositive: true }
    },
    {
      title: '待处理预警',
      value: alerts.length,
      subtitle: `${alerts.filter(a => a.level === 'critical').length} 条严重`,
      icon: AlertTriangle,
      color: (alerts.length > 0 ? 'danger' : 'cyan') as 'danger' | 'cyan',
      trend: alerts.length > 0 
        ? { value: 15.2, isPositive: false } 
        : { value: 30, isPositive: true }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="gradient-primary rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <FlaskConical className="w-8 h-8 text-accent-orange" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              欢迎回来，{currentUser?.username || '用户'}
            </h1>
          </div>
          <p className="text-primary-100 text-lg">
            稀土萃取分离多物理场模拟与工艺参数智能优化平台
          </p>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/tasks/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusCircle size={18} />
              创建新模拟任务
            </button>
            <button
              onClick={() => navigate('/statistics')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <BarChart3 size={18} />
              查看统计分析
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            color={kpi.color}
            trend={kpi.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="col-span-1 lg:col-span-2"
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-800">进行中任务</span>
              </div>
              <button
                onClick={() => navigate('/tasks?status=active')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ChevronRight size={14} />
              </button>
            </div>
          }
        >
          {activeTasks.length === 0 ? (
            <Empty description="暂无进行中任务" />
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate group-hover:text-primary-700">
                          {task.name}
                        </h4>
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {task.system.feedConcentrations.map(fc => `${fc.element} ${fc.concentration}${fc.unit}`).join(' | ')}
                      </p>
                      
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {task.geometry.stages}级
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets size={12} />
                          相比 {task.geometry.phaseRatio}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateTime(task.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">模拟进度</span>
                          <span className="font-medium text-primary-600">
                            {formatNumber(task.progress)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-800">实时预警</span>
              </div>
            }
            className="flex-1"
          >
            {alerts.length === 0 ? (
              <Empty description="暂无待处理预警" />
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate(`/tasks/${alert.taskId}`)}
                    className="p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={
                        alert.level === 'critical' ? 'text-red-600' : 
                        alert.level === 'danger' ? 'text-red-500' : 'text-yellow-500'
                      }>
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertBadge
                            type={alert.type}
                            level={alert.level}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(alert.timestamp)} · 第{alert.stage}级
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-orange" />
                <span className="font-semibold text-gray-800">待审批任务</span>
              </div>
            }
            className="flex-1"
          >
            {pendingApprovalTasks.length === 0 ? (
              <Empty description="暂无待审批任务" />
            ) : (
              <div className="space-y-3">
                {pendingApprovalTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="p-3 rounded-lg border border-gray-100 hover:border-accent-orange/30 hover:bg-orange-50/30 transition-all duration-200 cursor-pointer"
                  >
                    <h4 className="text-sm font-medium text-gray-800 truncate mb-1">
                      {task.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(task.updatedAt)}
                      </span>
                      <Tooltip title={getStatusLabel(task.status)}>
                        <StatusBadge status={task.status} size="sm" showIcon={false} />
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
