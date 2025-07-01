import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // アプリ起動時にローカルストレージからユーザー情報を読み込み
    const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
    if (demoUser) {
      setUser(demoUser)
      
      // 最後のログイン時刻を記録
      const currentLoginTime = new Date().toISOString()
      const loginHistory = JSON.parse(localStorage.getItem('login-history') || '[]')
      
      // 新しいログイン記録を追加
      loginHistory.push({
        userId: demoUser.id || demoUser.email,
        loginTime: currentLoginTime,
        userAgent: navigator.userAgent,
        sessionId: generateSessionId()
      })
      
      // 最新の10回分のログイン履歴のみ保持
      if (loginHistory.length > 10) {
        loginHistory.splice(0, loginHistory.length - 10)
      }
      
      localStorage.setItem('login-history', JSON.stringify(loginHistory))
      
      // ユーザーデータに最終ログイン時刻を更新
      const updatedUser = {
        ...demoUser,
        lastLogin: currentLoginTime,
        currentSession: generateSessionId()
      }
      setUser(updatedUser)
      localStorage.setItem('demo-user', JSON.stringify(updatedUser))
    }
    setLoading(false)
  }, [])

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  const signUp = async (email, password, userData = {}) => {
    setLoading(true)
    try {
      const currentTime = new Date().toISOString()
      const sessionId = generateSessionId()
      
      // Demo signup simulation
      const newUser = {
        id: 'demo-user-' + Date.now(),
        email,
        ...userData,
        createdAt: currentTime,
        lastLogin: currentTime,
        currentSession: sessionId,
        loginCount: 1
      }
      
      setUser(newUser)
      localStorage.setItem('demo-user', JSON.stringify(newUser))
      
      // 初回ログイン履歴を作成
      const loginHistory = [{
        userId: newUser.id,
        loginTime: currentTime,
        userAgent: navigator.userAgent,
        sessionId: sessionId,
        isFirstLogin: true
      }]
      localStorage.setItem('login-history', JSON.stringify(loginHistory))
      
      return { data: { user: newUser }, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const currentTime = new Date().toISOString()
      const sessionId = generateSessionId()
      
      // 既存ユーザーデータを取得
      const existingUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
      
      let demoUser
      if (existingUser && existingUser.email === email) {
        // 既存ユーザーのログイン
        demoUser = {
          ...existingUser,
          lastLogin: currentTime,
          currentSession: sessionId,
          loginCount: (existingUser.loginCount || 0) + 1
        }
      } else {
        // 新規ユーザーのログイン（メール変更時など）
        demoUser = {
          id: 'demo-user-' + Date.now(),
          email,
          createdAt: currentTime,
          lastLogin: currentTime,
          currentSession: sessionId,
          loginCount: 1
        }
      }
      
      setUser(demoUser)
      localStorage.setItem('demo-user', JSON.stringify(demoUser))
      
      // ログイン履歴を更新
      const loginHistory = JSON.parse(localStorage.getItem('login-history') || '[]')
      loginHistory.push({
        userId: demoUser.id,
        loginTime: currentTime,
        userAgent: navigator.userAgent,
        sessionId: sessionId,
        isReturningUser: existingUser ? true : false
      })
      
      if (loginHistory.length > 10) {
        loginHistory.splice(0, loginHistory.length - 10)
      }
      
      localStorage.setItem('login-history', JSON.stringify(loginHistory))
      
      return { data: { user: demoUser }, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const currentUser = user
      if (currentUser) {
        // ログアウト時刻を記録
        const logoutTime = new Date().toISOString()
        
        // セッション終了記録
        const sessionEnd = {
          userId: currentUser.id,
          sessionId: currentUser.currentSession,
          loginTime: currentUser.lastLogin,
          logoutTime: logoutTime,
          sessionDuration: new Date(logoutTime) - new Date(currentUser.lastLogin)
        }
        
        const sessionHistory = JSON.parse(localStorage.getItem('session-history') || '[]')
        sessionHistory.push(sessionEnd)
        
        // 最新の20セッション分のみ保持
        if (sessionHistory.length > 20) {
          sessionHistory.splice(0, sessionHistory.length - 20)
        }
        
        localStorage.setItem('session-history', JSON.stringify(sessionHistory))
        
        // ユーザーデータにログアウト時刻を記録
        const updatedUser = {
          ...currentUser,
          lastLogout: logoutTime,
          currentSession: null
        }
        localStorage.setItem('demo-user', JSON.stringify(updatedUser))
      }
      
      setUser(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // ログイン履歴を取得
  const getLoginHistory = () => {
    return JSON.parse(localStorage.getItem('login-history') || '[]')
  }

  // セッション履歴を取得
  const getSessionHistory = () => {
    return JSON.parse(localStorage.getItem('session-history') || '[]')
  }

  // 前回のセッション情報を取得
  const getLastSession = () => {
    const sessionHistory = getSessionHistory()
    const currentUserId = user?.id
    
    if (!currentUserId || sessionHistory.length === 0) return null
    
    // 現在のユーザーの最新セッションを取得（現在のセッションを除く）
    const userSessions = sessionHistory
      .filter(session => session.userId === currentUserId)
      .sort((a, b) => new Date(b.logoutTime) - new Date(a.logoutTime))
    
    return userSessions[0] || null
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getLoginHistory,
    getSessionHistory,
    getLastSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}