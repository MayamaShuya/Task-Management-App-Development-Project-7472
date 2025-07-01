import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format, isToday, isPast } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiCalendar, FiFlag, FiEdit3, FiTrash2, FiCheck } = FiIcons

const TaskCard = ({ task, onEdit, onClick, index }) => {
  const [loading, setLoading] = useState(false)
  const { updateTask, deleteTask } = useTask()

  const handleStatusChange = async (e) => {
    e.stopPropagation()
    setLoading(true)
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTask(task.id, { status: newStatus })
    setLoading(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm('このタスクを削除しますか？')) {
      await deleteTask(task.id)
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(task)
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
      case 'completed': return 'bg-green-100 border-green-200'
      case 'in_progress': return 'bg-blue-100 border-blue-200'
      default: return 'bg-white border-gray-200'
    }
  }

  const isDue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isTodayDue = task.due_date && isToday(new Date(task.due_date))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${getStatusColor(task.status)} ${
        task.status === 'completed' ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleStatusChange}
            disabled={loading}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.status === 'completed' && (
              <SafeIcon icon={FiCheck} className="w-3 h-3" />
            )}
          </motion.button>
          
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${
              task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-gray-600 mt-1 text-sm line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </div>

      {/* メタ情報 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {task.due_date && (
            <div className="flex items-center space-x-1 text-sm">
              <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
              <span className={`${
                isDue ? 'text-red-600' : isTodayDue ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {format(new Date(task.due_date), 'M/d', { locale: ja })}
                {isDue && ' (期限切れ)'}
                {isTodayDue && ' (今日)'}
              </span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            {format(new Date(task.created_at), 'M/d作成', { locale: ja })}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEdit}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiEdit3} className="w-4 h-4 text-gray-500" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="w-4 h-4 text-red-500" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default TaskCard