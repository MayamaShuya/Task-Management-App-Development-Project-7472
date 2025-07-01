import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTask } from '../contexts/TaskContext'
import CalendarSyncButton from '../components/calendar/CalendarSyncButton'
import SafeIcon from '../common/SafeIcon'
import { FiUser, FiBell, FiMoon, FiSun, FiSave, FiTrash2, FiDownload, FiUpload, FiCalendar } from 'react-icons/fi'

const SettingsPage = () => {
  const { user, signOut } = useAuth()
  const { tasks, clearAllTasks, importTasks } = useTask()
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    emailNotifications: false,
    taskReminders: true,
    language: 'ja',
    dateFormat: 'YYYY-MM-DD',
    calendarIntegration: true,
    autoSyncCalendar: false
  })
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    // Load user profile
    const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
    const currentUser = user || demoUser
    if (currentUser) {
      setUserProfile({
        fullName: currentUser.full_name || currentUser.email?.split('@')[0] || '',
        email: currentUser.email || '',
        bio: currentUser.bio || ''
      })
    }
  }, [user])

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('app-settings', JSON.stringify(newSettings))
  }

  const handleProfileChange = (key, value) => {
    setUserProfile(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
      if (demoUser) {
        const updatedUser = { ...demoUser, ...userProfile }
        localStorage.setItem('demo-user', JSON.stringify(updatedUser))
      }
      alert('プロフィールが更新されました')
    } catch (error) {
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    const data = {
      tasks: tasks,
      settings: settings,
      profile: userProfile,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskflow-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    alert('データをエクスポートしました')
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result)

          // 設定をインポート
          if (data.settings) {
            setSettings(data.settings)
            localStorage.setItem('app-settings', JSON.stringify(data.settings))
          }

          // プロフィールをインポート
          if (data.profile) {
            setUserProfile(data.profile)
            const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
            if (demoUser) {
              const updatedUser = { ...demoUser, ...data.profile }
              localStorage.setItem('demo-user', JSON.stringify(updatedUser))
            }
          }

          // タスクをインポート
          if (data.tasks && Array.isArray(data.tasks)) {
            await importTasks(data.tasks)
          }

          alert(`データをインポートしました\n- タスク: ${data.tasks?.length || 0}件\n- 設定: ${data.settings ? '更新' : '変更なし'}\n- プロフィール: ${data.profile ? '更新' : '変更なし'}`)
        } catch (error) {
          alert('無効なファイル形式です。正しいTaskFlowエクスポートファイルを選択してください。')
        }
      }
      reader.readAsText(file)
    }
    // ファイル選択をリセット
    event.target.value = ''
  }

  const deleteAllData = async () => {
    if (window.confirm('すべてのデータを削除しますか？\n\n以下のデータが削除されます：\n• すべてのタスク\n• アプリ設定\n• プロフィール情報\n\nこの操作は取り消せません。')) {
      try {
        // タスクを削除
        await clearAllTasks()
        
        // 設定を削除
        localStorage.removeItem('app-settings')
        
        // ユーザーデータを削除
        localStorage.removeItem('demo-user')
        
        alert('すべてのデータが削除されました')
        signOut()
      } catch (error) {
        alert('データの削除中にエラーが発生しました')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600 mt-1">
            アカウントとアプリの設定を管理します
          </p>
        </div>
      </motion.div>

      {/* プロフィール設定 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <SafeIcon icon={FiUser} className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">プロフィール</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              フルネーム
            </label>
            <input
              type="text"
              value={userProfile.fullName}
              onChange={(e) => handleProfileChange('fullName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自己紹介
            </label>
            <textarea
              value={userProfile.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="簡単な自己紹介を入力してください"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveProfile}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <SafeIcon icon={FiSave} className="w-4 h-4" />
            <span>{loading ? '保存中...' : 'プロフィール保存'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* アプリケーション設定 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <SafeIcon icon={FiBell} className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">アプリケーション設定</h2>
        </div>

        <div className="space-y-6">
          {/* テーマ設定 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">テーマ</h3>
              <p className="text-sm text-gray-600">アプリの外観を選択してください</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSettingsChange('theme', 'light')}
                className={`p-2 rounded-lg transition-all ${
                  settings.theme === 'light' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SafeIcon icon={FiSun} className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSettingsChange('theme', 'dark')}
                className={`p-2 rounded-lg transition-all ${
                  settings.theme === 'dark' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SafeIcon icon={FiMoon} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* カレンダー連携設定 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">カレンダー連携</h3>
              <p className="text-sm text-gray-600">外部カレンダーとの連携を有効にする</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.calendarIntegration}
                onChange={(e) => handleSettingsChange('calendarIntegration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 自動同期設定 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">カレンダー自動同期</h3>
              <p className="text-sm text-gray-600">タスクをカレンダーと自動同期する</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncCalendar}
                onChange={(e) => handleSettingsChange('autoSyncCalendar', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 通知設定 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">プッシュ通知</h3>
              <p className="text-sm text-gray-600">ブラウザ通知を受け取る</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingsChange('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">メール通知</h3>
              <p className="text-sm text-gray-600">重要な更新をメールで受け取る</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">タスクリマインダー</h3>
              <p className="text-sm text-gray-600">期限前にリマインダーを送信</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.taskReminders}
                onChange={(e) => handleSettingsChange('taskReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 言語設定 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">言語</h3>
              <p className="text-sm text-gray-600">アプリの表示言語を選択</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleSettingsChange('language', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* 日付形式 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">日付形式</h3>
              <p className="text-sm text-gray-600">日付の表示形式を選択</p>
            </div>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleSettingsChange('dateFormat', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="YYYY-MM-DD">2024-12-25</option>
              <option value="DD/MM/YYYY">25/12/2024</option>
              <option value="MM/DD/YYYY">12/25/2024</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* カレンダー連携管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiCalendar} className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">カレンダー連携管理</h2>
          </div>
          <CalendarSyncButton />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">連携可能なカレンダー</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Google Calendar - リアルタイム同期</li>
            <li>• Microsoft Outlook Calendar - リアルタイム同期</li>
            <li>• Apple Calendar - iCalendarエクスポート/インポート</li>
            <li>• その他のカレンダーアプリ - iCalendar形式(.ics)</li>
          </ul>
        </div>
      </motion.div>

      {/* データ管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <SafeIcon icon={FiDownload} className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">データ管理</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">現在のデータ状況</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">タスク数: </span>
                <span className="font-medium text-blue-900">{tasks.length}件</span>
              </div>
              <div>
                <span className="text-blue-700">完了率: </span>
                <span className="font-medium text-blue-900">
                  {tasks.length > 0 
                    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportData}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiDownload} className="w-5 h-5" />
              <span>データをエクスポート</span>
            </motion.button>

            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <SafeIcon icon={FiUpload} className="w-5 h-5" />
              <span>データをインポート</span>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </motion.label>
          </div>

          <div className="border-t pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={deleteAllData}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiTrash2} className="w-5 h-5" />
              <span>すべてのデータを削除</span>
            </motion.button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              この操作は取り消すことができません。注意してください。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsPage