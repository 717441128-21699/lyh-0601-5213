import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Button,
  Steps,
  Card,
  Row,
  Col,
  Space,
  Divider,
  message,
  Typography
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined
} from '@ant-design/icons';
import {
  FlaskConical,
  Box,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import {
  ExtractionSystem,
  MixerSettlerGeometry,
  SimulationParams,
  SimulationStatus,
  ImpellerType,
  ImpellerTypeLabels,
  FeedConcentration
} from '@/types';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 新建模拟任务页面
 * 包含三个配置步骤：萃取体系配置、几何构造配置、模拟参数配置
 */
const NewTask: React.FC = () => {
  const navigate = useNavigate();
  const { addTask, currentUser } = useAppStore();

  // 当前步骤索引
  const [currentStep, setCurrentStep] = useState(0);
  // 表单提交中状态
  const [submitting, setSubmitting] = useState(false);

  // 表单实例
  const [form] = Form.useForm();

  /**
   * 步骤配置
   * 包含步骤标题、描述和对应的图标
   */
  const steps = [
    {
      title: '萃取体系配置',
      description: '设置料液成分、萃取剂配比等参数',
      icon: <FlaskConical size={18} />
    },
    {
      title: '几何构造配置',
      description: '设置混合澄清槽的几何尺寸参数',
      icon: <Box size={18} />
    },
    {
      title: '模拟参数配置',
      description: '设置模拟计算的控制参数',
      icon: <Settings size={18} />
    }
  ];

  /**
   * 常用稀土元素选项
   * 用于料液浓度配置的元素选择
   */
  const rareEarthElements = [
    'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb',
    'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Y', 'Sc'
  ];

  /**
   * 萃取剂类型选项
   * 用于萃取剂配比配置
   */
  const extractantTypes = ['P507', 'P204', 'Cyanex272', 'TBP', 'kerosene', '其他'];

  /**
   * 搅拌桨类型选项
   * 从类型定义中获取并转换为Select选项
   */
  const impellerTypeOptions = Object.entries(ImpellerTypeLabels).map(([value, label]) => ({
    value: value as ImpellerType,
    label
  }));

  /**
   * 处理"下一步"按钮点击
   * 验证当前步骤表单，验证通过后进入下一步
   */
  const handleNext = async () => {
    try {
      // 验证当前步骤的表单字段
      await form.validateFields();
      // 如果不是最后一步，进入下一步
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      // 表单验证失败，显示错误提示
      message.warning('请检查表单填写是否正确');
    }
  };

  /**
   * 处理"上一步"按钮点击
   * 返回上一个步骤
   */
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * 处理表单提交
   * 收集所有步骤数据，创建新的模拟任务
   */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // 验证所有表单字段
      const values = await form.validateFields();

      // 将萃取剂配比从数组形式转换为Record类型
      // 表单中格式为 [{ type: 'P507', value: 1.0 }]
      // 需要转换为 { P507: 1.0 } 格式
      const extractantRatioRecord: Record<string, number> = {};
      (values.extractantRatio as Array<{ type: string; value: number }>).forEach(
        (item) => {
          extractantRatioRecord[item.type] = item.value;
        }
      );

      // 构建萃取体系配置
      const extractionSystem: Omit<ExtractionSystem, 'id'> = {
        name: values.taskName,
        feedConcentrations: values.feedConcentrations as FeedConcentration[],
        extractantRatio: extractantRatioRecord,
        ph: values.ph,
        targetSeparationFactor: values.targetSeparationFactor,
        temperature: values.temperature
      };

      // 构建几何构造配置
      const geometry: MixerSettlerGeometry = {
        mixerLength: values.mixerLength,
        mixerWidth: values.mixerWidth,
        mixerHeight: values.mixerHeight,
        settlerLength: values.settlerLength,
        settlerWidth: values.settlerWidth,
        settlerHeight: values.settlerHeight,
        impellerType: values.impellerType,
        impellerDiameter: values.impellerDiameter,
        stages: values.stages,
        baffleConfig: values.baffleConfig,
        stirringSpeed: values.stirringSpeed,
        phaseRatio: values.phaseRatio
      };

      // 构建模拟参数配置
      const simulationParams: SimulationParams = {
        gridPrecision: values.gridPrecision,
        timeStep: values.timeStep,
        totalTime: values.totalTime,
        convergenceThreshold: values.convergenceThreshold,
        maxIterations: values.maxIterations
      };

      // 构建完整的任务数据
      const taskData = {
        name: values.taskName,
        system: extractionSystem as ExtractionSystem,
        geometry,
        simulationParams,
        status: SimulationStatus.PENDING_VERIFICATION,
        statusHistory: [
          {
            id: `hist-${Date.now()}`,
            status: SimulationStatus.PENDING_VERIFICATION,
            timestamp: new Date().toISOString(),
            details: '任务创建成功，等待参数校验'
          }
        ],
        progress: 0,
        monitoringData: {
          interfacialTension: [],
          distributionRatio: {},
          residenceTimeDistribution: [],
          extractionRate: [],
          separationFactor: [],
          emulsificationIndex: []
        },
        alerts: [],
        adjustmentLog: [],
        approval: {
          stage1: { approved: false },
          stage2: { approved: false },
          pushedToDesign: false
        },
        createdBy: currentUser?.id || 'u001'
      };

      // 调用store的addTask方法创建任务
      addTask(taskData);

      // 显示成功提示
      message.success('模拟任务创建成功！');

      // 延迟跳转到任务列表页
      setTimeout(() => {
        navigate('/tasks');
      }, 1000);

    } catch (error) {
      // 提交失败处理
      console.error('创建任务失败:', error);
      message.error('创建任务失败，请检查表单填写');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 渲染当前步骤的标题和说明
   */
  const renderStepHeader = () => {
    const step = steps[currentStep];
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
            {step.icon}
          </div>
          <div>
            <Title level={4} className="!m-0">
              {step.title}
            </Title>
            <Text type="secondary">{step.description}</Text>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染步骤1：萃取体系配置表单
   */
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* 任务基本信息 */}
      <Card title="基本信息" className="shadow-sm">
        <Form.Item
          name="taskName"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="例如：La/Ce分离模拟-2026-001" maxLength={50} />
        </Form.Item>
        <Form.Item
          name="taskDescription"
          label="任务描述"
        >
          <TextArea rows={3} placeholder="请输入任务描述（选填）" maxLength={200} showCount />
        </Form.Item>
      </Card>

      {/* 料液浓度配置 */}
      <Card
        title="料液浓度配置"
        className="shadow-sm"
        extra={
          <Text type="secondary" className="text-sm">
            支持添加多个稀土元素
          </Text>
        }
      >
        <Form.List
          name="feedConcentrations"
          rules={[
            {
              validator: async (_, concentrations: FeedConcentration[]) => {
                if (!concentrations || concentrations.length === 0) {
                  return Promise.reject(new Error('请至少添加一个稀土元素'));
                }
              }
            }
          ]}
          initialValue={[
            { element: 'La', concentration: 0.15, unit: 'mol/L' },
            { element: 'Ce', concentration: 0.12, unit: 'mol/L' }
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'element']}
                        rules={[{ required: true, message: '请选择元素' }]}
                        className="!mb-0"
                      >
                        <Select placeholder="选择元素">
                          {rareEarthElements.map(element => (
                            <Option key={element} value={element}>
                              {element}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'concentration']}
                        rules={[
                          { required: true, message: '请输入浓度' },
                          { type: 'number', min: 0.001, max: 10, message: '浓度范围 0.001-10 mol/L' }
                        ]}
                        className="!mb-0"
                      >
                        <InputNumber
                          placeholder="浓度值"
                          min={0.001}
                          max={10}
                          step={0.01}
                          precision={4}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit']}
                        initialValue="mol/L"
                        className="!mb-0"
                      >
                        <Select disabled>
                          <Option value="mol/L">mol/L</Option>
                          <Option value="g/L">g/L</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          className="flex items-center justify-center w-full"
                        />
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
              <Form.ErrorList errors={errors} />
              <Button
                type="dashed"
                onClick={() => add({ element: '', concentration: undefined, unit: 'mol/L' })}
                icon={<PlusOutlined />}
                className="w-full mt-3"
              >
                添加稀土元素
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* 萃取剂配比 */}
      <Card title="萃取剂配比" className="shadow-sm">
        <Form.List
          name="extractantRatio"
          rules={[
            {
              validator: async (_, ratioList: Array<{ type: string; value: number }>) => {
                if (!ratioList || ratioList.length === 0) {
                  return Promise.reject(new Error('请至少添加一种萃取剂'));
                }
              }
            }
          ]}
          initialValue={[{ type: 'P507', value: 1.0 }, { type: 'kerosene', value: 3.0 }]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[{ required: true, message: '请选择萃取剂类型' }]}
                        className="!mb-0"
                      >
                        <Select placeholder="选择萃取剂">
                          {extractantTypes.map(type => (
                            <Option key={type} value={type}>
                              {type}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[
                          { required: true, message: '请输入配比' },
                          { type: 'number', min: 0.1, max: 10, message: '配比范围 0.1-10' }
                        ]}
                        className="!mb-0"
                      >
                        <InputNumber
                          placeholder="配比"
                          min={0.1}
                          max={10}
                          step={0.1}
                          precision={2}
                          style={{ width: '100%' }}
                          addonAfter="mol/L"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          className="flex items-center justify-center w-full"
                        />
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
              <Form.ErrorList errors={errors} />
              <Button
                type="dashed"
                onClick={() => add({ type: '', value: undefined })}
                icon={<PlusOutlined />}
                className="w-full mt-3"
              >
                添加萃取剂
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      {/* pH值和温度 */}
      <Card title="环境条件" className="shadow-sm">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="ph"
              label="pH值"
              rules={[
                { required: true, message: '请输入pH值' },
                { type: 'number', min: 0, max: 14, message: 'pH值范围 0-14' }
              ]}
              initialValue={3.5}
            >
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={14}
                  step={0.1}
                  marks={{
                    0: '0', 3: '3', 7: '7', 11: '11', 14: '14'
                  }}
                />
                <InputNumber
                  min={0}
                  max={14}
                  step={0.1}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="请输入pH值"
                />
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="temperature"
              label="温度 (°C)"
              rules={[
                { required: true, message: '请输入温度' },
                { type: 'number', min: 0, max: 100, message: '温度范围 0-100°C' }
              ]}
              initialValue={25}
            >
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  marks={{
                    0: '0°C', 25: '25°C', 50: '50°C', 75: '75°C', 100: '100°C'
                  }}
                />
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="请输入温度"
                  addonAfter="°C"
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="targetSeparationFactor"
          label="目标分离因子"
          rules={[
            { required: true, message: '请输入目标分离因子' },
            { type: 'number', min: 1.0, max: 10.0, message: '分离因子范围 1.0-10.0' }
          ]}
          initialValue={2.5}
        >
          <InputNumber
            min={1.0}
            max={10.0}
            step={0.1}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入目标分离因子"
          />
        </Form.Item>
      </Card>
    </div>
  );

  /**
   * 渲染步骤2：几何构造配置表单
   */
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* 基本级数配置 */}
      <Card title="级数配置" className="shadow-sm">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="stages"
              label="萃取级数"
              rules={[
                { required: true, message: '请输入萃取级数' },
                { type: 'number', min: 1, max: 100, message: '级数范围 1-100' }
              ]}
              initialValue={10}
            >
              <InputNumber
                min={1}
                max={100}
                step={1}
                style={{ width: '100%' }}
                placeholder="请输入级数"
                addonAfter="级"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="baffleConfig"
              label="挡板配置"
              initialValue="标准4挡板"
            >
              <Select>
                <Option value="无挡板">无挡板</Option>
                <Option value="标准4挡板">标准4挡板</Option>
                <Option value="6挡板">6挡板</Option>
                <Option value="指形挡板">指形挡板</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 混合室尺寸 */}
      <Card title="混合室尺寸 (m)" className="shadow-sm">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="mixerLength"
              label="长度"
              rules={[
                { required: true, message: '请输入混合室长度' },
                { type: 'number', min: 0.5, max: 10.0, message: '长度范围 0.5-10.0 m' }
              ]}
              initialValue={2.0}
            >
              <InputNumber
                min={0.5}
                max={10.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="长度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="mixerWidth"
              label="宽度"
              rules={[
                { required: true, message: '请输入混合室宽度' },
                { type: 'number', min: 0.5, max: 10.0, message: '宽度范围 0.5-10.0 m' }
              ]}
              initialValue={1.5}
            >
              <InputNumber
                min={0.5}
                max={10.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="宽度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="mixerHeight"
              label="高度"
              rules={[
                { required: true, message: '请输入混合室高度' },
                { type: 'number', min: 0.5, max: 10.0, message: '高度范围 0.5-10.0 m' }
              ]}
              initialValue={1.8}
            >
              <InputNumber
                min={0.5}
                max={10.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="高度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 澄清室尺寸 */}
      <Card title="澄清室尺寸 (m)" className="shadow-sm">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="settlerLength"
              label="长度"
              rules={[
                { required: true, message: '请输入澄清室长度' },
                { type: 'number', min: 1.0, max: 20.0, message: '长度范围 1.0-20.0 m' }
              ]}
              initialValue={5.0}
            >
              <InputNumber
                min={1.0}
                max={20.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="长度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="settlerWidth"
              label="宽度"
              rules={[
                { required: true, message: '请输入澄清室宽度' },
                { type: 'number', min: 1.0, max: 10.0, message: '宽度范围 1.0-10.0 m' }
              ]}
              initialValue={2.0}
            >
              <InputNumber
                min={1.0}
                max={10.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="宽度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="settlerHeight"
              label="高度"
              rules={[
                { required: true, message: '请输入澄清室高度' },
                { type: 'number', min: 0.5, max: 10.0, message: '高度范围 0.5-10.0 m' }
              ]}
              initialValue={1.5}
            >
              <InputNumber
                min={0.5}
                max={10.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="高度"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 搅拌桨配置 */}
      <Card title="搅拌桨配置" className="shadow-sm">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="impellerType"
              label="搅拌桨类型"
              rules={[{ required: true, message: '请选择搅拌桨类型' }]}
              initialValue={ImpellerType.TURBINE}
            >
              <Select placeholder="请选择搅拌桨类型">
                {impellerTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="impellerDiameter"
              label="搅拌桨直径 (m)"
              rules={[
                { required: true, message: '请输入搅拌桨直径' },
                { type: 'number', min: 0.1, max: 5.0, message: '直径范围 0.1-5.0 m' }
              ]}
              initialValue={0.6}
            >
              <InputNumber
                min={0.1}
                max={5.0}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="直径"
                addonAfter="m"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="my-4" />

        {/* 溢流堰高度 */}
        <Form.Item
          name="overflowWeirHeight"
          label="溢流堰高度 (m)"
          rules={[
            { required: true, message: '请输入溢流堰高度' },
            { type: 'number', min: 0.1, max: 3.0, message: '高度范围 0.1-3.0 m' }
          ]}
          initialValue={0.8}
        >
          <div className="space-y-2">
            <Slider
              min={0.1}
              max={3.0}
              step={0.1}
              marks={{
                0.1: '0.1m', 1.0: '1.0m', 2.0: '2.0m', 3.0: '3.0m'
              }}
            />
            <InputNumber
              min={0.1}
              max={3.0}
              step={0.1}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入溢流堰高度"
              addonAfter="m"
            />
          </div>
        </Form.Item>
      </Card>
    </div>
  );

  /**
   * 渲染步骤3：模拟参数配置表单
   */
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* 工艺参数 */}
      <Card title="工艺参数" className="shadow-sm">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="stirringSpeed"
              label="搅拌转速"
              rules={[
                { required: true, message: '请输入搅拌转速' },
                { type: 'number', min: 50, max: 500, message: '转速范围 50-500 rpm' }
              ]}
              initialValue={180}
            >
              <div className="space-y-2">
                <Slider
                  min={50}
                  max={500}
                  step={10}
                  marks={{
                    50: '50', 150: '150', 300: '300', 500: '500'
                  }}
                />
                <InputNumber
                  min={50}
                  max={500}
                  step={10}
                  style={{ width: '100%' }}
                  placeholder="请输入搅拌转速"
                  addonAfter="rpm"
                />
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phaseRatio"
              label="相比 (O/A)"
              rules={[
                { required: true, message: '请输入相比' },
                { type: 'number', min: 0.1, max: 10.0, message: '相比范围 0.1-10.0' }
              ]}
              initialValue={1.0}
            >
              <div className="space-y-2">
                <Slider
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  marks={{
                    0.1: '0.1', 1: '1', 5: '5', 10: '10'
                  }}
                />
                <InputNumber
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入相比"
                />
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="targetExtractionRate"
          label="目标萃取率"
          rules={[
            { required: true, message: '请输入目标萃取率' },
            { type: 'number', min: 0, max: 100, message: '萃取率范围 0-100%' }
          ]}
          initialValue={85}
        >
          <div className="space-y-2">
            <Slider
              min={0}
              max={100}
              step={1}
              marks={{
                0: '0%', 50: '50%', 85: '85%', 100: '100%'
              }}
            />
            <InputNumber
              min={0}
              max={100}
              step={1}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入目标萃取率"
              addonAfter="%"
            />
          </div>
        </Form.Item>
      </Card>

      {/* 模拟控制参数 */}
      <Card title="模拟控制参数" className="shadow-sm">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="totalTime"
              label="模拟时长 (s)"
              rules={[
                { required: true, message: '请输入模拟时长' },
                { type: 'number', min: 1, max: 10000, message: '时长范围 1-10000 s' }
              ]}
              initialValue={100}
            >
              <InputNumber
                min={1}
                max={10000}
                step={10}
                style={{ width: '100%' }}
                placeholder="请输入模拟时长"
                addonAfter="s"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="timeStep"
              label="时间步长 (s)"
              rules={[
                { required: true, message: '请输入时间步长' },
                { type: 'number', min: 0.001, max: 1.0, message: '步长范围 0.001-1.0 s' }
              ]}
              initialValue={0.01}
            >
              <Select>
                <Option value={0.001}>0.001 s</Option>
                <Option value={0.005}>0.005 s</Option>
                <Option value={0.01}>0.01 s</Option>
                <Option value={0.05}>0.05 s</Option>
                <Option value={0.1}>0.1 s</Option>
                <Option value={0.5}>0.5 s</Option>
                <Option value={1.0}>1.0 s</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="gridPrecision"
              label="网格精度"
              rules={[{ required: true, message: '请选择网格精度' }]}
              initialValue="medium"
            >
              <Select>
                <Option value="coarse">粗糙 (快速计算)</Option>
                <Option value="medium">中等 (平衡)</Option>
                <Option value="fine">精细 (高精度)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="maxIterations"
              label="最大迭代次数"
              rules={[
                { required: true, message: '请输入最大迭代次数' },
                { type: 'number', min: 10, max: 10000, message: '范围 10-10000' }
              ]}
              initialValue={100}
            >
              <InputNumber
                min={10}
                max={10000}
                step={10}
                style={{ width: '100%' }}
                placeholder="请输入最大迭代次数"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="convergenceThreshold"
          label="收敛阈值"
          rules={[
            { required: true, message: '请输入收敛阈值' },
            { type: 'number', min: 1e-8, max: 1e-3, message: '范围 1e-8 ~ 1e-3' }
          ]}
          initialValue={1e-6}
        >
          <Select>
            <Option value={1e-3}>1e-3 (宽松)</Option>
            <Option value={1e-4}>1e-4</Option>
            <Option value={1e-5}>1e-5</Option>
            <Option value={1e-6}>1e-6 (推荐)</Option>
            <Option value={1e-7}>1e-7</Option>
            <Option value={1e-8}>1e-8 (严格)</Option>
          </Select>
        </Form.Item>
      </Card>

      {/* 配置摘要 */}
      <Card title="配置摘要" className="shadow-sm">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <Text type="secondary">任务名称：</Text>
            <Text strong>{form.getFieldValue('taskName') || '-'}</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">稀土元素：</Text>
            <Text strong>
              {(form.getFieldValue('feedConcentrations') || [])
                .map((fc: FeedConcentration) => fc.element)
                .join(', ') || '-'}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">萃取级数：</Text>
            <Text strong>{form.getFieldValue('stages') || '-'} 级</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">搅拌转速：</Text>
            <Text strong>{form.getFieldValue('stirringSpeed') || '-'} rpm</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">相比：</Text>
            <Text strong>{form.getFieldValue('phaseRatio') || '-'}</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">模拟时长：</Text>
            <Text strong>{form.getFieldValue('totalTime') || '-'} s</Text>
          </div>
        </div>
      </Card>
    </div>
  );

  /**
   * 渲染当前步骤的表单内容
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      default:
        return null;
    }
  };

  /**
   * 渲染底部按钮区域
   */
  const renderFooter = () => (
    <div className="flex justify-between items-center pt-6 border-t border-gray-100">
      <Button
        onClick={handlePrev}
        disabled={currentStep === 0 || submitting}
        icon={<ArrowLeftOutlined />}
      >
        上一步
      </Button>
      <Space>
        <Button
          onClick={() => navigate('/tasks')}
          disabled={submitting}
        >
          取消
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            type="primary"
            onClick={handleNext}
            disabled={submitting}
            icon={<ArrowRightOutlined />}
          >
            下一步
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            icon={<CheckOutlined />}
          >
            提交并创建任务
          </Button>
        )}
      </Space>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* 页面标题 */}
      <div className="mb-8">
        <Title level={3} className="!m-0 !mb-2">
          创建新模拟任务
        </Title>
        <Text type="secondary">
          按照以下三个步骤完成模拟任务的配置
        </Text>
      </div>

      {/* 步骤导航 */}
      <Steps current={currentStep} className="mb-8">
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>

      {/* 表单内容区域 */}
      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            feedConcentrations: [
              { element: 'La', concentration: 0.15, unit: 'mol/L' },
              { element: 'Ce', concentration: 0.12, unit: 'mol/L' }
            ],
            extractantRatio: [
              { type: 'P507', value: 1.0 },
              { type: 'kerosene', value: 3.0 }
            ]
          }}
        >
          {/* 当前步骤标题和说明 */}
          {renderStepHeader()}

          {/* 当前步骤表单内容 */}
          {renderCurrentStep()}

          {/* 底部按钮 */}
          {renderFooter()}
        </Form>
      </Card>
    </div>
  );
};

export default NewTask;
