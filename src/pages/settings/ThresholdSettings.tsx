import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Slider,
  Button,
  Card,
  Row,
  Col,
  Select,
  Checkbox,
  message,
  Tooltip,
  FormInstance
} from 'antd';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Save,
  RotateCcw,
  Info,
  Settings,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/store';
import { AlertThresholds } from '@/types';
import { mockAlertThresholds } from '@/data/mockData';

/**
 * 阈值说明配置
 * 包含每个阈值的详细解释和影响说明
 */
const thresholdDescriptions: Record<string, { title: string; description: string; impact: string }> = {
  minExtractionRate: {
    title: '萃取率下限阈值',
    description: '萃取过程中目标元素的最低萃取率要求，低于该值将触发预警。',
    impact: '影响：萃取率过低会导致产品回收率下降，增加生产成本。'
  },
  maxEmulsificationIndex: {
    title: '乳化严重程度阈值',
    description: '衡量两相混合后乳化现象的严重程度，超过该值将触发预警。',
    impact: '影响：严重乳化会导致相分离困难，降低分离效率，甚至造成生产事故。'
  },
  maxDeviationPercentage: {
    title: '分离因子偏差阈值',
    description: '实际分离因子与目标值的最大允许偏差百分比，超过该值将触发预警。',
    impact: '影响：分离因子偏差过大会影响产品纯度，导致分离效果不符合工艺要求。'
  },
  maxMassBalanceError: {
    title: '质量平衡误差阈值',
    description: '物料衡算中进出口物料质量的最大允许误差百分比，超过该值将触发预警。',
    impact: '影响：质量不守恒可能表明测量数据存在问题或有物料泄漏，需要及时排查。'
  },
  minInterfacialTension: {
    title: '界面张力下限阈值',
    description: '两相界面张力的最低允许值，低于该值将触发预警。',
    impact: '影响：界面张力过低会导致乳化现象加剧，延长相分离时间，降低设备处理能力。'
  },
  maxResidenceTimeDeviation: {
    title: '停留时间偏差阈值',
    description: '实际停留时间与设计值的最大允许偏差百分比，超过该值将触发预警。',
    impact: '影响：停留时间偏差过大会影响传质效果，导致萃取率和分离效率下降。'
  }
};

/**
 * 通知方式选项配置
 */
const notifyMethodOptions = [
  { label: '站内信', value: 'in_app' },
  { label: '邮件', value: 'email' },
  { label: '短信', value: 'sms' }
];

/**
 * 图标映射
 * 用于根据配置的图标名称渲染对应的Lucide图标
 */
const iconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  AlertOctagon,
  AlertTriangle,
  AlertCircle
};

