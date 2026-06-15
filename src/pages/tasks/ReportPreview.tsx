import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Tag,
  Descriptions,
  Empty,
  message,
  Space,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { StatusBadge, AlertBadge } from '@/components/common/StatusBadge';
import {
  SimulationTask,
  AlertLevel,
  Alert
} from '@/types';
import {
  formatDateTime,
  formatNumber,
  formatPercentage,
  getImpellerTypeLabel,
  getRareEarthElementColor
} from '@/utils';
import { generateSimulationReport } from '@/services/pdfService';

/**
 * 模拟报告预览页面
 * 展示完整的模拟报告，支持打印和PDF导出
 */
const ReportPreview: React.FC = () => {
  // 从URL参数获取任务ID
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 从状态管理获取任务数据
  const { getTaskById } = useAppStore();

  // 状态管理
  const [task, setTask] = useState<SimulationTask | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  // 报告生成时间
  const reportGenerateTime = useMemo(() => new Date(), []);

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

  // 计算模拟总时长
  const calculateSimulationDuration = () => {
    if (!task) return '-';
    let totalDuration = 0;
    task.statusHistory.forEach(record => {
      if (record.duration) {
        totalDuration += record.duration;
      }
    });
    if (totalDuration < 60) return `${totalDuration.toFixed(0)}秒`;
    if (totalDuration < 3600) return `${(totalDuration / 60).toFixed(1)}分钟`;
    return `${(totalDuration / 3600).toFixed(2)}小时`;
  };

  // 级效率曲线图配置
  const getStageEfficiencyChart = () => {
    if (!task?.results) return null;
    const data = task.results.stageEfficiencyCurve;
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const paramArray = params as Array<{ name: string; value: number }>;
          const param = paramArray[0];
          return `${param.name}<br/>级效率: ${formatPercentage(param.value)}`;
        }
      },
      grid: { left: '10%', right: '5%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '级数',
        data: Array.from({ length: data.length }, (_, i) => `第${i + 1}级`),
        axisLabel: { rotate: 0, fontSize: 10 }
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
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: data,
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: {
          color: (params: { value: number }) => {
            const val = params.value;
            if (val >= 0.9) return '#52c41a';
            if (val >= 0.8) return '#faad14';
            return '#ff4d4f';
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        markLine: {
          data: [{ yAxis: 0.85, name: '目标值', lineStyle: { color: '#fa8c16', type: 'dashed', width: 2 } }],
          label: { formatter: '目标值: 85%' }
        }
      }]
    };
  };

  // 浓度轴向分布图配置
  const getConcentrationChart = () => {
    if (!task?.results) return null;
    const elements = Object.keys(task.results.concentrationAxialDistribution);
    const stages = Object.values(task.results.concentrationAxialDistribution)[0]?.length || 0;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const paramArray = params as Array<{ name: string; marker: string; seriesName: string; value: number }>;
          let result = `${paramArray[0].name}<br/>`;
          paramArray.forEach((param) => {
            result += `${param.marker} ${param.seriesName}: ${formatNumber(param.value, 4)} mol/L<br/>`;
          });
          return result;
        }
      },
      legend: { data: elements, bottom: 0 },
      grid: { left: '10%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        name: '级号',
        data: Array.from({ length: stages }, (_, i) => i === 0 ? '入口' : i === stages - 1 ? '出口' : `第${i}级`),
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '浓度 (mol/L)'
      },
      series: elements.map((el) => ({
        name: el,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: task.results!.concentrationAxialDistribution[el],
        lineStyle: { color: getRareEarthElementColor(el), width: 2 },
        itemStyle: { color: getRareEarthElementColor(el) }
      }))
    };
  };

  // 两相体积分数云图配置
  const getVolumeFractionChart = () => {
    if (!task?.results) return null;
    const cloud = task.results.volumeFractionCloud;
    const heatmapData: Array<[number, number, number]> = [];

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
        formatter: (params: unknown) => {
          const param = params as { data: [number, number, number] };
          return `坐标: (${param.data[0]}, ${param.data[1]})<br/>体积分数: ${formatNumber(param.data[2], 4)}`;
        }
      },
      grid: { left: '15%', right: '15%', bottom: '20%', top: '10%' },
      xAxis: {
        type: 'category',
        name: 'X方向',
        data: Array.from({ length: cloud.dimensions.x }, (_, i) => i),
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        name: 'Y方向',
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
        itemWidth: 15,
        itemHeight: 100,
        text: ['高', '低'],
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

  // 预警记录表格列定义
  const alertColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (_type: string, record: Alert) => (
        <AlertBadge type={record.type} level={record.level} size="sm" />
      )
    },
    {
      title: '预警级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: AlertLevel) => {
        const levelLabels: Record<AlertLevel, string> = {
          [AlertLevel.INFO]: '信息',
          [AlertLevel.WARNING]: '预警',
          [AlertLevel.DANGER]: '危险',
          [AlertLevel.CRITICAL]: '严重'
        };
        return (
          <Tag color={level === AlertLevel.CRITICAL ? 'red' : level === AlertLevel.DANGER ? 'orange' : 'gold'}>
            {levelLabels[level]}
          </Tag>
        );
      }
    },
    {
      title: '预警内容',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: '所在级号',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: number) => `第${stage}级`
    },
    {
      title: '预警时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (val: string) => formatDateTime(val)
    },
    {
      title: '确认状态',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      width: 100,
      render: (acknowledged: boolean) => (
        <Tag color={acknowledged ? 'green' : 'default'}>
          {acknowledged ? '已确认' : '未确认'}
        </Tag>
      )
    }
  ];

  // 萃余率预测表格列定义
  const raffinateColumns = [
    {
      title: '级号',
      dataIndex: 'stage',
      key: 'stage',
      width: 100
    },
    {
      title: '萃余率',
      dataIndex: 'raffinateRate',
      key: 'raffinateRate',
      render: (val: number) => formatPercentage(val)
    },
    {
      title: '累积萃取率',
      dataIndex: 'extractionRate',
      key: 'extractionRate',
      render: (val: number) => formatPercentage(val)
    }
  ];

  // 生成萃余率预测表格数据
  const getRaffinateTableData = () => {
    if (!task?.results) return [];
    return task.results.raffinateRatePrediction.map((rate, index) => ({
      key: index,
      stage: `第${index + 1}级`,
      raffinateRate: rate,
      extractionRate: 1 - rate
    }));
  };

  // 下载PDF报告
  const handleDownloadPDF = async () => {
    if (!task) return;
    setLoading(true);
    message.loading({ content: '正在生成PDF报告...', key: 'pdf' });
    try {
      const doc = await generateSimulationReport(task);
      doc.save(`萃取模拟报告_${task.id}_${reportGenerateTime.toISOString().slice(0, 10)}.pdf`);
      message.success({ content: 'PDF报告导出成功', key: 'pdf' });
    } catch (error) {
      console.error('PDF生成失败:', error);
      message.error({ content: 'PDF导出失败，请重试', key: 'pdf' });
    } finally {
      setLoading(false);
    }
  };

  // 打印报告
  const handlePrint = () => {
    window.print();
  };

  // 如果任务不存在，显示空状态
  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部工具栏 - 打印时隐藏 */}
      <div className="no-print bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                返回
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  模拟报告预览
                </h1>
                <p className="text-sm text-gray-500">{task.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleDownloadPDF}
                loading={loading}
                type="primary"
              >
                下载PDF
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                打印
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 报告内容区 - 可打印 */}
      <div id="report-content" className="max-w-4xl mx-auto px-4 py-8 print:px-0 print:py-0">
        {/* 报告封面 */}
        <div className="report-cover bg-white rounded-lg shadow-sm p-12 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b-2 print:border-gray-300" style={{ pageBreakAfter: 'always' }}>
          <div className="text-center">
            {/* 公司Logo占位 */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">RE</span>
            </div>

            {/* 报告标题 */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              稀土萃取分离模拟报告
            </h1>

            <div className="w-32 h-1 bg-blue-500 mx-auto mb-8" />

            {/* 报告信息 */}
            <div className="space-y-3 text-gray-600">
              <p className="text-lg">
                <span className="font-medium">任务编号：</span>
                <span className="font-mono">{task.id}</span>
              </p>
              <p className="text-lg">
                <span className="font-medium">任务名称：</span>
                {task.name}
              </p>
              <p className="text-lg">
                <span className="font-medium">生成时间：</span>
                {formatDateTime(reportGenerateTime)}
              </p>
            </div>

            {/* 底部保密声明 */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-400">
                本报告包含敏感技术信息，仅限内部使用
              </p>
              <p className="text-sm text-gray-400 mt-1">
                稀土萃取分离多物理场模拟与工艺参数智能优化平台
              </p>
            </div>
          </div>
        </div>

        {/* 第1章：任务基本信息 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
            任务基本信息
          </h2>
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="任务名称" span={2}>
              {task.name}
            </Descriptions.Item>
            <Descriptions.Item label="任务ID">
              <span className="font-mono">{task.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(task.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {getCreatorInfo()}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <StatusBadge status={task.status} size="md" />
            </Descriptions.Item>
            <Descriptions.Item label="模拟时长">
              {calculateSimulationDuration()}
            </Descriptions.Item>
            <Descriptions.Item label="完成进度">
              {formatPercentage(task.progress / 100)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(task.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 第2章：萃取体系参数 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
            萃取体系参数
          </h2>

          {/* 料液浓度表格 */}
          <h3 className="text-lg font-semibold text-gray-700 mb-3">2.1 料液浓度</h3>
          <Table
            dataSource={task.system.feedConcentrations.map((fc, idx) => ({ ...fc, key: idx }))}
            columns={[
              { title: '序号', dataIndex: 'key', key: 'key', render: (val: number) => val + 1, width: 80 },
              { title: '元素名称', dataIndex: 'element', key: 'element' },
              { title: '浓度', dataIndex: 'concentration', key: 'concentration', render: (val: number) => formatNumber(val, 4) },
              { title: '单位', dataIndex: 'unit', key: 'unit' }
            ]}
            pagination={false}
            size="middle"
            className="mb-6"
          />

          {/* 萃取剂配比表格 */}
          <h3 className="text-lg font-semibold text-gray-700 mb-3">2.2 萃取剂配比</h3>
          <Table
            dataSource={Object.entries(task.system.extractantRatio).map(([name, ratio], idx) => ({ key: idx, name, ratio }))}
            columns={[
              { title: '序号', dataIndex: 'key', key: 'key', render: (val: number) => val + 1, width: 80 },
              { title: '组分名称', dataIndex: 'name', key: 'name' },
              { title: '配比', dataIndex: 'ratio', key: 'ratio' }
            ]}
            pagination={false}
            size="middle"
            className="mb-6"
          />

          {/* 其他参数 */}
          <h3 className="text-lg font-semibold text-gray-700 mb-3">2.3 工艺参数</h3>
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="pH值">
              <span className="font-medium">{task.system.ph}</span>
            </Descriptions.Item>
            <Descriptions.Item label="温度">
              <span className="font-medium">{task.system.temperature} °C</span>
            </Descriptions.Item>
            <Descriptions.Item label="目标分离因子" span={2}>
              <span className="font-medium">{formatNumber(task.system.targetSeparationFactor, 3)}</span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 第3章：几何构造参数 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
            几何构造参数
          </h2>

          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="级数">
              <span className="font-medium">{task.geometry.stages} 级</span>
            </Descriptions.Item>
            <Descriptions.Item label="挡板配置">
              {task.geometry.baffleConfig}
            </Descriptions.Item>
            <Descriptions.Item label="混合室尺寸 (长×宽×高)">
              {formatNumber(task.geometry.mixerLength)} × {formatNumber(task.geometry.mixerWidth)} × {formatNumber(task.geometry.mixerHeight)} m
            </Descriptions.Item>
            <Descriptions.Item label="澄清室尺寸 (长×宽×高)">
              {formatNumber(task.geometry.settlerLength)} × {formatNumber(task.geometry.settlerWidth)} × {formatNumber(task.geometry.settlerHeight)} m
            </Descriptions.Item>
            <Descriptions.Item label="搅拌桨类型">
              <Tag color="green">{getImpellerTypeLabel(task.geometry.impellerType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="搅拌桨直径">
              {formatNumber(task.geometry.impellerDiameter)} m
            </Descriptions.Item>
            <Descriptions.Item label="搅拌转速">
              <span className="font-medium">{formatNumber(task.geometry.stirringSpeed)} rpm</span>
            </Descriptions.Item>
            <Descriptions.Item label="相比">
              <span className="font-medium">{formatNumber(task.geometry.phaseRatio, 2)}</span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 第4章：模拟结果 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
            模拟结果
          </h2>

          {task.results ? (
            <>
              {/* 结果摘要 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPercentage(task.results.averageExtractionRate)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">平均萃取率</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-3xl font-bold text-green-600">
                    {formatNumber(task.results.separationFactor, 3)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">分离因子</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatPercentage(task.results.materialBalance.error)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">质量平衡误差</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="text-3xl font-bold text-orange-600">
                    {task.geometry.stages}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">总级数</div>
                </div>
              </div>

              {/* 4.1 级效率曲线图 */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3">4.1 级效率曲线</h3>
              <div className="border border-gray-200 rounded-lg p-4 mb-8 bg-gray-50">
                <ReactECharts
                  option={getStageEfficiencyChart()}
                  style={{ height: 350 }}
                  notMerge={true}
                />
              </div>

              {/* 4.2 浓度轴向分布图 */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3">4.2 浓度轴向分布</h3>
              <div className="border border-gray-200 rounded-lg p-4 mb-8 bg-gray-50">
                <ReactECharts
                  option={getConcentrationChart()}
                  style={{ height: 400 }}
                  notMerge={true}
                />
              </div>

              {/* 4.3 两相体积分数云图 */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                4.3 两相体积分数云图
                <Tag color="blue" className="ml-2">Z = {Math.floor(task.results.volumeFractionCloud.dimensions.z / 2)} 截面</Tag>
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 mb-8 bg-gray-50">
                <ReactECharts
                  option={getVolumeFractionChart()}
                  style={{ height: 400 }}
                  notMerge={true}
                />
              </div>

              {/* 4.4 萃余率预测表 */}
              <h3 className="text-lg font-semibold text-gray-700 mb-3">4.4 萃余率预测</h3>
              <Table
                dataSource={getRaffinateTableData()}
                columns={raffinateColumns}
                pagination={false}
                size="middle"
              />

              {/* 质量衡算 */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">4.5 质量衡算</h3>
                <Descriptions column={3} bordered size="middle">
                  <Descriptions.Item label="入口总质量">
                    {formatNumber(task.results.materialBalance.inlet, 4)} mol
                  </Descriptions.Item>
                  <Descriptions.Item label="出口总质量">
                    {formatNumber(task.results.materialBalance.outlet, 4)} mol
                  </Descriptions.Item>
                  <Descriptions.Item label="相对误差">
                    <Tag color={task.results.materialBalance.error < 0.01 ? 'green' : 'orange'}>
                      {formatPercentage(task.results.materialBalance.error)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </>
          ) : (
            <div className="py-16">
              <Empty description="模拟尚未完成，暂无结果数据" />
            </div>
          )}
        </div>

        {/* 第5章：预警记录 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
            预警记录
          </h2>

          {task.alerts.length > 0 ? (
            <Table
              dataSource={task.alerts}
              columns={alertColumns}
              pagination={false}
              size="middle"
              rowKey="id"
            />
          ) : (
            <div className="py-16">
              <Empty description="本次模拟过程中无预警记录" />
            </div>
          )}
        </div>

        {/* 第6章：审批流程 */}
        <div className="report-section bg-white rounded-lg shadow-sm p-8 mb-8 print:shadow-none print:mb-0 print:rounded-none print:border-b print:border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">6</span>
            审批流程
          </h2>

          <div className="space-y-6">
            {/* 一级审批 */}
            <div className={`p-6 rounded-lg border-2 ${task.approval.stage1.approved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.approval.stage1.approved ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {task.approval.stage1.approved ? (
                      <CheckCircleOutlined className="text-white" />
                    ) : (
                      <ClockCircleOutlined className="text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">第一级审批：工艺工程师确认</h4>
                    <p className="text-sm text-gray-500">物质守恒验证与工艺参数确认</p>
                  </div>
                </div>
                <Tag color={task.approval.stage1.approved ? 'success' : 'default'}>
                  {task.approval.stage1.approved ? '已通过' : '待审批'}
                </Tag>
              </div>
              {task.approval.stage1.approved && (
                <div className="ml-13 pl-4 border-l-2 border-green-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">审批人：</span>{getApproverName(task.approval.stage1.approvedBy)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">审批时间：</span>{task.approval.stage1.approvedAt ? formatDateTime(task.approval.stage1.approvedAt) : '-'}
                  </p>
                  {task.approval.stage1.comments && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">审批意见：</span>{task.approval.stage1.comments}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 二级审批 */}
            <div className={`p-6 rounded-lg border-2 ${task.approval.stage2.approved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.approval.stage2.approved ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {task.approval.stage2.approved ? (
                      <CheckCircleOutlined className="text-white" />
                    ) : (
                      <ClockCircleOutlined className="text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">第二级审批：总工程师确认</h4>
                    <p className="text-sm text-gray-500">技术可行性与工程化评估</p>
                  </div>
                </div>
                <Tag color={task.approval.stage2.approved ? 'success' : 'default'}>
                  {task.approval.stage2.approved ? '已通过' : '待审批'}
                </Tag>
              </div>
              {task.approval.stage2.approved && (
                <div className="ml-13 pl-4 border-l-2 border-green-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">审批人：</span>{getApproverName(task.approval.stage2.approvedBy)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">审批时间：</span>{task.approval.stage2.approvedAt ? formatDateTime(task.approval.stage2.approvedAt) : '-'}
                  </p>
                  {task.approval.stage2.comments && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">审批意见：</span>{task.approval.stage2.comments}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 推送设计组 */}
            <div className={`p-6 rounded-lg border-2 ${task.approval.pushedToDesign ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${task.approval.pushedToDesign ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {task.approval.pushedToDesign ? (
                      <CheckCircleOutlined className="text-white" />
                    ) : (
                      <ClockCircleOutlined className="text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">推送至萃箱设计组</h4>
                    <p className="text-sm text-gray-500">审批通过后自动推送至设计部门</p>
                  </div>
                </div>
                <Tag color={task.approval.pushedToDesign ? 'processing' : 'default'}>
                  {task.approval.pushedToDesign ? '已推送' : '待推送'}
                </Tag>
              </div>
              {task.approval.pushedToDesign && (
                <div className="ml-13 pl-4 border-l-2 border-blue-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">推送时间：</span>{task.approval.pushedAt ? formatDateTime(task.approval.pushedAt) : '-'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 报告页脚 - 打印时显示页码 */}
        <div className="report-footer no-print bg-white p-6 text-center border-t border-gray-200 print:block">
          <p className="text-sm text-gray-500 mb-1">
            生成时间：{formatDateTime(reportGenerateTime)}
          </p>
          <p className="text-sm text-gray-400">
            本报告包含敏感技术信息，未经许可不得外传 | 稀土萃取分离多物理场模拟平台
          </p>
        </div>
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          
          #report-content {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          
          .report-cover {
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .report-section {
            page-break-inside: avoid;
          }
          
          .report-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding: 10px 0;
          }
          
          .report-footer::before {
            content: "第 " counter(page) " 页 / 共 " counter(pages) " 页";
            display: block;
            margin-bottom: 5px;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportPreview;
