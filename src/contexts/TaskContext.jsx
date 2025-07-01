import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const TaskContext = createContext({})

export const useTask = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}

export const TaskProvider = ({ children }) => {
  const { user, getLastSession } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  // ユーザー固有のストレージキーを生成
  const getUserStorageKey = (userId) => {
    return `tasks_${userId || 'demo'}`
  }

  const getUserProgressKey = (userId) => {
    return `progress_${userId || 'demo'}`
  }

  const getUserStatsKey = (userId) => {
    return `stats_${userId || 'demo'}`
  }

  const getSessionDataKey = (userId) => {
    return `session_data_${userId || 'demo'}`
  }

  // タスクをローカルストレージに保存
  const saveTasksToStorage = (tasksData, userId) => {
    try {
      const storageKey = getUserStorageKey(userId)
      const progressKey = getUserProgressKey(userId)
      const statsKey = getUserStatsKey(userId)
      const sessionDataKey = getSessionDataKey(userId)
      
      const currentTime = new Date().toISOString()
      
      // タスクデータを保存
      localStorage.setItem(storageKey, JSON.stringify(tasksData))
      
      // 進捗状況を計算・保存
      const progress = calculateProgress(tasksData)
      const progressData = {
        ...progress,
        lastUpdated: currentTime,
        totalTasks: tasksData.length,
        sessionId: user?.currentSession
      }
      localStorage.setItem(progressKey, JSON.stringify(progressData))
      
      // 統計情報を保存
      const stats = calculateDetailedStats(tasksData)
      const statsData = {
        ...stats,
        lastCalculated: currentTime,
        sessionId: user?.currentSession
      }
      localStorage.setItem(statsKey, JSON.stringify(statsData))
      
      // セッション固有のデータを保存
      const sessionData = {
        lastActivity: currentTime,
        taskCount: tasksData.length,
        completedInSession: tasksData.filter(t => {
          if (t.status !== 'completed' || !t.updated_at) return false
          const completedTime = new Date(t.updated_at)
          const sessionStart = user?.lastLogin ? new Date(user.lastLogin) : new Date()
          return completedTime >= sessionStart
        }).length,
        createdInSession: tasksData.filter(t => {
          const createdTime = new Date(t.created_at)
          const sessionStart = user?.lastLogin ? new Date(user.lastLogin) : new Date()
          return createdTime >= sessionStart
        }).length,
        sessionId: user?.currentSession,
        userId: userId
      }
      localStorage.setItem(sessionDataKey, JSON.stringify(sessionData))
      
      setLastSyncTime(currentTime)
    } catch (error) {
      console.error('Failed to save tasks to storage:', error)
    }
  }

  // ローカルストレージからタスクを読み込み
  const loadTasksFromStorage = (userId) => {
    try {
      const storageKey = getUserStorageKey(userId)
      const savedTasks = localStorage.getItem(storageKey)
      return savedTasks ? JSON.parse(savedTasks) : []
    } catch (error) {
      console.error('Failed to load tasks from storage:', error)
      return []
    }
  }

  // 進捗状況を読み込み
  const loadProgressFromStorage = (userId) => {
    try {
      const progressKey = getUserProgressKey(userId)
      const savedProgress = localStorage.getItem(progressKey)
      return savedProgress ? JSON.parse(savedProgress) : null
    } catch (error) {
      console.error('Failed to load progress from storage:', error)
      return null
    }
  }

  // 統計情報を読み込み
  const loadStatsFromStorage = (userId) => {
    try {
      const statsKey = getUserStatsKey(userId)
      const savedStats = localStorage.getItem(statsKey)
      return savedStats ? JSON.parse(savedStats) : null
    } catch (error) {
      console.error('Failed to load stats from storage:', error)
      return null
    }
  }

  // セッションデータを読み込み
  const loadSessionData = (userId) => {
    try {
      const sessionDataKey = getSessionDataKey(userId)
      const savedSessionData = localStorage.getItem(sessionDataKey)
      return savedSessionData ? JSON.parse(savedSessionData) : null
    } catch (error) {
      console.error('Failed to load session data from storage:', error)
      return null
    }
  }

  // 前回のセッションとの比較データを取得
  const getSessionComparison = () => {
    if (!user) return null
    
    const userId = user.id || user.email || 'demo'
    const currentProgress = loadProgressFromStorage(userId)
    const lastSession = getLastSession()
    
    if (!currentProgress || !lastSession) return null
    
    // 前回セッション時のデータを取得
    const progressHistory = JSON.parse(localStorage.getItem(`progress_history_${userId}`) || '[]')
    const lastSessionProgress = progressHistory.find(p => p.sessionId === lastSession.sessionId)
    
    if (!lastSessionProgress) return null
    
    return {
      current: currentProgress,
      previous: lastSessionProgress,
      timeDifference: new Date(currentProgress.lastUpdated) - new Date(lastSessionProgress.lastUpdated),
      tasksDifference: currentProgress.totalTasks - lastSessionProgress.totalTasks,
      completionDifference: currentProgress.completed - lastSessionProgress.completed,
      lastSessionDuration: lastSession.sessionDuration
    }
  }

  // 進捗履歴を保存
  const saveProgressHistory = (progress, userId) => {
    try {
      const historyKey = `progress_history_${userId}`
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
      
      // 現在の進捗を履歴に追加
      history.push({
        ...progress,
        savedAt: new Date().toISOString()
      })
      
      // 最新の50件のみ保持
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save progress history:', error)
    }
  }

  // 進捗状況を計算
  const calculateProgress = (tasksData) => {
    const total = tasksData.length
    const completed = tasksData.filter(t => t.status === 'completed').length
    const inProgress = tasksData.filter(t => t.status === 'in_progress').length
    const todo = tasksData.filter(t => t.status === 'todo').length
    const overdue = tasksData.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < new Date()
    }).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    // 優先度別統計
    const highPriority = tasksData.filter(t => t.priority === 'high').length
    const mediumPriority = tasksData.filter(t => t.priority === 'medium').length
    const lowPriority = tasksData.filter(t => t.priority === 'low').length

    // 今日のタスク
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasksData.filter(t => {
      if (!t.due_date) return false
      return t.due_date.split('T')[0] === today
    }).length

    // 今週のタスク
    const thisWeek = getThisWeekRange()
    const thisWeekTasks = tasksData.filter(t => {
      if (!t.due_date) return false
      const taskDate = new Date(t.due_date)
      return taskDate >= thisWeek.start && taskDate <= thisWeek.end
    }).length

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      completionRate,
      priority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      todayTasks,
      thisWeekTasks
    }
  }

  // 詳細統計を計算
  const calculateDetailedStats = (tasksData) => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    // 月別完了数
    const monthlyCompleted = tasksData.filter(t => {
      if (t.status !== 'completed' || !t.updated_at) return false
      const completedDate = new Date(t.updated_at || t.created_at)
      return completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear
    }).length

    // 平均完了時間（作成から完了まで）
    const completedTasks = tasksData.filter(t => t.status === 'completed' && t.updated_at)
    const avgCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const created = new Date(task.created_at)
          const completed = new Date(task.updated_at)
          return acc + (completed - created)
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // 日数変換
      : 0

    // 生産性スコア（完了率 + 期限内完了率）
    const onTimeCompleted = completedTasks.filter(t => {
      if (!t.due_date) return true
      return new Date(t.updated_at) <= new Date(t.due_date)
    }).length

    const onTimeRate = completedTasks.length > 0 
      ? (onTimeCompleted / completedTasks.length) * 100 
      : 0

    const productivityScore = Math.round(
      (calculateProgress(tasksData).completionRate * 0.6) + (onTimeRate * 0.4)
    )

    // 連続作業日数
    const workStreak = calculateWorkStreak(tasksData)

    return {
      monthlyCompleted,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      onTimeRate: Math.round(onTimeRate),
      productivityScore,
      workStreak,
      totalTimeSpent: calculateTotalTimeSpent(tasksData)
    }
  }

  // 今週の範囲を取得
  const getThisWeekRange = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    
    return { start, end }
  }

  // 連続作業日数を計算
  const calculateWorkStreak = (tasksData) => {
    const completedDates = tasksData
      .filter(t => t.status === 'completed' && t.updated_at)
      .map(t => new Date(t.updated_at).toISOString().split('T')[0])
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index) // 重複除去

    if (completedDates.length === 0) return 0

    let streak = 1
    let currentStreak = 1
    
    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = new Date(completedDates[i - 1])
      const currDate = new Date(completedDates[i])
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        currentStreak++
        streak = Math.max(streak, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    return streak
  }

  // 総作業時間を計算（推定）
  const calculateTotalTimeSpent = (tasksData) => {
    // 簡易的な計算：タスクの複雑度に基づく推定時間
    return tasksData.reduce((total, task) => {
      let estimatedHours = 1 // デフォルト1時間
      
      if (task.priority === 'high') estimatedHours = 3
      else if (task.priority === 'medium') estimatedHours = 2
      
      if (task.description && task.description.length > 100) {
        estimatedHours += 1
      }
      
      return total + estimatedHours
    }, 0)
  }

  useEffect(() => {
    // ユーザーが変更されたときにタスクを読み込み
    const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
    const currentUser = user || demoUser
    
    if (currentUser) {
      const userId = currentUser.id || currentUser.email || 'demo'
      const savedTasks = loadTasksFromStorage(userId)
      const savedProgress = loadProgressFromStorage(userId)
      const savedSessionData = loadSessionData(userId)
      
      setTasks(savedTasks)
      setSessionInfo(savedSessionData)
      
      // 前回の進捗状況をログに出力
      if (savedProgress && savedTasks.length > 0) {
        console.log('=== 前回のセッション情報 ===')
        console.log('最終更新:', savedProgress.lastUpdated)
        console.log('総タスク数:', savedProgress.totalTasks)
        console.log('完了率:', savedProgress.completionRate + '%')
        console.log('完了済み:', savedProgress.completed)
        console.log('進行中:', savedProgress.inProgress)
        console.log('期限切れ:', savedProgress.overdue)
        
        if (savedSessionData) {
          console.log('=== セッション詳細 ===')
          console.log('セッション内完了:', savedSessionData.completedInSession)
          console.log('セッション内作成:', savedSessionData.createdInSession)
          console.log('最後の活動:', savedSessionData.lastActivity)
        }
        
        // 進捗履歴を保存
        saveProgressHistory(savedProgress, userId)
        
        // ウェルカムバックメッセージを表示
        if (savedProgress.lastUpdated && currentUser.lastLogin) {
          const lastUpdate = new Date(savedProgress.lastUpdated)
          const currentLogin = new Date(currentUser.lastLogin)
          const timeDiff = currentLogin - lastUpdate
          const daysSince = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
          
          setTimeout(() => {
            if (daysSince > 0 || timeDiff > 6 * 60 * 60 * 1000) { // 6時間以上経過
              showWelcomeBackMessage(savedProgress, savedSessionData, daysSince)
            }
          }, 1000)
        }
      }
    } else {
      // ログアウト時はタスクをクリア
      setTasks([])
      setSessionInfo(null)
    }
  }, [user])

  // ウェルカムバックメッセージを表示
  const showWelcomeBackMessage = (progress, sessionData, daysSince) => {
    const timeSinceText = daysSince > 0 
      ? `${daysSince}日ぶりのログイン`
      : '久しぶりのログイン'
    
    const sessionText = sessionData
      ? `前回セッションで${sessionData.completedInSession}個のタスクを完了`
      : `前回の進捗: ${progress.completionRate}%`
    
    const message = `${timeSinceText}です！${sessionText}`
    
    // カスタム通知を表示
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TaskFlow - おかえりなさい！', {
        body: message,
        icon: '/icons/icon-192x192.png'
      })
    }
    
    // ブラウザ内通知も表示
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg
      transform translate-x-full transition-transform duration-300 max-w-sm
    `
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5T6"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-medium text-sm">おかえりなさい！</p>
          <p class="text-xs text-blue-200 mt-1">${message}</p>
          ${progress ? `<p class="text-xs text-blue-300 mt-1">完了率: ${progress.completionRate}% | 総タスク: ${progress.totalTasks}件</p>` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                class="text-blue-200 hover:text-white flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // アニメーションで表示
    setTimeout(() => {
      notification.style.transform = 'translate-x-0'
    }, 100)
    
    // 8秒後に自動で非表示
    setTimeout(() => {
      notification.style.transform = 'translate-x-full'
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification)
        }
      }, 300)
    }, 8000)
  }

  const getCurrentUserId = () => {
    const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
    const currentUser = user || demoUser
    return currentUser ? (currentUser.id || currentUser.email || 'demo') : null
  }

  const createTask = async (taskData) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return { data: null, error: 'User not found' }

      const newTask = {
        ...taskData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const updatedTasks = [newTask, ...tasks]
      setTasks(updatedTasks)
      saveTasksToStorage(updatedTasks, userId)

      return { data: [newTask], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updateTask = async (taskId, updates) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return { data: null, error: 'User not found' }

      const updatedTasks = tasks.map(task =>
        task.id === taskId 
          ? { 
              ...task, 
              ...updates, 
              updated_at: new Date().toISOString() 
            } 
          : task
      )

      setTasks(updatedTasks)
      saveTasksToStorage(updatedTasks, userId)

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const deleteTask = async (taskId) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return { error: 'User not found' }

      const updatedTasks = tasks.filter(task => task.id !== taskId)
      setTasks(updatedTasks)
      saveTasksToStorage(updatedTasks, userId)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // 全タスクを削除（設定ページ用）
  const clearAllTasks = async () => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return { error: 'User not found' }

      setTasks([])
      saveTasksToStorage([], userId)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // タスクをインポート（設定ページ用）
  const importTasks = async (importedTasks) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return { error: 'User not found' }

      const validTasks = importedTasks.filter(task =>
        task.title && task.id && task.created_at
      ).map(task => ({
        ...task,
        updated_at: task.updated_at || task.created_at
      }))

      setTasks(validTasks)
      saveTasksToStorage(validTasks, userId)

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // 進捗状況を取得
  const getProgress = () => {
    const userId = getCurrentUserId()
    if (!userId) return null
    return loadProgressFromStorage(userId)
  }

  // 統計情報を取得
  const getStats = () => {
    const userId = getCurrentUserId()
    if (!userId) return null
    return loadStatsFromStorage(userId)
  }

  // セッション情報を取得
  const getSessionInfo = () => {
    const userId = getCurrentUserId()
    if (!userId) return null
    return loadSessionData(userId)
  }

  // データのバックアップ
  const backupData = () => {
    const userId = getCurrentUserId()
    if (!userId) return null

    return {
      tasks: tasks,
      progress: getProgress(),
      stats: getStats(),
      sessionInfo: getSessionInfo(),
      backupDate: new Date().toISOString(),
      userId: userId
    }
  }

  const value = {
    tasks,
    loading,
    lastSyncTime,
    sessionInfo,
    createTask,
    updateTask,
    deleteTask,
    clearAllTasks,
    importTasks,
    getProgress,
    getStats,
    getSessionInfo,
    getSessionComparison,
    backupData
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}