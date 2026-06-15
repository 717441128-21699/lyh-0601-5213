import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tooltip,
  Modal,
  Progress,
  Dropdown,
  message
} from 'antd';
import type { TableProps, SelectProps, DatePickerProps } from 'antd';
import {
  PlusCircle,
  Search,
  Play,
  Pause,
  XCircle,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
  Filter,
  RefreshCw
} from 'lucide-react';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/common/StatusBadge';
import Empty from '@/components/Empty';
import {
  formatDateTime,
  formatNumber,
  getStatusLabel,
  exportToCSV,
  exportToJSON
} from '@/utils';
import {
  SimulationTask,
  SimulationStatus,
  ExtractionSystem
} from '@/types';

const { RangePicker } = DatePicker;

/**
 * 模拟任务列表页面
 * 功能：任务列表展示、筛选、排序、分页、批量操作、单个任务操作
 */
const TaskList: React.FC = () => {
  const navigate = useNavigate();
  
  // 从 store 获取数据和方法
  const {
    tasks,
    extractionSystems,
    updateTaskStatus,
    deleteTask,
    refreshStatistics
  } = useAppStore();

  // 搜索关键词
  const [searchText, setSearchText] = useState('');
  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<SimulationStatus | null>(null);
  // 时间范围筛选
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  // 萃取体系筛选
  const [systemFilter, setSystemFilter] = useState<string | null>(null);
  // 分页
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  // 排序
  const [sorter, setSorter] = useState<TableProps<SimulationTask>['onChange']>();
  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 确认对话框
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  }>({ visible: false, title: '', content: '', onConfirm: () => {} });

  /**
   * 过滤后的任务列表
   */
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // 搜索过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(lowerSearch) ||
          task.system.name.toLowerCase().includes(lowerSearch)
      );
    }

    // 状态过滤
    if (statusFilter) {
      result = result.filter((task) => task.status === statusFilter);
    }

    // 时间范围过滤
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      result = result.filter((task) => {
        const createdAt = dayjs(task.createdAt);
        return createdAt.isAfter(start) && createdAt.isBefore(end);
      });
    }

    // 萃取体系过滤
    if (systemFilter) {
      result = result.filter((task) => task.system.id === systemFilter);
    }

    return result;
  }, [tasks, searchText, statusFilter, dateRange, systemFilter]);

  /**
   * 状态筛选选项
   */
  const statusOptions: SelectProps['options'] = useMemo(
    () =>
      Object.values(SimulationStatus).map((status) => ({
        label: getStatusLabel(status),
        value: status
      })),
    []
  );

  /**
   * 萃取体系筛选选项
   */
  const systemOptions: SelectProps['options'] = useMemo(
    () =>
      extractionSystems.map((system) => ({
        label: system.name,
        value: system.id
      })),
    [extractionSystems]
  );

  /**
   * 判断任务是否可以启动
   */
  const canStart = (task: SimulationTask): boolean => {
    return (
      task.status === SimulationStatus.PAUSED ||
      task.status === SimulationStatus.PENDING_VERIFICATION
    );
  };

  /**
   * 判断任务是否可以暂停
   */
  const canPause = (task: SimulationTask): boolean => {
    return (
      task.status === SimulationStatus.MESHING ||
      task.status === SimulationStatus.TWO_PHASE_FLOW ||
      task.status === SimulationStatus.MASS_TRANSFER ||
      task.status === SimulationStatus.EFFICIENCY_EVALUATION
    );
  };

  /**
   * 判断任务是否可以取消
   */
  const canCancel = (task: SimulationTask): boolean => {
    return (
      task.status !== SimulationStatus.COMPLETED &&
      task.status !== SimulationStatus.CANCELLED &&
      task.status !== SimulationStatus.ABNORMAL_ROLLBACK
    );
  };

  /**
   * 处理任务行点击，跳转到详情页
   */
  const handleRowClick = (task: SimulationTask) => {
    navigate(`/tasks/${task.id}`);
  };

  /**
   * 处理启动任务
   */
  const handleStart = (task: SimulationTask) => {
    updateTaskStatus(task.id, SimulationStatus.MESHING, '用户手动启动任务');
    message.success(`任务「${task.name}」已启动`);
    refreshStatistics();
  };

  /**
   * 处理暂停任务
   */
  const handlePause = (task: SimulationTask) => {
    updateTaskStatus(task.id, SimulationStatus.PAUSED, '用户手动暂停任务');
    message.success(`任务「${task.name}」已暂停`);
    refreshStatistics();
  };

  /**
   * 处理取消任务
   */
  const handleCancel = (task: SimulationTask) => {
    setConfirmModal({
      visible: true,
      title: '确认取消任务',
      content: `确定要取消任务「${task.name}」吗？此操作不可恢复。`,
      onConfirm: () => {
        updateTaskStatus(task.id, SimulationStatus.CANCELLED, '用户手动取消任务');
        message.success(`任务「${task.name}」已取消`);
        refreshStatistics();
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  /**
   * 处理删除任务
   */
  const handleDelete = (task: SimulationTask) => {
    setConfirmModal({
      visible: true,
      title: '确认删除任务',
      content: `确定要删除任务「${task.name}」吗？此操作不可恢复。`,
      onConfirm: () => {
        deleteTask(task.id);
        message.success(`任务「${task.name}」已删除`);
        setSelectedRowKeys((prev) => prev.filter((key) => key !== task.id));
        refreshStatistics();
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  /**
   * 处理导出任务数据
   */
  const handleExport = (task: SimulationTask, format: 'csv' | 'json') => {
    const exportData = {
      id: task.id,
      name: task.name,
      status: getStatusLabel(task.status),
      progress: task.progress,
      systemName: task.system.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      results: task.results
    };

    if (format === 'csv') {
      exportToCSV([exportData], `task_${task.id}.csv`);
    } else {
      exportToJSON(exportData, `task_${task.id}.json`);
    }
    message.success(`任务「${task.name}」数据已导出`);
  };

  /**
   * 批量操作 - 启动
   */
  const handleBatchStart = () => {
    const selectedTasks = tasks.filter((task) =>
      selectedRowKeys.includes(task.id)
    );
    selectedTasks.forEach((task) => {
      if (canStart(task)) {
        updateTaskStatus(task.id, SimulationStatus.MESHING, '批量启动任务');
      }
    });
    message.success(`已启动 ${selectedTasks.filter(canStart).length} 个任务`);
    setSelectedRowKeys([]);
    refreshStatistics();
  };

  /**
   * 批量操作 - 暂停
   */
  const handleBatchPause = () => {
    const selectedTasks = tasks.filter((task) =>
      selectedRowKeys.includes(task.id)
    );
    selectedTasks.forEach((task) => {
      if (canPause(task)) {
        updateTaskStatus(task.id, SimulationStatus.PAUSED, '批量暂停任务');
      }
    });
    message.success(`已暂停 ${selectedTasks.filter(canPause).length} 个任务`);
    setSelectedRowKeys([]);
    refreshStatistics();
  };

  /**
   * 批量操作 - 取消
   */
  const handleBatchCancel = () => {
    const selectedTasks = tasks.filter((task) =>
      selectedRowKeys.includes(task.id)
    );
    const cancellableCount = selectedTasks.filter(canCancel).length;
    
    setConfirmModal({
      visible: true,
      title: '确认批量取消',
      content: `确定要取消选中的 ${cancellableCount} 个任务吗？此操作不可恢复。`,
      onConfirm: () => {
        selectedTasks.forEach((task) => {
          if (canCancel(task)) {
            updateTaskStatus(task.id, SimulationStatus.CANCELLED, '批量取消任务');
          }
        });
        message.success(`已取消 ${cancellableCount} 个任务`);
        setSelectedRowKeys([]);
        refreshStatistics();
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      }
    });
  };

  /**
   * 批量操作 - 导出
   */
  const handleBatchExport = (format: 'csv' | 'json') => {
    const selectedTasks = tasks.filter((task) =>
      selectedRowKeys.includes(task.id)
    );
    const exportData = selectedTasks.map((task) => ({
      id: task.id,
      name: task.name,
      status: getStatusLabel(task.status),
      progress: task.progress,
      systemName: task.system.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    if (format === 'csv') {
      exportToCSV(exportData, `tasks_batch_${Date.now()}.csv`);
    } else {
      exportToJSON(exportData, `tasks_batch_${Date.now()}.json`);
    }
    message.success(`已导出 ${selectedTasks.length} 个任务数据`);
    setSelectedRowKeys([]);
  };

  /**
   * 重置筛选条件
   */
  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    setDateRange(null);
    setSystemFilter(null);
    setPagination({ current: 1, pageSize: 10 });
  };

  /**
   * 操作按钮下拉菜单
   */
  const getActionMenu = (task: SimulationTask): MenuProps => ({
    items: [
      {
        key: 'view',
        label: '查看详情',
        icon: <Eye size={14} />,
        onClick: () => handleRowClick(task)
      },
      {
        key: 'export-csv',
        label: '导出 CSV',
        icon: <Download size={14} />,
        onClick: () => handleExport(task, 'csv')
      },
      {
        key: 'export-json',
        label: '导出 JSON',
        icon: <Download size={14} />,
        onClick: () => handleExport(task, 'json')
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        label: '删除任务',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDelete(task)
      }
    ]
  });

  /**
   * 批量导出下拉菜单
   */
  const batchExportMenu: MenuProps = {
    items: [
      {
        key: 'csv',
        label: '导出 CSV',
        onClick: () => handleBatchExport('csv')
      },
      {
        key: 'json',
        label: '导出 JSON',
        onClick: () => handleBatchExport('json')
      }
    ]
  };

  /**
   * 表格列配置
   */
  const columns: TableProps<SimulationTask>['columns'] = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, record) => (
        <span
          className="font-medium text-gray-800 hover:text-primary-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(record);
          }}
        >
          {text}
        </span>
      )
    },
    {
      title: '萃取体系',
      dataIndex: ['system', 'name'],
      key: 'system',
      width: 180,
      sorter: (a, b) => a.system.name.localeCompare(b.system.name)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: statusOptions.map((opt) => ({
        text: opt.label as string,
        value: opt.value as string
      })),
      onFilter: (value, record) => record.status === value,
      render: (status: SimulationStatus) => (
        <StatusBadge status={getStatusLabel(status)} size="md" />
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      sorter: (a, b) => a.progress - b.progress,
      render: (progress: number, record) => (
        <div className="w-full">
          <Progress
            percent={Math.round(progress)}
            size="small"
            strokeColor={
              record.status === SimulationStatus.COMPLETED
                ? '#52c41a'
                : record.status === SimulationStatus.ABNORMAL_ROLLBACK
                ? '#ff4d4f'
                : record.status === SimulationStatus.PAUSED
                ? '#faad14'
                : record.status === SimulationStatus.CANCELLED
                ? '#bfbfbf'
                : '#1890ff'
            }
            format={(percent) => `${formatNumber(percent || 0)}%`}
          />
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => formatDateTime(date)
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          {canStart(record) && (
            <Tooltip title="启动任务">
              <Button
                type="text"
                size="small"
                icon={<Play size={14} />}
                onClick={() => handleStart(record)}
                className="text-green-600 hover:text-green-700"
              />
            </Tooltip>
          )}
          {canPause(record) && (
            <Tooltip title="暂停任务">
              <Button
                type="text"
                size="small"
                icon={<Pause size={14} />}
                onClick={() => handlePause(record)}
                className="text-yellow-600 hover:text-yellow-700"
              />
            </Tooltip>
          )}
          {canCancel(record) && (
            <Tooltip title="取消任务">
              <Button
                type="text"
                size="small"
                icon={<XCircle size={14} />}
                onClick={() => handleCancel(record)}
                className="text-red-600 hover:text-red-700"
              />
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => handleRowClick(record)}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreHorizontal size={14} />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  /**
   * 表格行选择配置
   */
  const rowSelection: TableProps<SimulationTask>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      if (selected) {
        setSelectedRowKeys(filteredTasks.map((t) => t.id));
      } else {
        setSelectedRowKeys([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">模拟任务列表</h1>
          <p className="text-gray-500 mt-1">
            管理和查看所有稀土萃取模拟任务
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusCircle size={18} />}
          onClick={() => navigate('/tasks/new')}
          className="h-10"
        >
          新建任务
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px] max-w-[320px]">
            <Input
              placeholder="搜索任务名称或萃取体系..."
              prefix={<Search size={16} className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          {/* 状态筛选 */}
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={statusOptions}
            allowClear
            style={{ width: 140 }}
          />

          {/* 萃取体系筛选 */}
          <Select
            placeholder="萃取体系"
            value={systemFilter}
            onChange={(value) => setSystemFilter(value)}
            options={systemOptions}
            allowClear
            style={{ width: 180 }}
          />

          {/* 时间范围选择 */}
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            style={{ width: 260 }}
          />

          {/* 重置按钮 */}
          <Button
            icon={<RefreshCw size={14} />}
            onClick={handleResetFilters}
          >
            重置
          </Button>
        </div>
      </div>

      {/* 批量操作工具栏 */}
      {selectedRowKeys.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary-700 font-medium">
              已选择 {selectedRowKeys.length} 项
            </span>
          </div>
          <Space>
            <Button
              icon={<Play size={14} />}
              onClick={handleBatchStart}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              批量启动
            </Button>
            <Button
              icon={<Pause size={14} />}
              onClick={handleBatchPause}
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
            >
              批量暂停
            </Button>
            <Button
              icon={<XCircle size={14} />}
              onClick={handleBatchCancel}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              批量取消
            </Button>
            <Dropdown menu={batchExportMenu} trigger={['click']}>
              <Button icon={<Download size={14} />}>
                批量导出
              </Button>
            </Dropdown>
            <Button onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
        </div>
      )}

      {/* 任务列表表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTasks}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            total: filteredTasks.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize })
          }}
          onChange={(pagination, filters, sorter) => {
            setSorter(sorter as any);
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
          locale={{
            emptyText: (
              <div className="py-12">
                <Empty />
                <p className="text-gray-500 mt-4">暂无任务数据</p>
                <Button
                  type="primary"
                  icon={<PlusCircle size={16} />}
                  onClick={() => navigate('/tasks/new')}
                  className="mt-4"
                >
                  创建第一个任务
                </Button>
              </div>
            )
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* 确认对话框 */}
      <Modal
        title={confirmModal.title}
        open={confirmModal.visible}
        onOk={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>{confirmModal.content}</p>
      </Modal>
    </div>
  );
};

export default TaskList;
