import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Select,
  Table,
  Tag,
  Space,
  Dropdown,
  MenuProps,
  Tooltip,
  message,
  Spin
} from 'antd';
import {
  CheckCircle2,
  TrendingUp,
  Zap,
  Bell,
  Clock,
  Target,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Radar,
  FileSpreadsheet,
  FileText,
  Settings,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import { useAppStore } from '@/store';
import KPICard from '@/components/common/KPICard';
import { formatPercentage, formatNumber, formatDateTime, getUserRoleLabel } from '@/utils';
import { StatisticsData, User, ExtractionSystem, SimulationTask } from '@/types';
import { exportToCSV, exportToJSON } from '@/utils';
import type { ColumnsType } from 'antd/es/table';

/**
 * 时间范围类型定义
 */
type TimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * 统计看板页面组件
 * 展示稀土萃取模拟平台的各项统计数据和分析图表
 */
const Statistics: React.FC = () => {
  // ==================== 状态定义 ====================
  const [loading, setLoading] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('month');
  const [customDateRange, setCustomDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // ==================== Store 数据获取 ====================
  const {
    getStatistics,
    refreshStatistics,
    users,
    extractionSystems,
    tasks
  } = useAppStore();

  // 获取统计数据
  const statistics: StatisticsData = getStatistics();

  // ==================== 自动刷新功能 ====================
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      // 每60秒自动刷新一次数据
      intervalId = setInterval(() => {
        handleRefresh();
      }, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  // ==================== 事件处理函数 ====================
  /**
   * 手动刷新数据
   */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      refreshStatistics();
      setLastUpdateTime(new Date());
      setLoading(false);
      message.success('数据刷新成功');
    }, 500);
  }, [refreshStatistics]);

  /**
   * 切换自动刷新状态
   */
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    message.success(autoRefresh ? '已关闭自动刷新' : '已开启自动刷新');
  };

  /**
   * 导出统计报表
   * @param format 导出格式：excel 或 pdf
   */
  const handleExport = (format: 'excel' | 'pdf') => {
    setLoading(true);
    setTimeout(() => {
      try {
        const exportData = {
          生成时间: formatDateTime(new Date()),
          统计周期: getTimeRangeLabel(),
          任务完成率: formatPercentage(statistics.completionRate),
          平均级效率: formatPercentage(statistics.averageStageEfficiency),
          优化收敛次数: statistics.totalConvergenceCount,
          预警处理及时率: formatPercentage(statistics.alertTimelyRate),
          审批平均时长: `${formatNumber(statistics.avgApprovalTime)}小时`,
          分离因子达标率: formatPercentage(statistics.separationFactor达标率),
          总任务数: statistics.totalTasks,
          已完成任务: statistics.completedTasks,
          进行中任务: statistics.runningTasks,
          待处理任务: statistics.pendingTasks,
          失败任务: statistics.failedTasks
        };

        if (format === 'excel') {
          exportToCSV([exportData], `统计报表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
        } else {
          exportToJSON(exportData, `统计报表_${dayjs().format('YYYYMMDD_HHmmss')}.json`);
        }
        message.success(`已成功导出${format === 'excel' ? 'Excel' : 'PDF'}报表`);
      } catch (error) {
        message.error('导出失败，请重试');
      }
      setLoading(false);
    }, 800);
  };

  /**
   * 获取时间范围标签文本
   */
  const getTimeRangeLabel = (): string => {
    const labels: Record<TimeRangeType, string> = {
      today: '今日',
      week: '本周',
      month: '本月',
      quarter: '本季度',
      year: '本年',
      custom: '自定义'
    };
    return labels[timeRange];
  };

  // ==================== 图表配置 ====================
  /**
   * 性能雷达图配置
   * 展示6项核心指标：级效率、分离系数、收敛速度、稳定性、准确性、计算效率
   */
  const radarOption = useMemo(() => {
    const indicators = statistics.radarData.map(item => ({
      name: item.dimension,
      max: 100
    }));

    const values = statistics.radarData.map(item => item.value * 100);
    const thresholds = statistics.radarData.map(item => item.threshold * 100);

    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['当前值', '目标值'],
        bottom: 0
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#4B5563',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)']
          }
        }
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: values,
            name: '当前值',
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 2,
              color: '#3B82F6'
            },
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.3)'
            },
            itemStyle: {
              color: '#3B82F6'
            }
          },
          {
            value: thresholds,
            name: '目标值',
            symbol: 'diamond',
            symbolSize: 6,
            lineStyle: {
              width: 2,
              color: '#F59E0B',
              type: 'dashed'
            },
            itemStyle: {
              color: '#F59E0B'
            }
          }
        ]
      }]
    };
  }, [statistics.radarData]);

  /**
   * 任务完成趋势折线图配置（近30天）
   */
  const taskTrendOption = useMemo(() => {
    const dates = statistics.dailyStats.map(item => item.date.slice(5));
    const completed = statistics.dailyStats.map(item => item.completed);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: {
          lineStyle: { color: '#E5E7EB' }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          interval: 4
        }
      },
      yAxis: {
        type: 'value',
        name: '完成任务数',
        nameTextStyle: {
          color: '#6B7280',
          fontSize: 12
        },
        axisLine: {
          lineStyle: { color: '#E5E7EB' }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      series: [{
        name: '完成任务数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: completed,
        lineStyle: {
          width: 3,
          color: '#3B82F6'
        },
        itemStyle: {
          color: '#3B82F6',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      }]
    };
  }, [statistics.dailyStats]);

  /**
   * 级效率趋势面积图配置（近30天）
   */
  const efficiencyTrendOption = useMemo(() => {
    const dates = statistics.dailyStats.map(item => item.date.slice(5));
    const efficiency = statistics.dailyStats.map(item => item.efficiency * 100);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>级效率: ${data.value.toFixed(1)}%`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: {
          lineStyle: { color: '#E5E7EB' }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          interval: 4
        }
      },
      yAxis: {
        type: 'value',
        name: '级效率(%)',
        nameTextStyle: {
          color: '#6B7280',
          fontSize: 12
        },
        min: 70,
        max: 100,
        axisLine: {
          lineStyle: { color: '#E5E7EB' }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11,
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      series: [{
        name: '级效率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: efficiency,
        lineStyle: {
          width: 3,
          color: '#10B981'
        },
        itemStyle: {
          color: '#10B981',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#EF4444',
            type: 'dashed',
            width: 2
          },
          data: [{
            yAxis: 85,
            label: {
              formatter: '目标值 85%',
              color: '#EF4444',
              fontSize: 11
            }
          }]
        }
      }]
    };
  }, [statistics.dailyStats]);

  /**
   * 预警类型分布饼图配置
   */
  const alertTypeOption = useMemo(() => {
    const alertData = [
      { value: 35, name: '萃取率偏低', color: '#3B82F6' },
      { value: 25, name: '严重乳化', color: '#EF4444' },
      { value: 18, name: '分离因子偏差过大', color: '#F59E0B' },
      { value: 12, name: '收敛失败', color: '#8B5CF6' },
      { value: 10, name: '质量不守恒', color: '#6B7280' }
    ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 11,
          color: '#4B5563'
        }
      },
      series: [{
        type: 'pie',
        radius: ['0%', '65%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: alertData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
      }]
    };
  }, []);

  /**
   * 萃取体系使用分布环形图配置
   */
  const systemUsageOption = useMemo(() => {
    const systemData = [
      { value: 45, name: 'La/Ce分离体系', color: '#3B82F6' },
      { value: 30, name: 'Pr/Nd分离体系', color: '#10B981' },
      { value: 15, name: 'Eu/Gd分离体系', color: '#F59E0B' },
      { value: 10, name: '其他体系', color: '#8B5CF6' }
    ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 11,
          color: '#4B5563'
        }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const total = systemData.reduce((sum, item) => sum + item.value, 0);
            return `{total|${total}}\n{label|总次数}`;
          },
          rich: {
            total: {
              fontSize: 28,
              fontWeight: 'bold',
              color: '#1F2937',
              lineHeight: 40
            },
            label: {
              fontSize: 12,
              color: '#6B7280'
            }
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: systemData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
      }]
    };
  }, []);

  // ==================== 表格列配置 ====================
  /**
   * 各萃取体系性能对比表列定义
   */
  const systemPerformanceColumns: ColumnsType<ExtractionSystem & {
    taskCount: number;
    avgEfficiency: number;
    avgSeparationFactor: number;
    successRate: number;
  }> = [
    {
      title: '体系名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string) => (
        <span className="font-medium text-gray-800">{text}</span>
      )
    },
    {
      title: '任务数',
      dataIndex: 'taskCount',
      key: 'taskCount',
      width: 80,
      align: 'center',
      render: (value: number) => <Tag color="blue">{value}</Tag>
    },
    {
      title: '平均级效率',
      dataIndex: 'avgEfficiency',
      key: 'avgEfficiency',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <span className={value >= 0.85 ? 'text-green-600' : 'text-orange-500'}>
          {formatPercentage(value)}
        </span>
      )
    },
    {
      title: '平均分离因子',
      dataIndex: 'avgSeparationFactor',
      key: 'avgSeparationFactor',
      width: 110,
      align: 'center',
      render: (value: number) => formatNumber(value, 2)
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <span className={value >= 0.9 ? 'text-green-600' : 'text-red-500'}>
          {formatPercentage(value)}
        </span>
      )
    },
    {
      title: '目标分离因子',
      dataIndex: 'targetSeparationFactor',
      key: 'targetSeparationFactor',
      width: 110,
      align: 'center'
    },
    {
      title: 'pH值',
      dataIndex: 'ph',
      key: 'ph',
      width: 80,
      align: 'center'
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      align: 'center'
    }
  ];

  /**
   * 各用户任务完成情况表列定义
   */
  const userTaskColumns: ColumnsType<User & {
    completedTasks: number;
    totalTasks: number;
    avgEfficiency: number;
    pendingApproval: number;
  }> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => getUserRoleLabel(role as any)
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 100
    },
    {
      title: '已完成任务',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      width: 110,
      align: 'center',
      render: (value: number) => <Tag color="green">{value}</Tag>
    },
    {
      title: '总任务数',
      dataIndex: 'totalTasks',
      key: 'totalTasks',
      width: 90,
      align: 'center'
    },
    {
      title: '完成率',
      key: 'completionRate',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const rate = record.totalTasks > 0 ? record.completedTasks / record.totalTasks : 0;
        return (
          <span className={rate >= 0.8 ? 'text-green-600' : 'text-orange-500'}>
            {formatPercentage(rate)}
          </span>
        );
      }
    },
    {
      title: '平均级效率',
      dataIndex: 'avgEfficiency',
      key: 'avgEfficiency',
      width: 110,
      align: 'center',
      render: (value: number) => formatPercentage(value)
    },
    {
      title: '待审批',
      dataIndex: 'pendingApproval',
      key: 'pendingApproval',
      width: 90,
      align: 'center',
      render: (value: number) => value > 0 ? <Tag color="orange">{value}</Tag> : '-'
    }
  ];

  /**
   * 月度汇总表列定义
   */
  const monthlySummaryColumns: ColumnsType<{
    month: string;
    totalTasks: number;
    completedTasks: number;
    successRate: number;
    avgEfficiency: number;
    avgSeparationFactor: number;
    convergenceCount: number;
    alertCount: number;
  }> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>
    },
    {
      title: '总任务数',
      dataIndex: 'totalTasks',
      key: 'totalTasks',
      width: 100,
      align: 'center'
    },
    {
      title: '已完成',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      width: 90,
      align: 'center',
      render: (value: number) => <Tag color="green">{value}</Tag>
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 90,
      align: 'center',
      render: (value: number) => (
        <span className={value >= 0.85 ? 'text-green-600' : 'text-orange-500'}>
          {formatPercentage(value)}
        </span>
      )
    },
    {
      title: '平均级效率',
      dataIndex: 'avgEfficiency',
      key: 'avgEfficiency',
      width: 100,
      align: 'center',
      render: (value: number) => formatPercentage(value)
    },
    {
      title: '平均分离因子',
      dataIndex: 'avgSeparationFactor',
      key: 'avgSeparationFactor',
      width: 110,
      align: 'center',
      render: (value: number) => formatNumber(value, 2)
    },
    {
      title: '收敛次数',
      dataIndex: 'convergenceCount',
      key: 'convergenceCount',
      width: 100,
      align: 'center'
    },
    {
      title: '预警数',
      dataIndex: 'alertCount',
      key: 'alertCount',
      width: 90,
      align: 'center',
      render: (value: number) => value > 0 ? <Tag color="orange">{value}</Tag> : '-'
    }
  ];

  // ==================== 表格数据准备 ====================
  /**
   * 萃取体系性能对比表数据
   */
  const systemPerformanceData = useMemo(() => {
    return extractionSystems.map(system => {
      const systemTasks = tasks.filter(t => t.system.id === system.id);
      const completedTasks = systemTasks.filter(t => t.status === 'completed');
      const avgEfficiency = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.results?.averageExtractionRate || 0), 0) / completedTasks.length
        : 0;
      const avgSeparationFactor = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.results?.separationFactor || 0), 0) / completedTasks.length
        : 0;
      const successRate = systemTasks.length > 0 ? completedTasks.length / systemTasks.length : 0;

      return {
        ...system,
        key: system.id,
        taskCount: systemTasks.length,
        avgEfficiency,
        avgSeparationFactor,
        successRate
      };
    });
  }, [extractionSystems, tasks]);

  /**
   * 用户任务完成情况表数据
   */
  const userTaskData = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(t => t.createdBy === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed');
      const avgEfficiency = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.results?.averageExtractionRate || 0), 0) / completedTasks.length
        : 0;
      const pendingApproval = userTasks.filter(t =>
        t.status === 'completed' && (!t.approval.stage1.approved || !t.approval.stage2.approved)
      ).length;

      return {
        ...user,
        key: user.id,
        completedTasks: completedTasks.length,
        totalTasks: userTasks.length,
        avgEfficiency,
        pendingApproval
      };
    });
  }, [users, tasks]);

  /**
   * 月度汇总表数据
   */
  const monthlySummaryData = useMemo(() => {
    return statistics.monthlyTrend.map(item => ({
      key: item.month,
      month: item.month,
      totalTasks: Math.floor(item.completed / (item.efficiency * 0.9)),
      completedTasks: item.completed,
      successRate: item.efficiency,
      avgEfficiency: item.efficiency,
      avgSeparationFactor: 2.2 + Math.random() * 0.3,
      convergenceCount: Math.floor(Math.random() * 500) + 800,
      alertCount: Math.floor(Math.random() * 10) + 2
    }));
  }, [statistics.monthlyTrend]);

  // ==================== 导出菜单配置 ====================
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileSpreadsheet size={16} />,
      label: '导出 Excel 报表',
      onClick: () => handleExport('excel')
    },
    {
      key: 'pdf',
      icon: <FileText size={16} />,
      label: '导出 PDF 报表',
      onClick: () => handleExport('pdf')
    }
  ];

  // ==================== 时间范围选项 ====================
  const timeRangeOptions = [
    { value: 'today', label: '今日' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'quarter', label: '本季度' },
    { value: 'year', label: '本年' },
    { value: 'custom', label: '自定义' }
  ];

  // ==================== KPI 卡片数据 ====================
  const kpiData = [
    {
      title: '模拟完成率',
      value: formatPercentage(statistics.completionRate),
      subtitle: `今日 ${statistics.completedToday}/${statistics.totalToday} · 本周 ${statistics.completedThisWeek}/${statistics.totalThisWeek} · 本月 ${statistics.completedThisMonth}/${statistics.totalThisMonth}`,
      icon: CheckCircle2,
      color: 'success' as const,
      trend: { value: 5.2, isPositive: true }
    },
    {
      title: '平均级效率',
      value: formatPercentage(statistics.averageStageEfficiency),
      subtitle: '目标值 ≥ 85%',
      icon: TrendingUp,
      color: 'primary' as const,
      trend: { value: 2.1, isPositive: true }
    },
    {
      title: '优化收敛次数',
      value: statistics.totalConvergenceCount.toLocaleString(),
      subtitle: `今日 ${statistics.convergenceCountToday} 次`,
      icon: Zap,
      color: 'accent' as const,
      trend: { value: 8.5, isPositive: true }
    },
    {
      title: '预警处理及时率',
      value: formatPercentage(statistics.alertTimelyRate),
      subtitle: '目标值 ≥ 90%',
      icon: Bell,
      color: statistics.alertTimelyRate >= 0.9 ? 'cyan' as const : 'warning' as const,
      trend: { value: 3.2, isPositive: true }
    },
    {
      title: '审批平均时长',
      value: `${formatNumber(statistics.avgApprovalTime)} 小时`,
      subtitle: '从完成到审批通过',
      icon: Clock,
      color: 'warning' as const,
      trend: { value: 15.3, isPositive: false }
    },
    {
      title: '分离因子达标率',
      value: formatPercentage(statistics.separationFactor达标率),
      subtitle: `平均 ${formatNumber(statistics.avgSeparationFactor, 2)}`,
      icon: Target,
      color: statistics.separationFactor达标率 >= 0.85 ? 'success' as const : 'danger' as const,
      trend: { value: 4.7, isPositive: true }
    }
  ];

  // ==================== 渲染 ====================
  return (
    <div className="space-y-6 pb-8">
      {/* ==================== 页面标题和操作栏 ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            统计看板
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            全面展示稀土萃取模拟平台的运行数据和性能指标
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 时间范围筛选器 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select
              value={timeRange}
              onChange={(value) => {
                setTimeRange(value);
                if (value !== 'custom') {
                  setCustomDateRange(null);
                }
              }}
              options={timeRangeOptions}
              style={{ width: 120 }}
              size="middle"
            />
            {timeRange === 'custom' && (
              <DatePicker.RangePicker
                value={customDateRange}
                onChange={(dates) => setCustomDateRange(dates as [Dayjs, Dayjs])}
                size="middle"
              />
            )}
          </div>

          {/* 自动刷新切换 */}
          <Tooltip title={autoRefresh ? '关闭自动刷新' : '开启自动刷新'}>
            <Button
              icon={autoRefresh ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
              onClick={toggleAutoRefresh}
              type={autoRefresh ? 'primary' : 'default'}
              size="middle"
            >
              {autoRefresh ? '自动刷新中' : '已暂停'}
            </Button>
          </Tooltip>

          {/* 手动刷新按钮 */}
          <Tooltip title="刷新数据">
            <Button
              icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
              onClick={handleRefresh}
              loading={loading}
              size="middle"
            >
              刷新
            </Button>
          </Tooltip>

          {/* 导出按钮 */}
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button
              type="primary"
              icon={<Download size={16} />}
              size="middle"
            >
              导出报表
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <Clock size={12} />
        最后更新: {formatDateTime(lastUpdateTime)}
      </div>

      <Spin spinning={loading} tip="数据加载中...">
        {/* ==================== KPI 卡片区域 ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

        {/* ==================== 性能雷达图 ==================== */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gray-800">性能雷达图</span>
              <span className="text-xs text-gray-400 ml-2">六大核心指标评估</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="h-80">
            <ReactECharts
              option={radarOption}
              style={{ height: '100%', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </Card>

        {/* ==================== 趋势分析图表区域 ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 任务完成趋势 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-800">任务完成趋势</span>
                <span className="text-xs text-gray-400 ml-2">近30天</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="h-72">
              <ReactECharts
                option={taskTrendOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>

          {/* 级效率趋势 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">级效率趋势</span>
                <span className="text-xs text-gray-400 ml-2">近30天</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="h-72">
              <ReactECharts
                option={efficiencyTrendOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>

          {/* 预警类型分布 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-gray-800">预警类型分布</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="h-72">
              <ReactECharts
                option={alertTypeOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>

          {/* 萃取体系使用分布 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-800">萃取体系使用分布</span>
              </div>
            }
            className="shadow-sm"
          >
            <div className="h-72">
              <ReactECharts
                option={systemUsageOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            </div>
          </Card>
        </div>

        {/* ==================== 统计表格区域 ==================== */}
        <div className="space-y-6">
          {/* 各萃取体系性能对比表 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-800">各萃取体系性能对比</span>
              </div>
            }
            className="shadow-sm"
          >
            <Table
              columns={systemPerformanceColumns}
              dataSource={systemPerformanceData}
              scroll={{ x: 900 }}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              size="middle"
            />
          </Card>

          {/* 各用户任务完成情况表 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-orange" />
                <span className="font-semibold text-gray-800">各用户任务完成情况</span>
              </div>
            }
            className="shadow-sm"
          >
            <Table
              columns={userTaskColumns}
              dataSource={userTaskData}
              scroll={{ x: 900 }}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              size="middle"
            />
          </Card>

          {/* 月度汇总表 */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">月度汇总</span>
              </div>
            }
            className="shadow-sm"
          >
            <Table
              columns={monthlySummaryColumns}
              dataSource={monthlySummaryData}
              scroll={{ x: 900 }}
              pagination={false}
              size="middle"
            />
          </Card>
        </div>
      </Spin>
    </div>
  );
};

export default Statistics;
