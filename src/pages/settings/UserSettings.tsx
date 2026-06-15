import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Avatar
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  ExperimentOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  EyeOutlined,
  ToolOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { User, UserRole } from '@/types';
import { UserRoleLabels, UserRole as UserRoleEnum } from '@/types';
import { useAppStore } from '@/store';
import { RoleBadge } from '@/components/common/StatusBadge';
import { formatDateTime, getUserRoleLabel } from '@/utils';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 角色权限说明配置
 * 定义6种角色及其对应的权限说明和图标
 */
const roleDescriptions = [
  {
    role: UserRoleEnum.ENGINEER,
    icon: <ExperimentOutlined />,
    color: 'blue',
    title: '湿法冶金工程师',
    description: '负责湿法冶金工艺参数设置、仿真任务创建与执行，查看仿真结果和分析报告。'
  },
  {
    role: UserRoleEnum.PROCESS_ENGINEER,
    icon: <SettingOutlined />,
    color: 'green',
    title: '工艺工程师',
    description: '负责工艺流程优化、参数调整建议，可审批仿真方案，查看历史数据对比分析。'
  },
  {
    role: UserRoleEnum.CHIEF_ENGINEER,
    icon: <SafetyCertificateOutlined />,
    color: 'orange',
    title: '总工程师',
    description: '负责重大技术决策审批，查看全局统计数据，主持技术方案评审和优化方向。'
  },
  {
    role: UserRoleEnum.CHIEF_SCIENTIST,
    icon: <UserSwitchOutlined />,
    color: 'red',
    title: '首席科学家',
    description: '负责技术路线规划、模型算法评审，查看深度分析报告，指导研发方向。'
  },
  {
    role: UserRoleEnum.DESIGN_TEAM,
    icon: <EyeOutlined />,
    color: 'gold',
    title: '萃箱设计组',
    description: '负责萃取设备结构设计，查看仿真结果中的流场分布数据，优化设备结构参数。'
  },
  {
    role: UserRoleEnum.ADMIN,
    icon: <ToolOutlined />,
    color: 'purple',
    title: '系统管理员',
    description: '负责用户管理、权限分配、系统配置、数据备份等系统级管理操作。'
  }
];

/**
 * 表单字段类型定义
 * 用于添加/编辑用户的表单数据
 */
interface UserFormData {
  username: string;
  realName: string;
  role: UserRole;
  email: string;
  password?: string;
  phone: string;
  department: string;
}

/**
 * 用户管理页面
 * 提供用户列表展示、搜索筛选、添加/编辑/删除/禁用用户等功能
 * 仅管理员角色可访问
 */
