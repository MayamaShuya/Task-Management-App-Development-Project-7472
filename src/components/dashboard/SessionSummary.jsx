import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiClock, FiCheckCircle, FiTrendingUp, FiX } from 'react-icons/fi'

const SessionSummary = () => {
  const { getProgress, getStats } = useTask()
  const [sessionData, setSessionData] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    const checkForReturningUser = () => {
      const progress = getProgress()
      const stats = getStats()
      
      if (!progress || !progress.lastUpdated) return

      const lastUpdate = new Date(progress.lastUpdated)
      const now = new Date()
      const hoursSince = Math.floor((now - lastUpdate) / (1000 * 60 * 60))
      
      // 6時間以上経過している場合のみ表示
      if (hoursSince >= 6) {
        const daysSince = Math.floor(hoursSince / 24)
        
        setSessionData({
          daysSince: daysSince > 0 ? daysSince : 0,
          hoursSince,
          lastProgress: progress,
          lastStats: stats,
          isReturningUser: true
        })
        
        // 少し遅延してから表示
        setTimeout(() => {
          setShowSummary(true)
        }, 2000)
      }
    }

    checkForReturningUser()
  }, [getProgress, getStats])

  const handleClose = () => {
    setShowSummary(false)
    // 今日はもう表示しない
    localStorage.setItem('sessionSummaryDismissed', new Date().toDateString())
  }

  // 今日すでに却下されている場合は表示しない
  const dismissedDate = localStorage.getItem('sessionSummaryDismissed')
  if (dismissedDate === new Date().toDateString()) {
    return null
  }

  if (!sessionData || !showSummary) return null

  const { daysSince, lastProgress, lastStats } = sessionData

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">おかえりなさい！</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 経過時間 */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <SafeIcon icon={FiClock} className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {daysSince > 0 
                    ? `${daysSince}日ぶりのログイン`
                    : '久しぶりのログイン'
                  }
                </p>
                <p className="text-xs text-blue-700">
                  前回: {new Date(lastProgress.lastUpdated).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>

            {/* 前回の進捗 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastProgress.completed}
                </div>
                <div className="text-xs text-green-700">完了済み</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {lastProgress.completionRate}%
                </div>
                <div className="text-xs text-purple-700">完了率</div>
              </div>
            </div>

            {/* 生産性情報 */}
            {lastStats && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiTrendingUp} className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">前回の活動</span>
                </div>
                <div className="text-xs text-yellow-800 space-y-1">
                  <p>生産性スコア: {lastStats.productivityScore}</p>
                  <p>連続作業: {lastStats.workStreak}日</p>
                  {lastStats.monthlyCompleted > 0 && (
                    <p>今月の完了: {lastStats.monthlyCompleted}件</p>
                  )}
                </div>
              </div>
            )}

            {/* 励ましメッセージ */}
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-center">
              <SafeIcon icon={FiCheckCircle} className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {daysSince > 7 
                  ? 'お疲れ様でした！新しいスタートを切りましょう'
                  : daysSince > 1
                  ? '継続は力なり！今日も頑張りましょう'
                  : 'いいペースですね！この調子で続けましょう'
                }
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            今日も頑張ります！
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SessionSummary