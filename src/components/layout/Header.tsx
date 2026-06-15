import React, { useState } from 'react';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getAlertLevelColor, getAlertTypeLabel, formatDateTime, getUserRoleLabel } from '@/utils';
import { Dropdown, Avatar, Badge, Input, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { Alert } from '@/types';

const { Search: AntSearch } = Input;

const Header: React.FC = () => {
  const { currentUser, getUnacknowledgedAlerts, acknowledgeAlert, tasks } = useAppStore();
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false);
  
  const unacknowledgedAlerts = getUnacknowledgedAlerts();
  const criticalCount = unacknowledgedAlerts.filter(a => a.level === 'critical').length;
  const dangerCount = unacknowledgedAlerts.filter(a => a.level === 'danger').length;

  const handleAcknowledgeAlert = (alert: Alert) => {
    if (currentUser) {
      acknowledgeAlert(alert.taskId, alert.id, currentUser.id);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: '个人中心'
    },
    {
      key: 'settings',
      icon: <Settings size={16} />,
      label: '系统设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      danger: true
    }
  ];

  const alertMenuItems: MenuProps['items'] = unacknowledgedAlerts.slice(0, 5).map(alert => ({
    key: alert.id,
    label: (
      <div className="py-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            alert.level === 'critical' ? 'text-red-600' : 
            alert.level === 'danger' ? 'text-red-500' : 'text-yellow-500'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`status-badge ${getAlertLevelColor(alert.level)}`}>
                {getAlertTypeLabel(alert.type)}
              </span>
              <span className="text-xs text-gray-500">
                {formatDateTime(alert.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1 truncate">{alert.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              任务: {tasks.find(t => t.id === alert.taskId)?.name || '未知任务'} | 第{alert.stage}级
            </p>
          </div>
          <Tooltip title="确认预警">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAcknowledgeAlert(alert);
              }}
              className="p-1 hover:bg-green-50 rounded text-green-600 hover:text-green-700 transition-colors"
            >
              <CheckCircle size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  }));

  if (unacknowledgedAlerts.length === 0) {
    alertMenuItems.push({
      key: 'empty',
      label: (
        <div className="py-8 text-center text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
          <p>暂无待处理预警</p>
        </div>
      )
    });
  }

  if (unacknowledgedAlerts.length > 5) {
    alertMenuItems.push({
      type: 'divider'
    });
    alertMenuItems.push({
      key: 'viewAll',
      label: (
        <div className="text-center text-primary-600 hover:text-primary-700">
          查看全部 {unacknowledgedAlerts.length} 条预警
        </div>
      )
    });
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <AntSearch
            placeholder="搜索任务、体系、参数..."
            prefix={<Search size={18} className="text-gray-400" />}
            className="rounded-lg"
            size="middle"
            allowClear
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Dropdown
          menu={{ items: alertMenuItems }}
          trigger={['click']}
          onOpenChange={setAlertDropdownOpen}
          open={alertDropdownOpen}
          placement="bottomRight"
          overlayStyle={{ width: 400 }}
        >
          <button
            className={`relative p-2 rounded-lg transition-all duration-200 ${
              alertDropdownOpen 
                ? 'bg-primary-100 text-primary-700' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
          >
            <Bell size={20} />
            {unacknowledgedAlerts.length > 0 && (
              <Badge
                count={unacknowledgedAlerts.length}
                size="small"
                className="absolute -top-1 -right-1"
                color={criticalCount > 0 ? '#ef4444' : dangerCount > 0 ? '#f59e0b' : '#22c55e'}
              />
            )}
          </button>
        </Dropdown>

        <div className="h-8 w-px bg-gray-200" />

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Avatar
              size={36}
              className="bg-gradient-to-br from-primary-500 to-primary-700"
              icon={<User size={18} />}
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800">
                {currentUser?.username || '用户'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser ? getUserRoleLabel(currentUser.role) : ''}
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
