import React, { useState, useMemo, useCallback } from 'react';
import {
  Form,
  Select,
  Slider,
  Button,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Progress,
  Tooltip
} from 'antd';
import {
  PlayCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import {
  FlaskConical,
  Settings,
  Thermometer,
  Droplets,
  Zap,
  Brain,
  Database,
  Clock,
  TrendingUp,
  BarChart3,
  LineChart,
  Radar,
  CheckCircle,
  Info
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import KPICard from '@/components/common/KPICard';
import {
  RecommendationParams,
  Recommendation as RecommendationType,
  SimilarCase,
  ImpellerTypeLabels,
  ImpellerType
} from '@/types';
import { formatPercentage, formatDateTime, formatNumber } from '@/utils';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * 智能推荐引擎页面
 * 基于历史模拟数据，使用机器学习模型自动推荐最优的萃取分离工艺参数
 */
const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const {
    recommendations,
    currentRecommendation,
    recommendationLoading,
    similarCases,
    generateRecommendation,
    setCurrentRecommendation,
    getSimilarCases,
    exportRecommendationReport,
    applyRecommendation
  } = useAppStore();

  const [form] = Form.useForm<RecommendationParams>();
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(
    currentRecommendation?.id || null
  );

  /**
   * 稀土元素列表
   */
  const rareEarthElements = [
    'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb',
    'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Y', 'Sc'
  ];

  /**
   * 优化目标选项
   */
  const optimizationTargets = [
    { value: 'separation_factor', label: '最大化分离系数', icon: <TrendingUp size={16} /> },
    { value: 'stage_efficiency', label: '最大化级效率', icon: <Zap size={16} /> },
    { value: 'reagent_consumption', label: '最小化药剂消耗', icon: <Droplets size={16} /> },
    { value: 'multi_objective', label: '多目标优化', icon: <Brain size={16} /> }
  ];

  /**
   * 当前选中的推荐结果
   */
  const selectedRecommendation = useMemo(() => {
    if (selectedRecommendationId) {
      return recommendations.find(r => r.id === selectedRecommendationId) || currentRecommendation;
    }
    return currentRecommendation;
  }, [selectedRecommendationId, recommendations, currentRecommendation]);

  /**
   * 历史相似案例数据
   */
  const displaySimilarCases = useMemo((): SimilarCase[] => {
    return getSimilarCases(selectedRecommendation?.params?.targetElements);
  }, [getSimilarCases, selectedRecommendation]);

  /**
   * 生成推荐参数
   */
  const handleGenerateRecommendation = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const params: RecommendationParams = {
        targetElements: values.targetElements,
        impurityElements: values.impurityElements,
        optimizationTarget: values.optimizationTarget,
        phRange: values.phRange as [number, number],
        phaseRatioRange: values.phaseRatioRange as [number, number],
        stirringSpeedRange: values.stirringSpeedRange as [number, number]
      };

      const newRecommendation = await generateRecommendation(params);
      setSelectedRecommendationId(newRecommendation.id);
      message.success('智能推荐参数生成成功！');
    } catch (error) {
      message.error('参数校验失败，请检查输入');
    }
  }, [form, generateRecommendation]);

  /**
   * 应用推荐参数到新建任务页面
   */
  const handleApplyRecommendation = useCallback(() => {
    if (!selectedRecommendation) {
      message.warning('请先生成或选择一个推荐方案');
      return;
    }

    try {
      applyRecommendation(selectedRecommendation.id);
      message.success('推荐参数已应用，正在跳转到新建任务页面...');
      navigate('/tasks/new');
    } catch (error) {
      message.error('应用推荐参数失败');
    }
  }, [selectedRecommendation, applyRecommendation, navigate]);

  /**
   * 导出推荐报告
   */
  const handleExportReport = useCallback(() => {
    if (!selectedRecommendation) {
      message.warning('请先生成或选择一个推荐方案');
      return;
    }
    exportRecommendationReport(selectedRecommendation.id);
    message.success('推荐报告导出成功！');
  }, [selectedRecommendation, exportRecommendationReport]);

  /**
   * 重新计算推荐
   */
  const handleRecalculate = useCallback(() => {
    handleGenerateRecommendation();
  }, [handleGenerateRecommendation]);

  /**
   * 分离系数对比柱状图配置
   */
  const separationFactorChartOption = useMemo(() => {
    if (!selectedRecommendation?.comparisonSchemes) return {};

    const schemes = selectedRecommendation.comparisonSchemes;
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['分离系数', '目标值'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: schemes.map(s => s.name),
        axisLabel: {
          interval: 0,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '分离系数',
        min: 0
      },
      series: [
        {
          name: '分离系数',
          type: 'bar',
          data: schemes.map(s => s.separationFactor),
          itemStyle: {
            color: function (params: any) {
              const colorList = ['#94a3b8', '#64748b', '#2563eb', '#f59e0b'];
              return colorList[params.dataIndex] || '#2563eb';
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        },
        {
          name: '目标值',
          type: 'line',
          data: schemes.map(() => selectedRecommendation.params?.optimizationTarget === 'separation_factor' ? 2.5 : 2.0),
          lineStyle: {
            type: 'dashed',
            color: '#ef4444'
          },
          symbol: 'none'
        }
      ]
    };
  }, [selectedRecommendation]);

  /**
   * 级效率对比折线图配置
   */
  const stageEfficiencyChartOption = useMemo(() => {
    if (!selectedRecommendation?.comparisonSchemes) return {};

    const schemes = selectedRecommendation.comparisonSchemes;
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['级效率', '目标值'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: schemes.map(s => s.name),
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '级效率',
        min: 0,
        max: 1,
        axisLabel: {
          formatter: '{value * 100}%'
        }
      },
      series: [
        {
          name: '级效率',
          type: 'line',
          data: schemes.map(s => s.stageEfficiency),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#10b981'
          },
          itemStyle: {
            color: '#10b981'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
              ]
            }
          },
          label: {
            show: true,
            formatter: (params: any) => `${(params.value * 100).toFixed(1)}%`
          }
        },
        {
          name: '目标值',
          type: 'line',
          data: schemes.map(() => 0.85),
          lineStyle: {
            type: 'dashed',
            color: '#ef4444'
          },
          symbol: 'none'
        }
      ]
    };
  }, [selectedRecommendation]);

  /**
   * 参数灵敏度分析雷达图配置
   */
  const sensitivityChartOption = useMemo(() => {
    if (!selectedRecommendation?.sensitivityAnalysis) return {};

    const analysis = selectedRecommendation.sensitivityAnalysis;
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['参数灵敏度'],
        top: 0
      },
      radar: {
        indicator: analysis.map(item => ({
          name: item.dimension,
          max: 1
        })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#334155'
        },
        splitLine: {
          lineStyle: {
            color: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569']
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(37, 99, 235, 0.05)', 'rgba(37, 99, 235, 0.1)']
          }
        }
      },
      series: [
        {
          name: '参数灵敏度',
          type: 'radar',
          data: [
            {
              value: analysis.map(item => item.value),
              name: '参数灵敏度',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                color: '#2563eb'
              },
              areaStyle: {
                color: 'rgba(37, 99, 235, 0.25)'
              },
              itemStyle: {
                color: '#2563eb'
              }
            }
          ]
        }
      ]
    };
  }, [selectedRecommendation]);

  /**
   * 历史相似案例表格列配置
   */
  const caseTableColumns = useMemo(() => [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      ellipsis: true
    },
    {
      title: '实际分离系数',
      dataIndex: 'actualSeparationFactor',
      key: 'actualSeparationFactor',
      width: 120,
      render: (value: number) => (
        <Tag color="blue" className="font-medium">
          {formatNumber(value, 2)}
        </Tag>
      )
    },
    {
      title: '级效率',
      dataIndex: 'stageEfficiency',
      key: 'stageEfficiency',
      width: 120,
      render: (value: number) => (
        <Tag color={value >= 0.85 ? 'green' : 'orange'} className="font-medium">
          {formatPercentage(value)}
        </Tag>
      )
    },
    {
      title: 'pH值',
      dataIndex: 'ph',
      key: 'ph',
      width: 80
    },
    {
      title: '相比',
      dataIndex: 'phaseRatio',
      key: 'phaseRatio',
      width: 80
    },
    {
      title: '搅拌转速(rpm)',
      dataIndex: 'stirringSpeed',
      key: 'stirringSpeed',
      width: 120
    },
    {
      title: '搅拌桨类型',
      dataIndex: 'impellerType',
      key: 'impellerType',
      width: 120,
      render: (value: ImpellerType) => ImpellerTypeLabels[value]
    },
    {
      title: '萃取剂配比',
      dataIndex: 'extractantRatio',
      key: 'extractantRatio',
      render: (value: Record<string, number>) => (
        <Space direction="vertical" size={0}>
          {Object.entries(value).map(([key, val]) => (
            <Text key={key} type="secondary" className="text-xs">
              {key}: {formatNumber(val, 2)}
            </Text>
          ))}
        </Space>
      )
    }
  ], []);

  /**
   * 渲染萃取剂配比卡片内容
   */
  const renderExtractantRatioContent = (recommendation: RecommendationType) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(recommendation.recommendedExtractantRatio).map(([agent, ratio]) => (
          <div key={agent} className="flex items-center justify-between">
            <Text className="text-gray-600">{agent}</Text>
            <div className="flex items-center gap-3">
              <Progress
                percent={ratio * 25}
                size="small"
                showInfo={false}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#1d4ed8'
                }}
                className="w-24"
              />
              <Text strong className="text-gray-800 w-12 text-right">
                {formatNumber(ratio, 2)}
              </Text>
            </div>
          </div>
        ))}
      </div>
      <Divider className="my-2" />
      <div className="flex justify-between items-center">
        <div>
          <Text type="secondary" className="text-sm">预期分离系数</Text>
          <div className="text-xl font-bold text-primary-600">
            {formatNumber(recommendation.predictedSeparationFactor, 2)}
          </div>
        </div>
        <div className="text-right">
          <Text type="secondary" className="text-sm">置信度</Text>
          <div className="text-xl font-bold text-green-600">
            {formatPercentage(recommendation.confidence)}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染搅拌桨类型推荐卡片内容
   */
  const renderImpellerCardContent = (recommendation: RecommendationType) => {
    const impellerScenarios: Record<ImpellerType, string> = {
      [ImpellerType.TURBINE]: '适用于中低粘度体系，通用性强',
      [ImpellerType.PADDLE]: '适用于高粘度体系，剪切力小',
      [ImpellerType.PROPELLER]: '适用于低粘度大流量体系',
      [ImpellerType.RUSHTON]: '适用于气液两相，分散效果好',
      [ImpellerType.HElical]: '适用于高粘度层流体系'
    };

    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 mb-3">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {ImpellerTypeLabels[recommendation.recommendedImpellerType]}
          </div>
          <Text type="secondary" className="text-sm">
            {impellerScenarios[recommendation.recommendedImpellerType]}
          </Text>
        </div>
        <Divider className="my-2" />
        <div className="flex justify-between items-center">
          <div>
            <Text type="secondary" className="text-sm">预期级效率</Text>
            <div className="text-xl font-bold text-primary-600">
              {formatPercentage(recommendation.predictedStageEfficiency)}
            </div>
          </div>
          <div className="text-right">
            <Text type="secondary" className="text-sm">历史相似度</Text>
            <div className="text-xl font-bold text-accent-orange">
              {formatPercentage(recommendation.historicalSimilarity)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染工艺参数组合卡片内容
   */
  const renderProcessParamsContent = (recommendation: RecommendationType) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50">
        <Droplets className="w-5 h-5 text-blue-600 mx-auto mb-1" />
        <Text type="secondary" className="text-xs block">pH值</Text>
        <div className="text-lg font-bold text-blue-700">
          {formatNumber(recommendation.recommendedPh, 1)}
        </div>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-50">
        <BarChart3 className="w-5 h-5 text-green-600 mx-auto mb-1" />
        <Text type="secondary" className="text-xs block">相比(O/A)</Text>
        <div className="text-lg font-bold text-green-700">
          {formatNumber(recommendation.recommendedPhaseRatio, 2)}
        </div>
      </div>
      <div className="text-center p-3 rounded-lg bg-orange-50">
        <Settings className="w-5 h-5 text-orange-600 mx-auto mb-1" />
        <Text type="secondary" className="text-xs block">搅拌转速</Text>
        <div className="text-lg font-bold text-orange-700">
          {recommendation.recommendedStirringSpeed} rpm
        </div>
      </div>
      <div className="text-center p-3 rounded-lg bg-red-50">
        <Thermometer className="w-5 h-5 text-red-600 mx-auto mb-1" />
        <Text type="secondary" className="text-xs block">温度</Text>
        <div className="text-lg font-bold text-red-700">
          {recommendation.recommendedTemperature}°C
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 页面标题 */}
        <div className="gradient-primary rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-8 h-8 text-accent-orange" />
              <Title level={2} className="!text-white !mb-0">
                智能推荐引擎
              </Title>
            </div>
            <Paragraph className="!text-primary-100 !mb-0 text-lg">
              基于历史模拟结果和机器学习模型，智能分析并推荐最优的萃取分离工艺参数组合，
              帮助您快速找到最佳工艺条件，提高分离效率，降低药剂消耗。
            </Paragraph>
          </div>
        </div>

        <Spin spinning={recommendationLoading} tip="正在生成智能推荐方案..." size="large">
          <div className="space-y-6">
            {/* 参数输入区 */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-800">参数配置</span>
                </div>
              }
              className="card"
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  targetElements: ['La', 'Ce'],
                  impurityElements: ['Pr', 'Nd'],
                  optimizationTarget: 'separation_factor',
                  phRange: [3.0, 4.5],
                  phaseRatioRange: [1.0, 1.5],
                  stirringSpeedRange: [150, 200]
                }}
              >
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="targetElements"
                      label={
                        <span className="flex items-center gap-1">
                          <FlaskConical size={14} className="text-primary-600" />
                          目标稀土元素
                        </span>
                      }
                      rules={[{ required: true, message: '请选择目标稀土元素' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择目标稀土元素"
                        allowClear
                        maxTagCount={6}
                      >
                        {rareEarthElements.map(element => (
                          <Option key={element} value={element}>
                            {element}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="impurityElements"
                      label={
                        <span className="flex items-center gap-1">
                          <Droplets size={14} className="text-orange-600" />
                          杂质元素
                        </span>
                      }
                      rules={[{ required: true, message: '请选择杂质元素' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择杂质元素"
                        allowClear
                        maxTagCount={6}
                      >
                        {rareEarthElements.map(element => (
                          <Option key={element} value={element}>
                            {element}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="optimizationTarget"
                  label={
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-600" />
                      待优化目标
                    </span>
                  }
                  rules={[{ required: true, message: '请选择优化目标' }]}
                >
                  <Select placeholder="请选择优化目标">
                    {optimizationTargets.map(target => (
                      <Option key={target.value} value={target.value}>
                        <span className="flex items-center gap-2">
                          {target.icon}
                          {target.label}
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Row gutter={24}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="phRange"
                      label={
                        <span className="flex items-center gap-1">
                          <Droplets size={14} className="text-blue-600" />
                          pH值范围
                        </span>
                      }
                      rules={[{ required: true, message: '请设置pH值范围' }]}
                    >
                      <Slider
                        range
                        min={1.0}
                        max={7.0}
                        step={0.1}
                        marks={{
                          1: '1.0',
                          3: '3.0',
                          5: '5.0',
                          7: '7.0'
                        }}
                        tooltip={{
                          formatter: value => `${value?.toFixed(1)}`
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="phaseRatioRange"
                      label={
                        <span className="flex items-center gap-1">
                          <BarChart3 size={14} className="text-green-600" />
                          相比范围 (O/A)
                        </span>
                      }
                      rules={[{ required: true, message: '请设置相比范围' }]}
                    >
                      <Slider
                        range
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        marks={{
                          0.5: '0.5',
                          1.5: '1.5',
                          2.5: '2.5',
                          3: '3.0'
                        }}
                        tooltip={{
                          formatter: value => `${value?.toFixed(1)}`
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="stirringSpeedRange"
                      label={
                        <span className="flex items-center gap-1">
                          <Zap size={14} className="text-orange-600" />
                          搅拌转速范围 (rpm)
                        </span>
                      }
                      rules={[{ required: true, message: '请设置搅拌转速范围' }]}
                    >
                      <Slider
                        range
                        min={100}
                        max={300}
                        step={5}
                        marks={{
                          100: '100',
                          200: '200',
                          300: '300'
                        }}
                        tooltip={{
                          formatter: value => `${value} rpm`
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="flex justify-center pt-4">
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleGenerateRecommendation}
                    className="h-12 px-8 text-base"
                  >
                    生成智能推荐
                  </Button>
                </div>
              </Form>
            </Card>

            {/* 推荐结果区 */}
            {selectedRecommendation && (
              <>
                <div className="flex items-center justify-between">
                  <Title level={3} className="!mb-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span>推荐结果</span>
                    </div>
                  </Title>
                  {recommendations.length > 1 && (
                    <Select
                      value={selectedRecommendationId}
                      onChange={setSelectedRecommendationId}
                      style={{ width: 200 }}
                      placeholder="选择历史推荐方案"
                    >
                      {recommendations.map(rec => (
                        <Option key={rec.id} value={rec.id}>
                          {formatDateTime(rec.createdAt)}
                        </Option>
                      ))}
                    </Select>
                  )}
                </div>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={8}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <Droplets className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">最优萃取剂配比</span>
                        </div>
                      }
                      className="card h-full hover:shadow-lg transition-shadow"
                    >
                      {renderExtractantRatioContent(selectedRecommendation)}
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold">最优搅拌桨类型</span>
                        </div>
                      }
                      className="card h-full hover:shadow-lg transition-shadow"
                    >
                      {renderImpellerCardContent(selectedRecommendation)}
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold">最优工艺参数组合</span>
                        </div>
                      }
                      className="card h-full hover:shadow-lg transition-shadow"
                    >
                      {renderProcessParamsContent(selectedRecommendation)}
                    </Card>
                  </Col>
                </Row>

                {/* KPI指标卡片 */}
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} lg={6}>
                    <KPICard
                      title="预期分离系数"
                      value={formatNumber(selectedRecommendation.predictedSeparationFactor, 2)}
                      subtitle="目标值: 2.5"
                      icon={TrendingUp}
                      color="primary"
                      trend={{ value: 12, isPositive: true }}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <KPICard
                      title="预期级效率"
                      value={formatPercentage(selectedRecommendation.predictedStageEfficiency)}
                      subtitle="目标值: ≥85%"
                      icon={Zap}
                      color="success"
                      trend={{ value: 5, isPositive: true }}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <KPICard
                      title="推荐置信度"
                      value={formatPercentage(selectedRecommendation.confidence)}
                      subtitle="基于历史数据"
                      icon={Brain}
                      color="accent"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <KPICard
                      title="历史相似度"
                      value={formatPercentage(selectedRecommendation.historicalSimilarity)}
                      subtitle={`匹配 ${selectedRecommendation.similarTasks.length} 个相似任务`}
                      icon={Database}
                      color="cyan"
                    />
                  </Col>
                </Row>

                {/* 历史相似案例表格 */}
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary-600" />
                      <span className="font-semibold text-gray-800">历史相似案例</span>
                    </div>
                  }
                  className="card"
                >
                  <Table
                    dataSource={displaySimilarCases}
                    columns={caseTableColumns}
                    rowKey="taskName"
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`
                    }}
                    scroll={{ x: 1000 }}
                  />
                </Card>

                {/* 推荐参数对比图表 */}
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                  <Title level={3} className="!mb-0">
                    推荐参数对比分析
                  </Title>
                </div>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">分离系数对比</span>
                        </div>
                      }
                      className="card h-full"
                    >
                      <ReactECharts
                        option={separationFactorChartOption}
                        style={{ height: 320 }}
                        notMerge
                        lazyUpdate
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <LineChart className="w-4 h-4 text-green-600" />
                          <span className="font-medium">级效率对比</span>
                        </div>
                      }
                      className="card h-full"
                    >
                      <ReactECharts
                        option={stageEfficiencyChartOption}
                        style={{ height: 320 }}
                        notMerge
                        lazyUpdate
                      />
                    </Card>
                  </Col>
                  <Col xs={24}>
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <Radar className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">参数灵敏度分析</span>
                        </div>
                      }
                      className="card"
                    >
                      <ReactECharts
                        option={sensitivityChartOption}
                        style={{ height: 350 }}
                        notMerge
                        lazyUpdate
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 模型信息 */}
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-800">推荐引擎模型信息</span>
                    </div>
                  }
                  className="card"
                >
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <Text type="secondary" className="text-sm block">算法类型</Text>
                          <Text strong className="text-purple-700 text-lg">
                            {selectedRecommendation.modelInfo.algorithm}
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <Text type="secondary" className="text-sm block">训练数据量</Text>
                          <Text strong className="text-blue-700 text-lg">
                            {selectedRecommendation.modelInfo.trainingDataSize.toLocaleString()} 条
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <Text type="secondary" className="text-sm block">最后更新时间</Text>
                          <Text strong className="text-green-700 text-lg">
                            {formatDateTime(selectedRecommendation.modelInfo.lastUpdated)}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-4 p-4 rounded-xl bg-gray-50">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <Text type="secondary">
                          智能推荐引擎基于XGBoost机器学习算法，通过分析历史模拟任务数据，
                          建立工艺参数与分离效果之间的非线性映射关系，结合多目标优化算法，
                          为您推荐最优的工艺参数组合。模型会定期使用最新的模拟数据进行更新，
                          确保推荐结果的准确性和时效性。
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 操作按钮 */}
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Tooltip title="将推荐参数自动填充到新建任务页面">
                    <Button
                      type="primary"
                      size="large"
                      icon={<ArrowRightOutlined />}
                      onClick={handleApplyRecommendation}
                      className="h-12 px-8 text-base"
                    >
                      应用推荐参数
                    </Button>
                  </Tooltip>
                  <Tooltip title="导出完整的推荐报告（JSON格式）">
                    <Button
                      size="large"
                      icon={<DownloadOutlined />}
                      onClick={handleExportReport}
                      className="h-12 px-8 text-base"
                    >
                      导出推荐报告
                    </Button>
                  </Tooltip>
                  <Tooltip title="使用当前参数重新生成推荐方案">
                    <Button
                      size="large"
                      icon={<ReloadOutlined />}
                      onClick={handleRecalculate}
                      className="h-12 px-8 text-base"
                    >
                      重新计算推荐
                    </Button>
                  </Tooltip>
                </div>
              </>
            )}

            {/* 无推荐结果时的提示 */}
            {!selectedRecommendation && !recommendationLoading && (
              <Card className="card text-center py-16">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <Title level={4} className="!text-gray-500 !mb-2">
                  暂无推荐结果
                </Title>
                <Paragraph className="!text-gray-400">
                  请设置参数后点击"生成智能推荐"按钮，系统将为您推荐最优的工艺参数组合
                </Paragraph>
              </Card>
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default Recommendation;
