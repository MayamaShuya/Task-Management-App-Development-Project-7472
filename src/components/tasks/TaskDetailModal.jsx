import React from 'react'
import { motion } from 'framer-motion'
import { format, isToday, isPast, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiX, FiCalendar, FiFlag, FiEdit3, FiTrash2, FiCheck, FiClock } from 'react-icons/fi'

const TaskDetailModal = ({ task, onClose, onEdit }) => {
  const { updateTask, deleteTask } = useTask()

  const handleStatusToggle = async () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTask(task.id, { status: newStatus })
  }

  const handleDelete = async () => {
    if (window.confirm('このタスクを削除しますか？')) {
      await deleteTask(task.id)
      onClose()
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '中'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return '完了'
      case 'in_progress': return '進行中'
      default: return '未着手'
    }
  }

  const isDue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isTodayDue = task.due_date && isToday(new Date(task.due_date))

  // 期間タスクの情報を計算
  const getTaskDurationInfo = () => {
    if (!task.start_date || !task.due_date) return null
    
    const startDate = new Date(task.start_date)
    const endDate = new Date(task.due_date)
    const duration = differenceInDays(endDate, startDate) + 1
    
    return {
      startDate,
      endDate,
      duration,
      isMultiDay: duration > 1
    }
  }

  const durationInfo = getTaskDurationInfo()

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">タスク詳細</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* タイトルとステータス */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleStatusToggle}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.status === 'completed' && (
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            {task.description && (
              <p className="text-gray-600">{task.description}</p>
            )}
          </div>

          {/* メタ情報 */}
          <div className="space-y-4">
            {/* 優先度 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <SafeIcon icon={FiFlag} className="w-4 h-4 mr-2" />
                優先度
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {/* ステータス */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">ステータス</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
            </div>

            {/* 期間情報 */}
            {durationInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                    期間
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {format(durationInfo.startDate, 'M月d日(E)', { locale: ja })} - {format(durationInfo.endDate, 'M月d日(E)', { locale: ja })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {durationInfo.duration}日間
                    </div>
                  </div>
                </div>
                {/* 期間表示バー */}
                <div className="bg-gray-100 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ 
                      width: task.status === 'completed' ? '100%' : 
                             task.status === 'in_progress' ? '60%' : '20%'
                    }}
                  />
                </div>
              </div>
            ) : (
              /* 単日タスクの期限 */
              task.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                    期限
                  </span>
                  <div className="text-right">
                    <span className={`text-sm ${
                      isDue ? 'text-red-600' : isTodayDue ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {format(new Date(task.due_date), 'M月d日(E)', { locale: ja })}
                    </span>
                    {(isDue || isTodayDue) && (
                      <div className="flex items-center justify-end mt-1">
                        <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                        <span className="text-xs">
                          {isDue ? '期限切れ' : '今日が期限'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* 作成日 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">作成日</span>
              <span className="text-sm text-gray-600">
                {format(new Date(task.created_at), 'M月d日(E)', { locale: ja })}
              </span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(task)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiEdit3} className="w-4 h-4" />
              <span>編集</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TaskDetailModal