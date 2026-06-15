import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Card } from 'antd';
import type { TabsProps } from 'antd';

/**
 * 系统设置布局页面
 * 作为系统设置模块的父布局，包含三个子路由的Tab导航
 * 使用 Ant Design Tabs 组件与 React Router 实现联动
 */
const Settings: React.FC = () => {
  // 获取当前路由位置信息
  const location = useLocation();
  // 获取路由导航函数
  const navigate = useNavigate();

  // 当前激活的Tab键值，根据URL路径自动确定
  const [activeKey, setActiveKey] = useState<string>('/settings/thresholds');

  /**
   * Tab配置项
   * key: 对应路由路径
   * label: Tab显示名称
   */
  const tabItems: TabsProps['items'] = [
    {
      key: '/settings/thresholds',
      label: '阈值设置',
    },
    {
      key: '/settings/users',
      label: '用户管理',
    },
    {
      key: '/settings/systems',
      label: '系统配置',
    },
  ];

  /**
   * 监听URL路径变化，自动激活对应的Tab
   * 当路由改变时，更新activeKey以匹配当前路径
   */
  useEffect(() => {
    const currentPath = location.pathname;
    // 检查当前路径是否匹配某个Tab的路由
    const matchedTab = tabItems.find((item) => currentPath.startsWith(item.key as string));
    if (matchedTab) {
      setActiveKey(matchedTab.key as string);
    }
  }, [location.pathname]);

  /**
   * Tab切换事件处理
   * 当用户点击Tab时，导航到对应的路由
   * @param key - 被点击Tab的key值（即路由路径）
   */
  const handleTabChange = (key: string) => {
    navigate(key);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
          <p className="text-sm text-gray-500 mt-1">配置系统参数、管理用户及阈值设置</p>
        </div>
      </div>

      {/* Tab导航与内容区域 */}
      <Card className="shadow-sm border-gray-100">
        <Tabs
          activeKey={activeKey}
          items={tabItems}
          onChange={handleTabChange}
          className="settings-tabs"
          size="large"
        />
        {/* 子页面内容渲染区域 */}
        <div className="pt-4">
          <Outlet />
        </div>
      </Card>
    </div>
  );
};

export default Settings;
