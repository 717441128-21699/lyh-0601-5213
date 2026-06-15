import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

const Dashboard = React.lazy(() => import('@/pages/dashboard/Dashboard'));
const TaskList = React.lazy(() => import('@/pages/tasks/TaskList'));
const NewTask = React.lazy(() => import('@/pages/tasks/NewTask'));
const TaskDetail = React.lazy(() => import('@/pages/tasks/TaskDetail'));
const ReportPreview = React.lazy(() => import('@/pages/tasks/ReportPreview'));
const Recommendation = React.lazy(() => import('@/pages/recommendation/Recommendation'));
const Statistics = React.lazy(() => import('@/pages/statistics/Statistics'));
const Settings = React.lazy(() => import('@/pages/settings/Settings'));
const ThresholdSettings = React.lazy(() => import('@/pages/settings/ThresholdSettings'));
const UserSettings = React.lazy(() => import('@/pages/settings/UserSettings'));
const SystemSettings = React.lazy(() => import('@/pages/settings/SystemSettings'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>}>
            <Dashboard />
          </React.Suspense>
        )
      },
      {
        path: 'tasks',
        children: [
          {
            index: true,
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <TaskList />
              </React.Suspense>
            )
          },
          {
            path: 'new',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <NewTask />
              </React.Suspense>
            )
          },
          {
            path: ':id',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <TaskDetail />
              </React.Suspense>
            )
          },
          {
            path: ':id/report',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <ReportPreview />
              </React.Suspense>
            )
          }
        ]
      },
      {
        path: 'recommendation',
        element: (
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>}>
            <Recommendation />
          </React.Suspense>
        )
      },
      {
        path: 'statistics',
        element: (
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>}>
            <Statistics />
          </React.Suspense>
        )
      },
      {
        path: 'settings',
        element: (
          <React.Suspense fallback={<div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>}>
            <Settings />
          </React.Suspense>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/settings/thresholds" replace />
          },
          {
            path: 'thresholds',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <ThresholdSettings />
              </React.Suspense>
            )
          },
          {
            path: 'users',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <UserSettings />
              </React.Suspense>
            )
          },
          {
            path: 'systems',
            element: (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>}>
                <SystemSettings />
              </React.Suspense>
            )
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]);

export default router;
