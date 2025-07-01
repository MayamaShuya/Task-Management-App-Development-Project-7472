import React from 'react'
import { motion } from 'framer-motion'

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分析</h1>
          <p className="text-gray-600 mt-1">
            タスクの進捗状況と生産性を可視化します
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          分析機能
        </h3>
        <p className="text-gray-500">
          この機能は現在開発中です。デモでは基本的な表示のみ可能です。
        </p>
      </motion.div>
    </div>
  )
}

export default AnalyticsPage