const UserSettings: React.FC = () => {
  // 从状态管理获取用户数据和操作方法
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useAppStore();

  // 搜索关键词
  const [searchText, setSearchText] = useState<string>('');
  // 角色筛选
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  // 模态框显示状态
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // 当前编辑的用户（为空表示添加新用户）
  const [editingUser, setEditingUser] = useState<User | null>(null);
  // 表单实例
  const [form] = Form.useForm<UserFormData>();
  // 分页状态
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  /**
   * 权限检查：仅管理员可访问
   * 非管理员用户显示无权限提示
   */
  const isAdmin = currentUser?.role === UserRoleEnum.ADMIN;

  /**
   * 过滤后的用户列表
   * 根据搜索关键词和角色筛选条件过滤用户
   */
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 搜索匹配：用户名、真实姓名、邮箱、部门、手机号
      const matchesSearch = !searchText ||
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.realName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.department.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText);

      // 角色匹配
      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchText, roleFilter]);

  /**
   * 打开添加用户模态框
   */
  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 打开编辑用户模态框
   * @param user - 要编辑的用户数据
   */
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      realName: user.realName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      department: user.department
    });
    setModalVisible(true);
  };

  /**
   * 提交用户表单
   * 根据editingUser是否存在判断是添加还是更新
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        // 更新用户
        updateUser(editingUser.id, {
          username: values.username,
          realName: values.realName,
          role: values.role,
          email: values.email,
          phone: values.phone,
          department: values.department
        });
        message.success('用户信息更新成功');
      } else {
        // 添加新用户
        addUser({
          username: values.username,
          realName: values.realName,
          role: values.role,
          email: values.email,
          phone: values.phone,
          department: values.department,
          status: 'active'
        });
        message.success('用户添加成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 删除用户
   * @param userId - 要删除的用户ID
   */
  const handleDeleteUser = (userId: string) => {
    // 禁止删除当前登录用户
    if (userId === currentUser?.id) {
      message.error('不能删除当前登录用户');
      return;
    }

    deleteUser(userId);
    message.success('用户删除成功');

    // 删除后如果当前页没有数据，跳转到上一页
    if ((pagination.current - 1) * pagination.pageSize >= filteredUsers.length - 1 && pagination.current > 1) {
      setPagination(prev => ({ ...prev, current: prev.current - 1 }));
    }
  };

  /**
   * 切换用户状态（启用/禁用）
   * @param user - 要操作的用户
   */
  const handleToggleStatus = (user: User) => {
    // 禁止禁用当前登录用户
    if (user.id === currentUser?.id) {
      message.error('不能禁用当前登录用户');
      return;
    }

    toggleUserStatus(user.id);
    message.success(user.status === 'active' ? '用户已禁用' : '用户已启用');
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string, record: User) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole) => <RoleBadge role={role} size="md" />
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: 'active' | 'inactive') => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record: User) => (
        <Space size="small">
          {/* 编辑按钮 */}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>

          {/* 禁用/启用按钮 */}
          <Popconfirm
            title={record.status === 'active' ? '确认禁用该用户？' : '确认启用该用户？'}
            description={
              record.status === 'active'
                ? '禁用后该用户将无法登录系统'
                : '启用后该用户可正常登录系统'
            }
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleToggleStatus(record)}
          >
            <Button
              type="link"
              size="small"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              danger={record.status === 'active'}
            >
              {record.status === 'active' ? '禁用' : '启用'}
            </Button>
          </Popconfirm>

          {/* 删除按钮 */}
          <Popconfirm
            title="确认删除该用户？"
            description="删除后数据将无法恢复，请谨慎操作"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  /**
   * 无权限时的渲染内容
   */
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4 text-gray-300">
          <LockOutlined />
        </div>
        <Title level={4} className="text-gray-500">
          无访问权限
        </Title>
        <Text type="secondary">
          仅系统管理员可访问用户管理页面
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-1 !text-gray-800">
            用户管理
          </Title>
          <Text type="secondary" className="text-sm">
            管理系统用户账号、角色权限及状态
          </Text>
        </div>
      </div>

      {/* 顶部操作栏 */}
      <Card className="shadow-sm border-gray-100 !p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* 搜索框 */}
            <Input
              placeholder="搜索用户名、姓名、邮箱、部门..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              className="w-72"
              allowClear
            />

            {/* 角色筛选 */}
            <Select
              placeholder="按角色筛选"
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              className="w-40"
              allowClear
            >
              {Object.entries(UserRoleLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </div>

          {/* 添加用户按钮 */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            添加用户
          </Button>
        </div>
      </Card>

      {/* 用户列表表格 */}
      <Card className="shadow-sm border-gray-100">
        <Table<User>
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{
            ...pagination,
            total: filteredUsers.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 角色说明卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span>角色权限说明</span>
          </div>
        }
        className="shadow-sm border-gray-100"
      >
        <Row gutter={[16, 16]}>
          {roleDescriptions.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.role}>
              <Card
                size="small"
                className="h-full hover:shadow-md transition-shadow border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl text-${item.color}-500`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      {item.title}
                    </div>
                    <Text type="secondary" className="text-xs leading-relaxed">
                      {item.description}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                ]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[
                  { required: true, message: '请输入真实姓名' },
                  { min: 2, max: 20, message: '姓名长度为2-20个字符' }
                ]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {Object.entries(UserRoleLabels).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {!editingUser && (
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="初始密码"
                  rules={[
                    { required: true, message: '请输入初始密码' },
                    { min: 6, max: 20, message: '密码长度为6-20个字符' }
                  ]}
                >
                  <Input.Password placeholder="请输入初始密码" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="department"
            label="部门"
            rules={[
              { required: true, message: '请输入部门' },
              { min: 2, max: 50, message: '部门名称长度为2-50个字符' }
            ]}
          >
            <Input placeholder="请输入部门名称，如：湿法冶金部" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserSettings;
