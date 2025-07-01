import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiX, FiCalendar, FiFlag, FiAlignLeft, FiClock } from 'react-icons/fi'

const TaskForm = ({ task, initialDate, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [isMultiDay, setIsMultiDay] = useState(!!task?.start_date)
  const { createTask, updateTask } = useTask()

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: task || {
      title: '',
      description: '',
      priority: 'medium',
      due_date: initialDate || '',
      start_date: '',
      status: 'todo'
    }
  })

  const watchedStartDate = watch('start_date')
  const watchedDueDate = watch('due_date')

  // 期間タスクの切り替え
  const handleMultiDayToggle = (enabled) => {
    setIsMultiDay(enabled)
    if (!enabled) {
      setValue('start_date', '')
    } else if (watchedDueDate && !watchedStartDate) {
      setValue('start_date', watchedDueDate)
    }
  }

  // 日付の妥当性チェック
  const validateDates = () => {
    if (isMultiDay && watchedStartDate && watchedDueDate) {
      return new Date(watchedStartDate) <= new Date(watchedDueDate)
    }
    return true
  }

  const onSubmit = async (data) => {
    if (isMultiDay && !validateDates()) {
      alert('開始日は終了日より前に設定してください')
      return
    }

    setLoading(true)
    try {
      const taskData = {
        ...data,
        start_date: isMultiDay ? data.start_date : null
      }

      if (task) {
        await updateTask(task.id, taskData)
      } else {
        await createTask(taskData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const priorityOptions = [
    { value: 'low', label: '低', color: 'text-green-600' },
    { value: 'medium', label: '中', color: 'text-yellow-600' },
    { value: 'high', label: '高', color: 'text-red-600' }
  ]

  const statusOptions = [
    { value: 'todo', label: '未着手' },
    { value: 'in_progress', label: '進行中' },
    { value: 'completed', label: '完了' }
  ]

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'タスクを編集' : '新しいタスク'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* タスク名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'タスク名を入力してください' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="タスク名を入力"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <div className="relative">
              <SafeIcon icon={FiAlignLeft} className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                {...register('description')}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="詳細説明（任意）"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <div className="relative">
                <SafeIcon icon={FiFlag} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  {...register('priority')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ステータス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 期間タスク設定 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">期間タスク</h4>
                <p className="text-sm text-gray-600">複数日にまたがるタスクの場合は有効にしてください</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={(e) => handleMultiDayToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 開始日（期間タスクの場合のみ） */}
            {isMultiDay && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <SafeIcon icon={FiClock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('start_date', { 
                      required: isMultiDay ? '開始日を入力してください' : false 
                    })}
                    type="date"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
            )}

            {/* 期限日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isMultiDay ? '終了日' : '期限日'}
              </label>
              <div className="relative">
                <SafeIcon icon={FiCalendar} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('due_date')}
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 日付妥当性エラー */}
            {isMultiDay && watchedStartDate && watchedDueDate && !validateDates() && (
              <p className="mt-2 text-sm text-red-600">
                開始日は終了日より前に設定してください
              </p>
            )}

            {/* 期間表示 */}
            {isMultiDay && watchedStartDate && watchedDueDate && validateDates() && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                期間: {Math.ceil((new Date(watchedDueDate) - new Date(watchedStartDate)) / (1000 * 60 * 60 * 24) + 1)}日間
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? '保存中...' : task ? '更新' : '作成'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default TaskForm