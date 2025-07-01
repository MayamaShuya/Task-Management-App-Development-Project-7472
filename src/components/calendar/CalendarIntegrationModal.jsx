import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiX, FiCalendar, FiDownload, FiUpload, FiSettings, FiCheck, FiAlertCircle } from 'react-icons/fi'
import calendarIntegration from '../../utils/calendarIntegration'

const CalendarIntegrationModal = ({ isOpen, onClose }) => {
  const { tasks } = useTask()
  const [activeTab, setActiveTab] = useState('export')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [connectedServices, setConnectedServices] = useState({
    google: false,
    microsoft: false
  })

  useEffect(() => {
    if (isOpen) {
      const savedSettings = calendarIntegration.loadCalendarSettings()
      setSettings(savedSettings)
    }
  }, [isOpen])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // Google Calendar接続
  const connectGoogle = async () => {
    setLoading(true)
    try {
      const result = await calendarIntegration.signInGoogle()
      if (result.success) {
        setConnectedServices(prev => ({ ...prev, google: true }))
        showMessage('success', 'Google Calendarに正常に接続されました')
      } else {
        showMessage('error', `Google Calendar接続に失敗しました: ${result.error}`)
      }
    } catch (error) {
      showMessage('error', 'Google Calendar接続中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Microsoft Calendar接続
  const connectMicrosoft = async () => {
    setLoading(true)
    try {
      const result = await calendarIntegration.signInMicrosoft()
      if (result.success) {
        setConnectedServices(prev => ({ ...prev, microsoft: true }))
        showMessage('success', 'Microsoft Calendarに正常に接続されました')
      } else {
        showMessage('error', `Microsoft Calendar接続に失敗しました: ${result.error}`)
      }
    } catch (error) {
      showMessage('error', 'Microsoft Calendar接続中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // iCalendarエクスポート
  const exportToICalendar = () => {
    try {
      calendarIntegration.exportToICalendar(tasks)
      showMessage('success', 'iCalendarファイルをダウンロードしました')
    } catch (error) {
      showMessage('error', 'エクスポートに失敗しました')
    }
  }

  // Apple Calendar用Webcalリンク生成
  const openInAppleCalendar = () => {
    try {
      const webcalUrl = calendarIntegration.generateWebcalLink(tasks)
      window.open(webcalUrl, '_blank')
      showMessage('success', 'Apple Calendarで開いています...')
    } catch (error) {
      showMessage('error', 'Apple Calendar連携に失敗しました')
    }
  }

  // Google Calendarにタスクを追加
  const addToGoogleCalendar = async () => {
    if (!connectedServices.google) {
      showMessage('error', 'まずGoogle Calendarに接続してください')
      return
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const task of tasks) {
        if (task.status === 'completed') continue
        
        const result = await calendarIntegration.addTaskToGoogle(task)
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        showMessage('success', `${successCount}個のタスクをGoogle Calendarに追加しました`)
      }
      if (errorCount > 0) {
        showMessage('error', `${errorCount}個のタスクの追加に失敗しました`)
      }
    } catch (error) {
      showMessage('error', 'Google Calendarへの追加中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Microsoft Calendarにタスクを追加
  const addToMicrosoftCalendar = async () => {
    if (!connectedServices.microsoft) {
      showMessage('error', 'まずMicrosoft Calendarに接続してください')
      return
    }

    setLoading(true)
    let successCount = 0

    try {
      for (const task of tasks) {
        if (task.status === 'completed') continue
        
        const result = await calendarIntegration.addTaskToMicrosoft(task)
        if (result.success) {
          successCount++
        }
      }

      showMessage('success', `${successCount}個のタスクをMicrosoft Calendarに追加しました`)
    } catch (error) {
      showMessage('error', 'Microsoft Calendarへの追加中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // iCalendarインポート
  const handleFileImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    try {
      const result = await calendarIntegration.importFromICalendar(file)
      if (result.success) {
        showMessage('success', `${result.tasks.length}個のタスクをインポートしました`)
        // ここで実際にタスクを追加する処理を実装
      } else {
        showMessage('error', `インポートに失敗しました: ${result.error}`)
      }
    } catch (error) {
      showMessage('error', 'ファイルの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  // 設定保存
  const saveSettings = () => {
    calendarIntegration.saveCalendarSettings(settings)
    showMessage('success', '設定を保存しました')
  }

  const tabs = [
    { id: 'export', label: 'エクスポート', icon: FiDownload },
    { id: 'import', label: 'インポート', icon: FiUpload },
    { id: 'connect', label: '連携設定', icon: FiSettings }
  ]

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiCalendar} className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">カレンダー連携</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* メッセージ */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`px-6 py-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
                'bg-red-50 text-red-800 border-red-200'
              } border-b flex items-center space-x-2`}
            >
              <SafeIcon 
                icon={message.type === 'success' ? FiCheck : FiAlertCircle} 
                className="w-4 h-4" 
              />
              <span className="text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SafeIcon icon={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* エクスポートタブ */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  タスクをカレンダーにエクスポート
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  現在の{tasks.length}個のタスクを各種カレンダー形式でエクスポートできます
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* iCalendar */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiDownload} className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">iCalendar形式</h4>
                      <p className="text-xs text-gray-500">.icsファイル</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    すべてのカレンダーアプリで使用可能な標準形式
                  </p>
                  <button
                    onClick={exportToICalendar}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ダウンロード
                  </button>
                </div>

                {/* Apple Calendar */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Apple Calendar</h4>
                      <p className="text-xs text-gray-500">macOS/iOS</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Apple CalendarまたはiPhoneのカレンダーで開く
                  </p>
                  <button
                    onClick={openInAppleCalendar}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    開く
                  </button>
                </div>

                {/* Google Calendar */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Google Calendar</h4>
                      <p className="text-xs text-gray-500">
                        {connectedServices.google ? '接続済み' : '未接続'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Google Calendarに直接イベントとして追加
                  </p>
                  <button
                    onClick={addToGoogleCalendar}
                    disabled={loading || !connectedServices.google}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '追加中...' : '追加'}
                  </button>
                </div>

                {/* Microsoft Calendar */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Outlook Calendar</h4>
                      <p className="text-xs text-gray-500">
                        {connectedServices.microsoft ? '接続済み' : '未接続'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Microsoft Outlookカレンダーに直接追加
                  </p>
                  <button
                    onClick={addToMicrosoftCalendar}
                    disabled={loading || !connectedServices.microsoft}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '追加中...' : '追加'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* インポートタブ */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  カレンダーからタスクをインポート
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  他のカレンダーアプリからタスクをインポートできます
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  iCalendarファイルをインポート
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  .ics形式のファイルをドラッグ&ドロップまたはクリックして選択
                </p>
                <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <SafeIcon icon={FiUpload} className="w-4 h-4 mr-2" />
                  ファイルを選択
                  <input
                    type="file"
                    accept=".ics"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      対応形式について
                    </h4>
                    <p className="text-sm text-yellow-700">
                      iCalendar (.ics) 形式のファイルに対応しています。
                      Google Calendar、Outlook、Apple Calendarなどからエクスポートしたファイルをインポートできます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 連携設定タブ */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  カレンダーサービス連携
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  外部カレンダーサービスと連携してリアルタイム同期を行います
                </p>
              </div>

              {/* Google Calendar連携 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Google Calendar</h4>
                      <p className="text-sm text-gray-600">
                        {connectedServices.google ? '接続済み' : '未接続'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={connectGoogle}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      connectedServices.google
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {connectedServices.google ? '接続済み' : '接続'}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Googleアカウントでサインインしてカレンダーと同期します
                </p>
              </div>

              {/* Microsoft Calendar連携 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiCalendar} className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Microsoft Outlook</h4>
                      <p className="text-sm text-gray-600">
                        {connectedServices.microsoft ? '接続済み' : '未接続'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={connectMicrosoft}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      connectedServices.microsoft
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {connectedServices.microsoft ? '接続済み' : '接続'}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Microsoftアカウントでサインインしてカレンダーと同期します
                </p>
              </div>

              {/* 自動同期設定 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">自動同期設定</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">自動同期を有効にする</h5>
                      <p className="text-sm text-gray-600">定期的にカレンダーと同期します</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoSync}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      同期間隔
                    </label>
                    <select
                      value={settings.syncInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={900000}>15分</option>
                      <option value={1800000}>30分</option>
                      <option value={3600000}>1時間</option>
                      <option value={21600000}>6時間</option>
                      <option value={86400000}>24時間</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                設定を保存
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CalendarIntegrationModal