const ThresholdSettings: React.FC = () => {
  // 从store获取阈值配置和更新方法
  const { alertThresholds, updateAlertThresholds } = useAppStore();
  
  // Form实例
  const [form] = Form.useForm<AlertThresholds>();
  
  // 加载状态
  const [loading, setLoading] = useState(false);

  /**
   * 处理表单提交
   * 将表单数据保存到store中
   */
  const handleSubmit = async (values: AlertThresholds) => {
    setLoading(true);
    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新store中的阈值配置
      updateAlertThresholds(values);
      
      message.success('阈值配置保存成功！');
    } catch {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 恢复默认值
   * 将表单重置为mock数据中的默认配置
   */
  const handleReset = () => {
    form.setFieldsValue(mockAlertThresholds);
    message.info('已恢复默认配置');
  };

  /**
   * 获取对应级别的图标组件
   */
  const getLevelIcon = (iconName: string, color: string) => {
    const IconComponent = iconMap[iconName] || AlertCircle;
    return <IconComponent className="w-5 h-5" style={{ color }} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="w-7 h-7 text-blue-600" />
          阈值设置
        </h1>
        <p className="text-gray-500 mt-2 ml-10">
          配置预警系统的各项阈值参数，包括预警阈值、预警级别和自动调整参数
        </p>
      </div>

      {/* 表单容器 */}
      <Form
        form={form}
        layout="vertical"
        initialValues={alertThresholds}
        onFinish={handleSubmit}
        className="space-y-6"
      >
        {/* 第一部分：预警阈值配置 */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold">预警阈值配置</span>
            </div>
          }
          className="shadow-sm"
          extra={
            <Tooltip title="设置各项预警指标的触发阈值">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          }
        >
          <Row gutter={[24, 24]}>
            {/* 萃取率下限阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.minExtractionRate.title}
                    <Tooltip title={thresholdDescriptions.minExtractionRate.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="minExtractionRate"
                rules={[{ required: true, message: '请输入萃取率下限阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.minExtractionRate.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="minExtractionRate" noStyle>
                    <Slider
                      min={50 as number}
                      max={100 as number}
                      step={1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value}%` }}
                    />
                  </Form.Item>
                  <Form.Item name="minExtractionRate" noStyle>
                    <InputNumber
                      min={50 as number}
                      max={100 as number}
                      step={1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value ? parseFloat(value.replace('%', '')) : 0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 乳化严重程度阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.maxEmulsificationIndex.title}
                    <Tooltip title={thresholdDescriptions.maxEmulsificationIndex.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="maxEmulsificationIndex"
                rules={[{ required: true, message: '请输入乳化严重程度阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.maxEmulsificationIndex.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="maxEmulsificationIndex" noStyle>
                    <Slider
                      min={0 as number}
                      max={100 as number}
                      step={1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value}` }}
                    />
                  </Form.Item>
                  <Form.Item name="maxEmulsificationIndex" noStyle>
                    <InputNumber
                      min={0 as number}
                      max={100 as number}
                      step={1}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 分离因子偏差阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.maxDeviationPercentage.title}
                    <Tooltip title={thresholdDescriptions.maxDeviationPercentage.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="maxDeviationPercentage"
                rules={[{ required: true, message: '请输入分离因子偏差阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.maxDeviationPercentage.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="maxDeviationPercentage" noStyle>
                    <Slider
                      min={1 as number}
                      max={50 as number}
                      step={1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value}%` }}
                    />
                  </Form.Item>
                  <Form.Item name="maxDeviationPercentage" noStyle>
                    <InputNumber
                      min={1 as number}
                      max={50 as number}
                      step={1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value ? parseFloat(value.replace('%', '')) : 0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 质量平衡误差阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.maxMassBalanceError.title}
                    <Tooltip title={thresholdDescriptions.maxMassBalanceError.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="maxMassBalanceError"
                rules={[{ required: true, message: '请输入质量平衡误差阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.maxMassBalanceError.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="maxMassBalanceError" noStyle>
                    <Slider
                      min={0.1 as number}
                      max={10 as number}
                      step={0.1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value}%` }}
                    />
                  </Form.Item>
                  <Form.Item name="maxMassBalanceError" noStyle>
                    <InputNumber
                      min={0.1 as number}
                      max={10 as number}
                      step={0.1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value ? parseFloat(value.replace('%', '')) : 0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 界面张力下限阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.minInterfacialTension.title}
                    <Tooltip title={thresholdDescriptions.minInterfacialTension.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="minInterfacialTension"
                rules={[{ required: true, message: '请输入界面张力下限阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.minInterfacialTension.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="minInterfacialTension" noStyle>
                    <Slider
                      min={1 as number}
                      max={50 as number}
                      step={1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value} mN/m` }}
                    />
                  </Form.Item>
                  <Form.Item name="minInterfacialTension" noStyle>
                    <InputNumber
                      min={1 as number}
                      max={50 as number}
                      step={1}
                      addonAfter="mN/m"
                      style={{ width: 130 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 停留时间偏差阈值 */}
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center gap-2">
                    {thresholdDescriptions.maxResidenceTimeDeviation.title}
                    <Tooltip title={thresholdDescriptions.maxResidenceTimeDeviation.description}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="maxResidenceTimeDeviation"
                rules={[{ required: true, message: '请输入停留时间偏差阈值' }]}
                extra={
                  <span className="text-xs text-gray-500">
                    {thresholdDescriptions.maxResidenceTimeDeviation.impact}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Form.Item name="maxResidenceTimeDeviation" noStyle>
                    <Slider
                      min={5 as number}
                      max={50 as number}
                      step={1}
                      className="flex-1"
                      tooltip={{ formatter: (value) => `${value}%` }}
                    />
                  </Form.Item>
                  <Form.Item name="maxResidenceTimeDeviation" noStyle>
                    <InputNumber
                      min={5 as number}
                      max={50 as number}
                      step={1}
                      formatter={(value) => `${value}%`}
                      parser={(value) => value ? parseFloat(value.replace('%', '')) : 0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 第二部分：预警级别配置 */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-lg font-semibold">预警级别配置</span>
            </div>
          }
          className="shadow-sm"
          extra={
            <Tooltip title="配置不同预警级别的显示样式和通知方式">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          }
        >
          <Form.List name="alertLevels">
            {(fields) => (
              <div className="space-y-6">
                {fields.map(({ key, name, ...restField }) => (
                  <AlertLevelItem
                    key={key}
                    name={name}
                    restField={restField}
                    form={form}
                    getLevelIcon={getLevelIcon}
                  />
                ))}
              </div>
            )}
          </Form.List>
        </Card>

        {/* 第三部分：自动调整参数配置 */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold">自动调整参数配置</span>
            </div>
          }
          className="shadow-sm"
          extra={
            <Tooltip title="配置系统自动调整工艺参数的范围和限制">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          }
        >
          <Row gutter={[24, 24]}>
            {/* 搅拌转速调整范围 */}
            <Col xs={24} md={12}>
              <Form.Item label="搅拌转速调整范围（RPM）" required>
                <div className="flex items-center gap-4">
                  <Form.Item
                    name={['autoAdjust', 'stirringSpeedRange', 0]}
                    noStyle
                    rules={[{ required: true, message: '请输入最小值' }]}
                  >
                    <InputNumber
                      min={50}
                      max={500}
                      placeholder="最小"
                      addonBefore="最小"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <span className="text-gray-400">~</span>
                  <Form.Item
                    name={['autoAdjust', 'stirringSpeedRange', 1]}
                    noStyle
                    rules={[{ required: true, message: '请输入最大值' }]}
                  >
                    <InputNumber
                      min={50}
                      max={500}
                      placeholder="最大"
                      addonBefore="最大"
                      addonAfter="RPM"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 相比调整范围 */}
            <Col xs={24} md={12}>
              <Form.Item label="相比调整范围" required>
                <div className="flex items-center gap-4">
                  <Form.Item
                    name={['autoAdjust', 'phaseRatioRange', 0]}
                    noStyle
                    rules={[{ required: true, message: '请输入最小值' }]}
                  >
                    <InputNumber
                      min={0.1}
                      max={5}
                      step={0.1}
                      placeholder="最小"
                      addonBefore="最小"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <span className="text-gray-400">~</span>
                  <Form.Item
                    name={['autoAdjust', 'phaseRatioRange', 1]}
                    noStyle
                    rules={[{ required: true, message: '请输入最大值' }]}
                  >
                    <InputNumber
                      min={0.1}
                      max={5}
                      step={0.1}
                      placeholder="最大"
                      addonBefore="最大"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            {/* 最大自动调整次数 */}
            <Col xs={24} md={12}>
              <Form.Item
                label="最大自动调整次数"
                name={['autoAdjust', 'maxAdjustTimes']}
                rules={[{ required: true, message: '请输入最大自动调整次数' }]}
                extra="系统在触发预警后尝试自动调整参数的最大次数，超过后将停止自动调整并发出人工干预请求"
              >
                <InputNumber
                  min={1}
                  max={10}
                  step={1}
                  addonAfter="次"
                  style={{ width: 150 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="default"
            size="large"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
          >
            恢复默认值
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<Save className="w-4 h-4" />}
            loading={loading}
          >
            保存配置
          </Button>
        </div>
      </Form>
    </div>
  );
};

/**
 * 预警级别配置项子组件
 * 使用 Form.useWatch 监听颜色和图标变化，实时更新预览
 */
interface AlertLevelItemProps {
  name: number;
  restField: { fieldKey?: number; isListField?: boolean };
  form: FormInstance<AlertThresholds>;
  getLevelIcon: (iconName: string, color: string) => React.ReactNode;
}

const AlertLevelItem: React.FC<AlertLevelItemProps> = ({ name, restField, form, getLevelIcon }) => {
  // 使用 useWatch 监听颜色和图标的变化
  const color = Form.useWatch(['alertLevels', name, 'color'], form);
  const icon = Form.useWatch(['alertLevels', name, 'icon'], form);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <Row gutter={[16, 16]} align="middle">
        {/* 级别图标和名称 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            {...restField}
            label="预警级别"
            name={[name, 'label']}
            rules={[{ required: true, message: '请输入级别名称' }]}
          >
            <Select
              options={[
                { value: '严重', label: '严重' },
                { value: '危险', label: '危险' },
                { value: '警告', label: '警告' }
              ]}
              disabled
              prefix={
                <span className="mr-2">
                  {getLevelIcon(icon || 'AlertCircle', color || '#d97706')}
                </span>
              }
            />
          </Form.Item>
        </Col>

        {/* 级别标识 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            {...restField}
            name={[name, 'level']}
            label="级别标识"
            hidden
          >
            <Input />
          </Form.Item>
        </Col>

        {/* 显示颜色 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            {...restField}
            label="显示颜色"
            name={[name, 'color']}
            rules={[{ required: true, message: '请选择颜色' }]}
          >
            <Select
              options={[
                { value: '#dc2626', label: <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600"></span>红色</span> },
                { value: '#ea580c', label: <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-600"></span>橙色</span> },
                { value: '#d97706', label: <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-600"></span>琥珀色</span> },
                { value: '#059669', label: <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-600"></span>绿色</span> },
                { value: '#2563eb', label: <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span>蓝色</span> }
              ]}
            />
          </Form.Item>
        </Col>

        {/* 图标 */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            {...restField}
            label="图标"
            name={[name, 'icon']}
            rules={[{ required: true, message: '请选择图标' }]}
          >
            <Select
              options={[
                { value: 'AlertOctagon', label: <span className="flex items-center gap-2"><AlertOctagon className="w-4 h-4" />八边形警告</span> },
                { value: 'AlertTriangle', label: <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />三角形警告</span> },
                { value: 'AlertCircle', label: <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />圆形警告</span> }
              ]}
            />
          </Form.Item>
        </Col>

        {/* 通知方式 */}
        <Col xs={24} md={12}>
          <Form.Item
            {...restField}
            label="通知方式"
            name={[name, 'notifyMethods']}
            rules={[{ required: true, message: '请选择至少一种通知方式' }]}
          >
            <Checkbox.Group
              options={notifyMethodOptions}
              className="flex flex-wrap gap-4"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default ThresholdSettings;
