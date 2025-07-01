import React, { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTask } from '../contexts/TaskContext'
import { useAuth } from '../contexts/AuthContext'
import StatsCard from '../components/dashboard/StatsCard'
import SafeIcon from '../common/SafeIcon'
import { FiCheckSquare, FiClock, FiTrendingUp, FiTarget, FiAward, FiCalendar, FiActivity } from 'react-icons/fi'

const DashboardPage = () => {
  const { tasks, getProgress, getStats, getSessionInfo, getSessionComparison } = useTask()
  const { user, getLastSession } = useAuth()
  const [previousProgress, setPreviousProgress] = useState(null)
  const [detailedStats, setDetailedStats] = useState(null)
  const [sessionComparison, setSessionComparison] = useState(null)
  const [lastSessionInfo, setLastSessionInfo] = useState(null)
  
  const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
  const currentUser = user || demoUser

  useEffect(() => {
    // 前回の進捗状況を取得
    const progress = getProgress()
    const stats = getStats()
    const sessionInfo = getSessionInfo()
    const comparison = getSessionComparison()
    const lastSession = getLastSession()
    
    if (progress) {
      setPreviousProgress(progress)
    }
    
    if (stats) {
      setDetailedStats(stats)
    }
    
    if (comparison) {
      setSessionComparison(comparison)
    }
    
    if (lastSession) {
      setLastSessionInfo(lastSession)
    }
    
    // デバッグ情報をコンソールに出力
    console.log('=== Dashboard Data ===')
    console.log('Current Progress:', progress)
    console.log('Session Info:', sessionInfo)
    console.log('Session Comparison:', comparison)
    console.log('Last Session:', lastSession)
    
  }, [getProgress, getStats, getSessionInfo, getSessionComparison, getLastSession])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < new Date()
    }).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 今日のタスク
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(t => {
      if (!t.due_date) return false
      return t.due_date.split('T')[0] === today
    })

    return { total, completed, inProgress, overdue, completionRate, todayTasks }
  }, [tasks])

  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date)
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })
      .slice(0, 5)
  }, [tasks])

  // 進捗比較データ
  const progressComparison = useMemo(() => {
    if (sessionComparison) {
      const current = sessionComparison.current
      const previous = sessionComparison.previous
      const improvement = current.completionRate - previous.completionRate

      return {
        current: current.completionRate,
        previous: previous.completionRate,
        improvement,
        isImproved: improvement > 0,
        tasksAdded: sessionComparison.tasksDifference,
        tasksCompleted: sessionComparison.completionDifference,
        daysSince: Math.floor(sessionComparison.timeDifference / (1000 * 60 * 60 * 24))
      }
    }
    
    // フォールバック: 前回の進捗があれば使用
    if (!previousProgress || previousProgress.totalTasks === 0) return null

    const currentRate = stats.completionRate
    const previousRate = previousProgress.completionRate
    const improvement = currentRate - previousRate

    return {
      current: currentRate,
      previous: previousRate,
      improvement,
      isImproved: improvement > 0,
      tasksAdded: stats.total - previousProgress.totalTasks,
      tasksCompleted: stats.completed - previousProgress.completed,
      daysSince: 0
    }
  }, [stats, previousProgress, sessionComparison])

  // ウェルカムメッセージ
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    let timeGreeting = ''
    
    if (hour < 12) timeGreeting = 'おはようございます'
    else if (hour < 18) timeGreeting = 'こんにちは'
    else timeGreeting = 'こんばんは'

    const userName = currentUser?.email?.split('@')[0] || currentUser?.full_name || 'ユーザー'
    
    // セッション比較データがある場合
    if (progressComparison && progressComparison.daysSince > 0) {
      return `${timeGreeting}、${userName}さん！${progressComparison.daysSince}日ぶりのログインです。`
    }
    
    // 最後のセッション情報がある場合
    if (lastSessionInfo && lastSessionInfo.logoutTime) {
      const lastLogout = new Date(lastSessionInfo.logoutTime)
      const now = new Date()
      const hoursSince = Math.floor((now - lastLogout) / (1000 * 60 * 60))
      
      if (hoursSince >= 6) {
        const daysSince = Math.floor(hoursSince / 24)
        if (daysSince > 0) {
          return `${timeGreeting}、${userName}さん！${daysSince}日ぶりのログインです。`
        } else {
          return `${timeGreeting}、${userName}さん！${hoursSince}時間ぶりのログインです。`
        }
      }
    }
    
    return `${timeGreeting}、${userName}さん！`
  }

  // 前回セッションの情報を表示するかどうか
  const shouldShowSessionInfo = () => {
    return progressComparison && (progressComparison.daysSince > 0 || progressComparison.tasksCompleted > 0 || progressComparison.tasksAdded > 0)
  }

  return (
    <div className="space-y-6">
      {/* ウェルカムセクション */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
            
            {shouldShowSessionInfo() && (
              <div className="space-y-2">
                {progressComparison.tasksCompleted > 0 && (
                  <p className="text-blue-100">
                    前回から {progressComparison.tasksCompleted} 個のタスクを完了しました！
                  </p>
                )}
                
                {progressComparison.tasksAdded > 0 && (
                  <p className="text-blue-100">
                    {progressComparison.tasksAdded} 個の新しいタスクが追加されました
                  </p>
                )}
                
                {progressComparison.improvement !== 0 && (
                  <div className="flex items-center space-x-2">
                    <SafeIcon 
                      icon={progressComparison.isImproved ? FiTrendingUp : FiClock} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">
                      完了率が {Math.abs(progressComparison.improvement)}% 
                      {progressComparison.isImproved ? '向上' : '低下'}しました
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {stats.todayTasks.length > 0 && (
              <p className="text-blue-100 mt-2">
                今日は {stats.todayTasks.length} 個のタスクが期限です
              </p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.completionRate}%</div>
            <div className="text-blue-200 text-sm">完了率</div>
            {progressComparison && progressComparison.previous !== undefined && (
              <div className="text-xs text-blue-300 mt-1">
                前回: {progressComparison.previous}%
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="総タスク数"
          value={stats.total}
          icon={FiCheckSquare}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={progressComparison?.tasksAdded > 0 ? {
            positive: true,
            value: `+${progressComparison.tasksAdded}`
          } : null}
        />
        
        <StatsCard
          title="完了済み"
          value={stats.completed}
          icon={FiTarget}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend={progressComparison?.tasksCompleted > 0 ? {
            positive: true,
            value: `+${progressComparison.tasksCompleted}`
          } : null}
        />
        
        <StatsCard
          title="進行中"
          value={stats.inProgress}
          icon={FiTrendingUp}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
        />
        
        <StatsCard
          title="期限切れ"
          value={stats.overdue}
          icon={FiClock}
          color="bg-gradient-to-r from-red-500 to-red-600"
        />
      </div>

      {/* セッション情報カード */}
      {lastSessionInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <SafeIcon icon={FiActivity} className="w-5 h-5 mr-2 text-blue-600" />
              前回のセッション情報
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(lastSessionInfo.sessionDuration / (1000 * 60))}分
              </div>
              <div className="text-xs text-blue-700">セッション時間</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {new Date(lastSessionInfo.logoutTime).toLocaleDateString('ja-JP')}
              </div>
              <div className="text-xs text-green-700">最終ログアウト</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {new Date(lastSessionInfo.loginTime).toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-xs text-purple-700">前回ログイン時刻</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 詳細統計（あれば表示） */}
      {detailedStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">生産性スコア</h3>
              <SafeIcon icon={FiAward} className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {detailedStats.productivityScore}
            </div>
            <p className="text-sm text-gray-600">
              完了率と期限遵守率から算出
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">連続作業日数</h3>
              <SafeIcon icon={FiCalendar} className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {detailedStats.workStreak}日
            </div>
            <p className="text-sm text-gray-600">
              継続的な作業記録
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">今月の完了数</h3>
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {detailedStats.monthlyCompleted}
            </div>
            <p className="text-sm text-gray-600">
              平均完了時間: {detailedStats.avgCompletionTime}日
            </p>
          </div>
        </motion.div>
      )}

      {/* 今日のタスク */}
      {stats.todayTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiCalendar} className="w-6 h-6 mr-2 text-blue-600" />
            今日のタスク ({stats.todayTasks.length}件)
          </h2>
          <div className="space-y-3">
            {stats.todayTasks.map(task => (
              <div key={task.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 最近のタスク */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          最近のタスク
        </h2>
        {recentTasks.length > 0 ? (
          <div className="space-y-4">
            {recentTasks.map(task => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'in_progress' ? '進行中' : '未着手'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>
                    作成: {new Date(task.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  {task.due_date && (
                    <span className={`${
                      new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      期限: {new Date(task.due_date).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <SafeIcon icon={FiCheckSquare} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">タスクがありません</p>
            <p className="text-sm text-gray-400">新しいタスクを作成して始めましょう</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default DashboardPage