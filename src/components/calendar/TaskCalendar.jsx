import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, differenceInDays, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiCalendar } from 'react-icons/fi'

const TaskCalendar = ({ onTaskClick, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { tasks } = useTask()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // タスクの期間情報を計算
  const getTaskDuration = (task) => {
    if (!task.due_date) return { days: 1, startDate: new Date(task.created_at), endDate: new Date(task.created_at), isMultiDay: false }
    
    const startDate = task.start_date ? new Date(task.start_date) : new Date(task.created_at)
    const endDate = new Date(task.due_date)
    const days = Math.max(1, differenceInDays(endDate, startDate) + 1)
    
    return { 
      days, 
      startDate, 
      endDate, 
      isMultiDay: days > 1 && task.start_date 
    }
  }

  // 期間タスクとカレンダー表示用データを分離
  const { spanningTasks, dailyTasks } = useMemo(() => {
    const spanning = []
    const daily = {}

    // 日付キーで初期化
    calendarDays.forEach(day => {
      daily[format(day, 'yyyy-MM-dd')] = []
    })

    tasks.forEach(task => {
      const duration = getTaskDuration(task)
      
      if (duration.isMultiDay) {
        // 期間タスクとして処理
        spanning.push({
          ...task,
          duration
        })
      } else {
        // 単日タスクとして処理
        if (task.due_date) {
          const taskDate = format(new Date(task.due_date), 'yyyy-MM-dd')
          if (daily[taskDate]) {
            daily[taskDate].push({
              ...task,
              duration
            })
          }
        }
      }
    })

    return { spanningTasks: spanning, dailyTasks: daily }
  }, [tasks, calendarDays])

  // 期間タスクがカレンダーの週に表示されるかチェック
  const getSpanningTasksForWeek = (weekStart, weekEnd) => {
    return spanningTasks.filter(task => {
      const { startDate, endDate } = task.duration
      return (
        (startDate >= weekStart && startDate <= weekEnd) ||
        (endDate >= weekStart && endDate <= weekEnd) ||
        (startDate <= weekStart && endDate >= weekEnd)
      )
    })
  }

  // 期間タスクの表示位置とスタイルを計算
  const getSpanningTaskStyle = (task, weekStart, weekEnd, weekDays) => {
    const { startDate, endDate } = task.duration
    
    // 週内での開始・終了インデックス
    const startIndex = weekDays.findIndex(day => isSameDay(day, startDate))
    const endIndex = weekDays.findIndex(day => isSameDay(day, endDate))
    
    // 実際の表示範囲を計算
    const displayStartIndex = Math.max(0, startIndex === -1 ? 0 : startIndex)
    const displayEndIndex = endIndex === -1 ? weekDays.length - 1 : Math.min(endIndex, weekDays.length - 1)
    
    const width = ((displayEndIndex - displayStartIndex + 1) / weekDays.length) * 100
    const left = (displayStartIndex / weekDays.length) * 100
    
    // タスクが週の範囲を超えているかチェック
    const isContinuationLeft = startDate < weekStart
    const isContinuationRight = endDate > weekEnd
    
    return {
      width: `${width}%`,
      left: `${left}%`,
      isContinuationLeft,
      isContinuationRight
    }
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // カレンダーを週ごとに分割
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  // 優先度に応じた色を取得
  const getPriorityColor = (priority, isCompleted = false) => {
    if (isCompleted) return 'bg-green-500 text-white'
    
    switch (priority) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* カレンダーヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </h2>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <SafeIcon icon={FiChevronLeft} className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
            >
              今日
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <SafeIcon icon={FiChevronRight} className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {/* 期間タスクの凡例 */}
        {spanningTasks.length > 0 && (
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiCalendar} className="w-4 h-4" />
              <span>期間タスク: {spanningTasks.length}件</span>
            </div>
            <div className="text-blue-200 text-xs">
              ※ 横断バーで期間を表示
            </div>
          </div>
        )}
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            } bg-gray-50`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="relative">
        {weeks.map((week, weekIndex) => {
          const weekStart = week[0]
          const weekEnd = week[6]
          const weekSpanningTasks = getSpanningTasksForWeek(weekStart, weekEnd)

          return (
            <div key={weekIndex} className="relative">
              {/* 期間タスクバー（週の上部に表示） */}
              {weekSpanningTasks.length > 0 && (
                <div className="relative bg-gray-50 border-b border-gray-100 p-2 space-y-1">
                  {weekSpanningTasks.map((task, taskIndex) => {
                    const style = getSpanningTaskStyle(task, weekStart, weekEnd, week)
                    
                    return (
                      <motion.div
                        key={`${task.id}-${weekIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: taskIndex * 0.1 }}
                        className={`relative h-6 rounded-md text-xs font-medium flex items-center cursor-pointer hover:shadow-md transition-all ${getPriorityColor(task.priority, task.status === 'completed')}`}
                        style={{
                          width: style.width,
                          left: style.left,
                          position: 'absolute',
                          top: `${taskIndex * 28}px`,
                          zIndex: 10
                        }}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        title={`${task.title} (${format(task.duration.startDate, 'M/d')} - ${format(task.duration.endDate, 'M/d')})`}
                      >
                        {/* 継続表示の矢印 */}
                        {style.isContinuationLeft && (
                          <div className="absolute left-0 top-0 w-0 h-0 border-t-3 border-b-3 border-r-4 border-transparent border-r-current opacity-60" />
                        )}
                        
                        <div className="flex-1 px-2 truncate flex items-center">
                          <SafeIcon icon={FiClock} className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className={task.status === 'completed' ? 'line-through' : ''}>
                            {task.title}
                          </span>
                        </div>
                        
                        {/* 期間情報バッジ */}
                        <div className="bg-black bg-opacity-20 px-1 rounded text-xs mr-1">
                          {task.duration.days}日
                        </div>
                        
                        {style.isContinuationRight && (
                          <div className="absolute right-0 top-0 w-0 h-0 border-t-3 border-b-3 border-l-4 border-transparent border-l-current opacity-60" />
                        )}
                      </motion.div>
                    )
                  })}
                  
                  {/* 期間タスクエリアの高さ調整 */}
                  <div style={{ height: `${Math.max(weekSpanningTasks.length * 28 - 4, 24)}px` }} />
                </div>
              )}

              {/* 日付セル */}
              <div className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayTasks = dailyTasks[dayKey] || []
                  const isCurrentDay = isToday(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6

                  return (
                    <motion.div
                      key={day.toISOString()}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: dayIndex * 0.005 }}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                        !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                      } ${isCurrentDay ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => onAddTask && onAddTask(format(day, 'yyyy-MM-dd'))}
                    >
                      {/* 日付 */}
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isCurrentDay ? 'text-blue-600 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' :
                          !isCurrentMonth ? 'text-gray-400' :
                          isWeekend ? (day.getDay() === 0 ? 'text-red-600' : 'text-blue-600') : 'text-gray-900'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* 単日タスク表示 */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map(task => (
                          <motion.div
                            key={task.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskClick && onTaskClick(task)
                            }}
                            className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800 line-through' :
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </motion.div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayTasks.length - 3}件
                          </div>
                        )}
                      </div>

                      {/* 追加ボタン（ホバー時表示） */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute bottom-1 right-1 opacity-0 hover:opacity-100"
                      >
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiPlus} className="w-3 h-3" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 期間タスクの説明 */}
      {spanningTasks.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon icon={FiCalendar} className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">期間タスクの説明</span>
          </div>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• 横断バーは複数日にまたがるタスクを表示</p>
            <p>• バーの色は優先度を示します（赤=高、黄=中、青=低）</p>
            <p>• 矢印は期間が週をまたいで継続することを示します</p>
            <p>• 数字は総日数を表示します</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default TaskCalendar