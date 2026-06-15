import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  message,
  Divider,
  Row,
  Col,
  Descriptions,
  Progress,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  NotificationOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import {
  SystemConfig,
  GridPrecision,
  GridPrecisionLabels,
  ExportFormat,
  ExportFormatLabels,
  SmsProvider,
  SmsProviderLabels
} from '@/types';

/**
 * 系统配置页面
 * 包含模拟引擎配置、通知配置、数据导出配置、系统信息四大部分
 */
const SystemSettings: React.FC = () => {
  // 从 store 获取系统配置和更新方法
  const { systemConfig, updateSystemConfig } = useAppStore();
  
  // 表单实例
  const [form] = Form.useForm<SystemConfig>();
  
  // 操作按钮加载状态
  const [saveLoading, setSaveLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  /**
   * 保存配置
   */
  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const values = await form.validateFields();
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 更新 store 中的配置
      updateSystemConfig(values);
      
      message.success('系统配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败，请检查表单填写是否正确');
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * 手动备份数据库
   */
  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.success('数据库备份成功，备份文件已保存至服务器');
    } catch (error) {
      console.error('备份数据库失败:', error);
      message.error('备份数据库失败，请稍后重试');
    } finally {
      setBackupLoading(false);
    }
  };

  /**
   * 清理缓存
   */
  const handleCleanCache = async () => {
    try {
      setCacheLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('缓存清理成功，共清理 256MB 临时文件');
    } catch (error) {
      console.error('清理缓存失败:', error);
      message.error('清理缓存失败，请稍后重试');
    } finally {
      setCacheLoading(false);
    }
  };

  /**
   * 系统诊断
   */
  const handleDiagnosis = async () => {
    try {
      setDiagnosisLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('系统诊断完成，所有组件运行正常');
    } catch (error) {
      console.error('系统诊断失败:', error);
      message.error('系统诊断失败，请稍后重试');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  /**
   * 解析存储使用情况，获取百分比
   */
  const getStoragePercentage = (usage: string): number => {
    const match = usage.match(/([\d.]+)\s*GB\s*\/\s*([\d.]+)\s*GB/);
    if (match) {
      const used = parseFloat(match[1]);
      const total = parseFloat(match[2]);
      return Math.round((used / total) * 100);
    }
    return 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingOutlined className="text-3xl text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">系统配置</h1>
            <p className="text-gray-500 mt-1">管理系统运行参数、通知设置和数据导出配置</p>
          </div>
        </div>
      </div>

      {/* 表单主体 */}
      <Form
        form={form}
        layout="vertical"
        initialValues={systemConfig}
        className="space-y-6"
      >
        {/* 第一行：模拟引擎配置 + 通知配置 */}
        <Row gutter={[24, 24]}>
          {/* 模拟引擎配置卡片 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ExperimentOutlined className="text-primary-600" />
                  <span className="font-semibold">模拟引擎配置</span>
                </div>
              }
              className="h-full"
              extra={
                <Tooltip title="调整引擎参数会影响模拟计算精度和速度">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              }
            >
              <div className="space-y-4">
                {/* 默认网格精度 */}
                <Form.Item
                  name={['simulationEngine', 'defaultGridPrecision']}
                  label="默认网格精度"
                  rules={[{ required: true, message: '请选择网格精度' }]}
                >
                  <Select
                    placeholder="请选择默认网格精度"
                    options={Object.entries(GridPrecisionLabels).map(([value, label]) => ({
                      value: value as GridPrecision,
                      label
                    }))}
                  />
                </Form.Item>

                {/* 最大并行任务数 */}
                <Form.Item
                  name={['simulationEngine', 'maxParallelTasks']}
                  label="最大并行任务数"
                  rules={[
                    { required: true, message: '请输入最大并行任务数' },
                    { type: 'number', min: 1, max: 10, message: '范围：1-10' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    className="w-full"
                    placeholder="请输入最大并行任务数"
                    addonAfter="个"
                  />
                </Form.Item>

                {/* 单个任务最大计算时长 */}
                <Form.Item
                  name={['simulationEngine', 'maxTaskDuration']}
                  label="单个任务最大计算时长"
                  rules={[
                    { required: true, message: '请输入最大计算时长' },
                    { type: 'number', min: 1, message: '至少1小时' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    className="w-full"
                    placeholder="请输入最大计算时长"
                    addonAfter="小时"
                  />
                </Form.Item>

                {/* 结果数据保留天数 */}
                <Form.Item
                  name={['simulationEngine', 'dataRetentionDays']}
                  label="结果数据保留天数"
                  rules={[
                    { required: true, message: '请输入数据保留天数' },
                    { type: 'number', min: 1, message: '至少保留1天' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    className="w-full"
                    placeholder="请输入数据保留天数"
                    addonAfter="天"
                  />
                </Form.Item>

                {/* 自动清理过期数据 */}
                <Form.Item
                  name={['simulationEngine', 'autoCleanExpiredData']}
                  label="自动清理过期数据"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
            </Card>
          </Col>

          {/* 通知配置卡片 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <NotificationOutlined className="text-accent-orange" />
                  <span className="font-semibold">通知配置</span>
                </div>
              }
              className="h-full"
              extra={
                <Tooltip title="配置邮件和短信通知服务">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              }
            >
              <div className="space-y-4">
                {/* SMTP 邮件配置 */}
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">SMTP 邮件配置</h4>
                  <Row gutter={12}>
                    <Col span={16}>
                      <Form.Item
                        name={['notification', 'smtp', 'host']}
                        label="SMTP服务器地址"
                        rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
                      >
                        <Input placeholder="例如: smtp.example.com" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['notification', 'smtp', 'port']}
                        label="端口"
                        rules={[{ required: true, message: '请输入端口号' }]}
                      >
                        <InputNumber min={1} max={65535} className="w-full" placeholder="465" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name={['notification', 'smtp', 'username']}
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                      >
                        <Input placeholder="邮箱账号" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['notification', 'smtp', 'password']}
                        label="密码"
                        rules={[{ required: true, message: '请输入密码' }]}
                      >
                        <Input.Password
                          placeholder="请输入密码"
                          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name={['notification', 'smtp', 'sender']}
                    label="发件人"
                    rules={[{ required: true, message: '请输入发件人名称' }]}
                  >
                    <Input placeholder="例如: 系统通知 <notify@example.com>" />
                  </Form.Item>
                </div>

                <Divider className="my-4" />

                {/* 短信 API 配置 */}
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">短信 API 配置</h4>
                  <Form.Item
                    name={['notification', 'sms', 'provider']}
                    label="短信服务商"
                    rules={[{ required: true, message: '请选择短信服务商' }]}
                  >
                    <Select
                      placeholder="请选择短信服务商"
                      options={Object.entries(SmsProviderLabels).map(([value, label]) => ({
                        value: value as SmsProvider,
                        label
                      }))}
                    />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name={['notification', 'sms', 'apiKey']}
                        label="API Key"
                        rules={[{ required: true, message: '请输入API Key' }]}
                      >
                        <Input placeholder="请输入API Key" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['notification', 'sms', 'apiSecret']}
                        label="API Secret"
                        rules={[{ required: true, message: '请输入API Secret' }]}
                      >
                        <Input.Password
                          placeholder="请输入API Secret"
                          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <Divider className="my-4" />

                {/* 通知模板配置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">通知模板配置</h4>
                  <Form.Item
                    name={['notification', 'templates', 'alert']}
                    label="预警通知模板"
                    rules={[{ required: true, message: '请输入预警通知模板' }]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="支持变量: {taskName}, {alertType}"
                    />
                  </Form.Item>
                  <Form.Item
                    name={['notification', 'templates', 'approval']}
                    label="审批通知模板"
                    rules={[{ required: true, message: '请输入审批通知模板' }]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="支持变量: {taskName}"
                    />
                  </Form.Item>
                  <Form.Item
                    name={['notification', 'templates', 'completion']}
                    label="完成通知模板"
                    rules={[{ required: true, message: '请输入完成通知模板' }]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="支持变量: {taskName}"
                    />
                  </Form.Item>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 第二行：数据导出配置 + 系统信息 */}
        <Row gutter={[24, 24]}>
          {/* 数据导出配置卡片 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ExportOutlined className="text-green-600" />
                  <span className="font-semibold">数据导出配置</span>
                </div>
              }
              className="h-full"
              extra={
                <Tooltip title="配置数据导出格式和PDF报告模板">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              }
            >
              <div className="space-y-4">
                {/* 默认导出格式 */}
                <Form.Item
                  name={['dataExport', 'defaultFormat']}
                  label="默认导出格式"
                  rules={[{ required: true, message: '请选择默认导出格式' }]}
                >
                  <Select
                    placeholder="请选择默认导出格式"
                    options={Object.entries(ExportFormatLabels).map(([value, label]) => ({
                      value: value as ExportFormat,
                      label
                    }))}
                  />
                </Form.Item>

                <Divider className="my-4" />

                {/* PDF 报告模板配置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">PDF 报告模板配置</h4>
                  <Form.Item
                    name={['dataExport', 'pdfTemplate', 'companyName']}
                    label="公司名称"
                    rules={[{ required: true, message: '请输入公司名称' }]}
                  >
                    <Input placeholder="请输入公司名称" />
                  </Form.Item>
                  <Form.Item
                    name={['dataExport', 'pdfTemplate', 'logo']}
                    label="Logo URL"
                  >
                    <Input placeholder="请输入Logo图片URL" />
                  </Form.Item>
                  <Form.Item
                    name={['dataExport', 'pdfTemplate', 'footer']}
                    label="页脚文字"
                    rules={[{ required: true, message: '请输入页脚文字' }]}
                  >
                    <Input
                      placeholder="支持变量: {page}, {total}"
                    />
                  </Form.Item>
                </div>

                <Divider className="my-4" />

                {/* 数据导出权限控制 */}
                <Form.Item
                  name={['dataExport', 'enablePermissionControl']}
                  label="数据导出权限控制"
                  valuePropName="checked"
                  extra="开启后，只有具有导出权限的用户才能导出数据"
                >
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
            </Card>
          </Col>

          {/* 系统信息卡片 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <InfoCircleOutlined className="text-blue-600" />
                  <span className="font-semibold">系统信息</span>
                </div>
              }
              className="h-full"
              extra={
                <Button type="link" size="small" onClick={handleDiagnosis} loading={diagnosisLoading}>
                  系统诊断
                </Button>
              }
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="系统版本">
                  <span className="font-mono">{systemConfig.systemInfo.version}</span>
                </Descriptions.Item>
                <Descriptions.Item label="数据库大小">
                  <span className="font-mono">{systemConfig.systemInfo.databaseSize}</span>
                </Descriptions.Item>
                <Descriptions.Item label="存储使用情况">
                  <div className="space-y-1">
                    <span className="font-mono">{systemConfig.systemInfo.storageUsage}</span>
                    <Progress
                      percent={getStoragePercentage(systemConfig.systemInfo.storageUsage)}
                      size="small"
                      status={getStoragePercentage(systemConfig.systemInfo.storageUsage) > 80 ? 'exception' : 'active'}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="最后备份时间">
                  {systemConfig.systemInfo.lastBackupTime}
                </Descriptions.Item>
                <Descriptions.Item label="系统运行时间">
                  <span className="text-green-600 font-medium">
                    {systemConfig.systemInfo.uptime}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* 操作按钮区域 */}
        <Card className="shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              修改配置后请点击保存按钮以生效
            </div>
            <Space wrap>
              <Button
                icon={<ExperimentOutlined />}
                onClick={handleDiagnosis}
                loading={diagnosisLoading}
              >
                系统诊断
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={handleCleanCache}
                loading={cacheLoading}
              >
                清理缓存
              </Button>
              <Button
                icon={<DatabaseOutlined />}
                onClick={handleBackup}
                loading={backupLoading}
              >
                手动备份数据库
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saveLoading}
                size="large"
              >
                保存配置
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default SystemSettings;
