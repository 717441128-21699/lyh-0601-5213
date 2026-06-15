import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const MainLayout: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0F2C59',
          colorInfo: '#2859A3',
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Card: {
            borderRadius: 12,
          },
          Table: {
            borderRadius: 12,
          },
        },
      }}
    >
      <AntdApp>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto p-6 scrollbar-thin">
              <Outlet />
            </main>
          </div>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default MainLayout;
