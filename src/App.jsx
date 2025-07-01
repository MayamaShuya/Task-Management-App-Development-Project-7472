import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/TaskContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import InstallPrompt from './components/pwa/InstallPrompt'
import PWAStatus from './components/pwa/PWAStatus'
import SessionSummary from './components/dashboard/SessionSummary'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import TimelinePage from './pages/TimelinePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import { registerServiceWorker, requestNotificationPermission } from './utils/pwa'
import './App.css'

function App() {
  useEffect(() => {
    // Service Workerの登録
    registerServiceWorker()
    
    // 通知許可のリクエスト（ユーザーがログインしている場合）
    const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
    if (demoUser) {
      requestNotificationPermission()
    }

    // アプリケーション開始時刻を記録
    const startTime = new Date().toISOString()
    sessionStorage.setItem('appStartTime', startTime)

    // ページ離脱時の処理
    const handleBeforeUnload = () => {
      const endTime = new Date().toISOString()
      const sessionTime = new Date(endTime) - new Date(startTime)
      
      // セッション時間を記録（5分以上の場合のみ）
      if (sessionTime > 5 * 60 * 1000) {
        const sessionData = {
          startTime,
          endTime,
          duration: sessionTime,
          userId: demoUser?.id || demoUser?.email || 'demo'
        }
        
        const sessions = JSON.parse(localStorage.getItem('userSessions') || '[]')
        sessions.push(sessionData)
        
        // 最新の20セッションのみ保持
        if (sessions.length > 20) {
          sessions.splice(0, sessions.length - 20)
        }
        
        localStorage.setItem('userSessions', JSON.stringify(sessions))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload() // コンポーネントアンマウント時も実行
    }
  }, [])

  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TasksPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TimelinePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* PWA・セッション関連コンポーネント */}
          <InstallPrompt />
          <PWAStatus />
          <SessionSummary />
        </Router>
      </TaskProvider>
    </AuthProvider>
  )
}

export default App