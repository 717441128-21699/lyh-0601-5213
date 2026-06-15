import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Lightbulb,
  BarChart3,
  Settings,
  FlaskConical,
  FileBarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    description: '任务概览与实时监控'
  },
  {
    path: '/tasks',
    label: '任务管理',
    icon: ListTodo,
    description: '所有模拟任务列表'
  },
  {
    path: '/tasks/new',
    label: '新建任务',
    icon: PlusCircle,
    description: '创建新的模拟任务'
  },
  {
    path: '/recommendation',
    label: '智能推荐',
    icon: Lightbulb,
    description: '最优参数推荐引擎'
  },
  {
    path: '/statistics',
    label: '统计看板',
    icon: BarChart3,
    description: '性能统计与分析'
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: Settings,
    description: '阈值配置与用户管理'
  }
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-primary-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-orange to-accent-cyan rounded-xl flex items-center justify-center shadow-lg">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">稀土萃取模拟</h1>
            <p className="text-xs text-primary-200">智能优化平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-link group relative overflow-hidden',
                isActive && 'sidebar-link-active'
              )}
            >
              <div className={cn(
                'absolute left-0 top-0 h-full w-1 rounded-r-full transition-all duration-300',
                isActive ? 'bg-accent-orange' : 'bg-transparent group-hover:bg-primary-400'
              )} />
              
              <Icon className={cn(
                'w-5 h-5 transition-colors duration-200 relative z-10',
                isActive ? 'text-primary-800' : 'text-gray-400 group-hover:text-primary-600'
              )} />
              
              <div className="flex-1 min-w-0 relative z-10">
                <p className={cn(
                  'font-medium transition-colors duration-200',
                  isActive ? 'text-primary-800' : 'text-gray-300 group-hover:text-primary-700'
                )}>
                  {item.label}
                </p>
                <p className={cn(
                  'text-xs transition-colors duration-200 truncate',
                  isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-500'
                )}>
                  {item.description}
                </p>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-700/50">
        <div className="bg-primary-900/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileBarChart className="w-5 h-5 text-accent-cyan" />
            <span className="text-sm font-medium text-white">今日统计</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-800/50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-accent-cyan">8</p>
              <p className="text-xs text-primary-300">进行中</p>
            </div>
            <div className="bg-primary-800/50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-accent-orange">12</p>
              <p className="text-xs text-primary-300">待处理</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
