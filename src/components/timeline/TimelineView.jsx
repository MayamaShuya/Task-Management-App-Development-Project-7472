import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, differenceInDays, parseISO, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTask } from '../../contexts/TaskContext'
import SafeIcon from '../../common/SafeIcon'
import { FiCalendar, FiFlag, FiClock, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiEdit3, FiTarget } from 'react-icons/fi'

const TimelineView = ({ onTaskClick, onEditTask }) => {
  const { tasks, updateTask } = useTask()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState(1) // 1=1週間,2=2週間,0.5=3.5日
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedDate, setDraggedDate] = useState(null)
  const [resizingTask, setResizingTask] = useState(null)
  const [resizeMode, setResizeMode] = useState(null) // 'start' | 'end'
  const [initialMouseX, setInitialMouseX] = useState(0)
  const [hoveredTask, setHoveredTask] = useState(null)
  const timelineRef = useRef(null)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // ズームレベルに応じた日数を計算
  const getVisibleDays = () => {
    const baseDays = Math.floor(7 / zoomLevel)
    const startDate = addDays(weekStart, Math.floor((7 - baseDays) / 2))
    const endDate = addDays(startDate, baseDays - 1)
    return eachDayOfInterval({ start: startDate, end: endDate })
  }

  const visibleDays = getVisibleDays()

  // タスクの期間を計算
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

  // タスクを日付でグループ化（期間タスク対応）
  const groupTasksByDate = () => {
    const grouped = {}
    const spanningTasks = []

    visibleDays.forEach(day => {
      grouped[format(day, 'yyyy-MM-dd')] = []
    })

    tasks.forEach(task => {
      const duration = getTaskDuration(task)
      
      if (duration.isMultiDay) {
        // 複数日にまたがるタスク
        spanningTasks.push({
          ...task,
          duration,
          isSpanning: true
        })
      } else {
        // 単日タスク
        if (task.due_date) {
          const taskDate = format(new Date(task.due_date), 'yyyy-MM-dd')
          if (grouped[taskDate]) {
            grouped[taskDate].push({ 
              ...task, 
              duration,
              isSpanning: false 
            })
          }
        }
      }
    })

    return { grouped, spanningTasks }
  }

  const { grouped: groupedTasks, spanningTasks } = groupTasksByDate()

  // タスクカードのドラッグ開始
  const handleDragStart = (e, task) => {
    if (resizingTask) return
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  // ドロップエリアでのドラッグオーバー
  const handleDragOver = (e, date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedDate(date)
  }

  // タスクのドロップ処理
  const handleDrop = async (e, newDate) => {
    e.preventDefault()
    if (draggedTask && newDate) {
      const newDueDateStr = format(new Date(newDate), 'yyyy-MM-dd')
      
      // 期間タスクの場合は開始日も調整
      if (draggedTask.start_date) {
        const duration = differenceInDays(new Date(draggedTask.due_date), new Date(draggedTask.start_date))
        const newStartDate = format(new Date(newDate), 'yyyy-MM-dd')
        const newEndDate = format(addDays(new Date(newDate), duration), 'yyyy-MM-dd')
        
        await updateTask(draggedTask.id, {
          start_date: newStartDate,
          due_date: newEndDate
        })
      } else {
        await updateTask(draggedTask.id, { due_date: newDueDateStr })
      }
    }
    setDraggedTask(null)
    setDraggedDate(null)
  }

  // リサイズ開始
  const handleResizeStart = (e, task, mode) => {
    e.stopPropagation()
    setResizingTask(task)
    setResizeMode(mode)
    setInitialMouseX(e.clientX)
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX
      const dayWidth = timelineRef.current?.querySelector('.timeline-day')?.offsetWidth || 200
      const daysDelta = Math.round(deltaX / dayWidth)
      
      if (daysDelta !== 0) {
        handleResize(task, mode, daysDelta)
      }
    }

    const handleMouseUp = () => {
      setResizingTask(null)
      setResizeMode(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // リサイズ処理
  const handleResize = async (task, mode, daysDelta) => {
    const duration = getTaskDuration(task)
    const { startDate, endDate } = duration
    
    if (mode === 'end') {
      // 終点を調整（開始日は固定）
      const newEndDate = addDays(endDate, daysDelta)
      if (newEndDate >= startDate) {
        await updateTask(task.id, {
          due_date: format(newEndDate, 'yyyy-MM-dd'),
          start_date: task.start_date || format(startDate, 'yyyy-MM-dd')
        })
      }
    } else if (mode === 'start') {
      // 開始点を調整（終点は固定）
      const newStartDate = addDays(startDate, daysDelta)
      if (newStartDate <= endDate) {
        await updateTask(task.id, {
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          due_date: task.due_date
        })
      }
    }
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDraggedDate(null)
  }

  // 週の移動
  const navigateWeek = (direction) => {
    const daysToMove = Math.floor(7 / zoomLevel) * direction
    setCurrentWeek(prev => addDays(prev, daysToMove))
  }

  // ズームレベルの変更
  const handleZoom = (newZoom) => {
    setZoomLevel(Math.max(0.5, Math.min(3, newZoom)))
  }

  // 今日に移動
  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  // タスクの優先度に応じた色を取得
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800'
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low': return 'bg-green-100 border-green-300 text-green-800'
      default: return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  // ステータスに応じた色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-200 border-green-400'
      case 'in_progress': return 'bg-blue-200 border-blue-400'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  // 期間タスクの表示幅を計算
  const getSpanningTaskStyle = (task) => {
    const { startDate, endDate } = task.duration
    const startIndex = visibleDays.findIndex(day => isSameDay(day, startDate))
    const endIndex = visibleDays.findIndex(day => isSameDay(day, endDate))
    
    if (startIndex === -1 && endIndex === -1) return null
    
    const actualStartIndex = Math.max(0, startIndex === -1 ? 0 : startIndex)
    const actualEndIndex = endIndex === -1 ? visibleDays.length - 1 : Math.min(endIndex, visibleDays.length - 1)
    const width = ((actualEndIndex - actualStartIndex + 1) / visibleDays.length) * 100
    const left = (actualStartIndex / visibleDays.length) * 100
    
    // 継続表示の判定
    const isContinuationLeft = startDate < visibleDays[0]
    const isContinuationRight = endDate > visibleDays[visibleDays.length - 1]
    
    return {
      position: 'absolute',
      left: `${left}%`,
      width: `${width}%`,
      zIndex: 10,
      isContinuationLeft,
      isContinuationRight
    }
  }

  // 進捗率を計算
  const calculateProgress = (task) => {
    if (task.status === 'completed') return 100
    if (task.status === 'todo') return 0
    
    // 進行中の場合は経過日数から推定
    const { startDate, endDate, days } = task.duration
    const today = new Date()
    
    if (today < startDate) return 0
    if (today > endDate) return 100
    
    const elapsedDays = differenceInDays(today, startDate) + 1
    return Math.min(Math.round((elapsedDays / days) * 100), 100)
  }

  return (
    <div className="space-y-6">
      {/* タイムラインヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">タイムライン</h2>
            <div className="text-sm text-gray-600">
              {format(visibleDays[0], 'M月d日', { locale: ja })} - {format(visibleDays[visibleDays.length - 1], 'M月d日', { locale: ja })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* ズームコントロール */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleZoom(zoomLevel - 0.5)}
                className="p-2 rounded-md hover:bg-white transition-colors"
                disabled={zoomLevel <= 0.5}
              >
                <SafeIcon icon={FiZoomOut} className="w-4 h-4 text-gray-600" />
              </motion.button>
              <span className="px-2 text-sm text-gray-600">
                {zoomLevel === 0.5 ? '3.5日' : zoomLevel === 1 ? '7日' : zoomLevel === 1.5 ? '1.5週' : '2週'}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleZoom(zoomLevel + 0.5)}
                className="p-2 rounded-md hover:bg-white transition-colors"
                disabled={zoomLevel >= 3}
              >
                <SafeIcon icon={FiZoomIn} className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>

            {/* ナビゲーション */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SafeIcon icon={FiChevronLeft} className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              今日
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek(1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SafeIcon icon={FiChevronRight} className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">
              {spanningTasks.length}
            </div>
            <div className="text-xs text-purple-700">期間タスク</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              {Object.values(groupedTasks).flat().length}
            </div>
            <div className="text-xs text-blue-700">単日タスク</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {spanningTasks.filter(t => t.status === 'completed').length + Object.values(groupedTasks).flat().filter(t => t.status === 'completed').length}
            </div>
            <div className="text-xs text-green-700">完了済み</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">
              {spanningTasks.filter(t => t.status === 'in_progress').length + Object.values(groupedTasks).flat().filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-xs text-yellow-700">進行中</div>
          </div>
        </div>

        {/* 操作ヒント */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 期間タスクをドラッグで移動、端をドラッグで期間調整。進捗バーで現在の状況を確認できます。
          </p>
        </div>
      </div>

      {/* タイムライン本体 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div ref={timelineRef} className="relative">
          {/* 期間タスク表示レイヤー */}
          <div className="relative mb-4 border-b border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                  期間タスク ({spanningTasks.length}件)
                </h3>
                {spanningTasks.length > 0 && (
                  <div className="text-xs text-gray-500">
                    期間合計: {spanningTasks.reduce((sum, task) => sum + task.duration.days, 0)}日
                  </div>
                )}
              </div>
              
              <div className="relative min-h-[120px]">
                {/* 日付ガイドライン */}
                <div className="flex h-8 border-b border-gray-100 mb-2">
                  {visibleDays.map(day => (
                    <div key={format(day, 'yyyy-MM-dd')} className="flex-1 text-center">
                      <span className="text-xs text-gray-400">
                        {format(day, 'd', { locale: ja })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 期間タスク */}
                {spanningTasks.map((task, index) => {
                  const style = getSpanningTaskStyle(task)
                  if (!style) return null

                  const progress = calculateProgress(task)

                  return (
                    <motion.div
                      key={task.id}
                      style={{ ...style, top: `${index * 60 + 10}px` }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group"
                    >
                      {/* メインタスクバー */}
                      <div
                        className={`h-12 rounded-lg border-2 cursor-move transition-all hover:shadow-lg ${getPriorityColor(task.priority)} ${getStatusColor(task.status)} ${task.status === 'completed' ? 'opacity-75' : ''} ${draggedTask?.id === task.id ? 'opacity-50 scale-105' : ''} relative overflow-hidden`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onTaskClick && onTaskClick(task)}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        title={`${task.title} (${format(task.duration.startDate, 'M/d')} - ${format(task.duration.endDate, 'M/d')})`}
                      >
                        {/* 進捗バー */}
                        <div 
                          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 transition-all"
                          style={{ width: `${progress}%` }}
                        />

                        {/* 継続矢印 - 左 */}
                        {style.isContinuationLeft && (
                          <div className="absolute left-0 top-0 w-0 h-0 border-t-6 border-b-6 border-r-8 border-transparent border-r-current opacity-70" />
                        )}

                        {/* リサイズハンドル - 開始 */}
                        <div
                          className="absolute left-0 top-0 w-3 h-full bg-blue-600 rounded-l-lg cursor-w-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => handleResizeStart(e, task, 'start')}
                          title="開始日を調整"
                        />

                        {/* タスク内容 */}
                        <div className="px-3 py-2 h-full flex items-center justify-between relative z-10">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="text-xs text-gray-600 flex items-center space-x-2">
                              <span className="flex items-center">
                                <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                                {format(task.duration.startDate, 'M/d', { locale: ja })} - {format(task.duration.endDate, 'M/d', { locale: ja })}
                              </span>
                              <span className="bg-black bg-opacity-20 px-1 rounded">
                                {task.duration.days}日
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* 進捗率表示 */}
                            <div className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                              {progress}%
                            </div>
                            
                            <SafeIcon icon={FiFlag} className="w-3 h-3" />
                            
                            {hoveredTask === task.id && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditTask && onEditTask(task)
                                }}
                                className="p-1 rounded bg-white/80 hover:bg-white transition-colors"
                              >
                                <SafeIcon icon={FiEdit3} className="w-3 h-3 text-gray-600" />
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* リサイズハンドル - 終了 */}
                        <div
                          className="absolute right-0 top-0 w-3 h-full bg-red-600 rounded-r-lg cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => handleResizeStart(e, task, 'end')}
                          title="終了日を調整"
                        />

                        {/* 継続矢印 - 右 */}
                        {style.isContinuationRight && (
                          <div className="absolute right-0 top-0 w-0 h-0 border-t-6 border-b-6 border-l-8 border-transparent border-l-current opacity-70" />
                        )}
                      </div>

                      {/* タスク詳細情報（ホバー時表示） */}
                      {hoveredTask === task.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-14 left-0 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-20 min-w-[200px]"
                        >
                          <div className="space-y-1">
                            <div><strong>{task.title}</strong></div>
                            <div>期間: {task.duration.days}日</div>
                            <div>進捗: {progress}%</div>
                            <div>優先度: {task.priority}</div>
                            {task.description && (
                              <div className="text-gray-300 max-w-xs truncate">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}

                {/* 期間タスクがない場合 */}
                {spanningTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <SafeIcon icon={FiTarget} className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">期間タスクはありません</p>
                    <p className="text-xs">複数日にまたがるタスクを作成してください</p>
                  </div>
                )}
                
                {/* スペーサー */}
                <div style={{ height: `${Math.max(spanningTasks.length * 60, 40)}px` }} />
              </div>
            </div>
          </div>

          {/* 単日タスク表示グリッド */}
          <div className="flex min-h-[400px]">
            {visibleDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayTasks = groupedTasks[dayKey] || []
              const isCurrentDay = isToday(day)
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const isDragTarget = draggedDate === dayKey

              return (
                <div
                  key={dayKey}
                  className={`timeline-day flex-1 min-w-0 border-r border-gray-200 ${
                    isCurrentDay ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
                  } ${isDragTarget ? 'bg-blue-100 ring-2 ring-blue-300' : ''} transition-all`}
                  onDragOver={(e) => handleDragOver(e, dayKey)}
                  onDrop={(e) => handleDrop(e, dayKey)}
                  onDragLeave={() => setDraggedDate(null)}
                >
                  {/* 日付ヘッダー */}
                  <div className={`p-4 border-b border-gray-200 text-center ${isCurrentDay ? 'bg-blue-100' : ''}`}>
                    <div className="text-xs text-gray-500 mb-1">
                      {format(day, 'E', { locale: ja })}
                    </div>
                    <div className={`text-lg font-semibold ${
                      isCurrentDay ? 'text-blue-600 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mx-auto' : 
                      isWeekend ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {dayTasks.length}件
                      </div>
                    )}
                  </div>

                  {/* 単日タスクリスト */}
                  <div className="p-2 space-y-2 min-h-[350px]">
                    <AnimatePresence>
                      {dayTasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: taskIndex * 0.05 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onTaskClick && onTaskClick(task)}
                          className={`p-3 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${getPriorityColor(task.priority)} ${getStatusColor(task.status)} ${task.status === 'completed' ? 'opacity-75' : ''} ${draggedTask?.id === task.id ? 'opacity-50 rotate-3 scale-105' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.title}
                            </h4>
                            <SafeIcon icon={FiFlag} className="w-3 h-3 flex-shrink-0 ml-1" />
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-1 rounded ${
                              task.status === 'completed' ? 'bg-green-200 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {task.status === 'completed' ? '完了' :
                               task.status === 'in_progress' ? '進行中' : '未着手'}
                            </span>
                            <div className="flex items-center text-gray-500">
                              <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                              <span>{format(new Date(task.created_at), 'HH:mm')}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* 空の日のドロップゾーン */}
                    {dayTasks.length === 0 && (
                      <div className={`flex-1 min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 transition-all ${
                        isDragTarget ? 'border-blue-400 bg-blue-50 text-blue-600' : 'hover:border-gray-400'
                      }`}>
                        <div className="text-center">
                          <SafeIcon icon={FiCalendar} className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">
                            {isDragTarget ? 'ここにドロップ' : 'タスクなし'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineView