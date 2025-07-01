import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import { FiWifi, FiWifiOff, FiDownload } from 'react-icons/fi'
import { isPWAInstalled, checkForUpdates } from '../../utils/pwa'

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInstalled, setIsInstalled] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    setIsInstalled(isPWAInstalled())

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // アップデートチェック
    checkForUpdates()

    // Service Workerのアップデート検知
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true)
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2">
      {/* オンライン/オフライン状態 */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}
      >
        <SafeIcon 
          icon={isOnline ? FiWifi : FiWifiOff} 
          className="w-4 h-4" 
        />
        <span>{isOnline ? 'オンライン' : 'オフライン'}</span>
      </motion.div>

      {/* PWAインストール状態 */}
      {isInstalled && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <SafeIcon icon={FiDownload} className="w-4 h-4" />
          <span>アプリ版</span>
        </motion.div>
      )}

      {/* アップデート通知 */}
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 max-w-xs"
        >
          <p className="text-sm text-yellow-800 font-medium mb-2">
            新しいバージョンが利用可能です
          </p>
          <button
            onClick={handleUpdate}
            className="w-full bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
          >
            今すぐ更新
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default PWAStatus