import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskCalendar from '../components/calendar/TaskCalendar'
import TaskForm from '../components/tasks/TaskForm'
import TaskDetailModal from '../components/tasks/TaskDetailModal'
import CalendarSyncButton from '../components/calendar/CalendarSyncButton'

const CalendarPage = () => {
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleAddTask = (date) => {
    setSelectedDate(date)
    setShowTaskForm(true)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setShowTaskForm(true)
  }

  const handleCloseModal = () => {
    setSelectedTask(null)
    setShowTaskForm(false)
    setSelectedDate(null)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">カレンダー</h1>
          <p className="text-gray-600 mt-1">
            タスクをカレンダー形式で確認・管理できます
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <CalendarSyncButton />
        </div>
      </motion.div>

      <TaskCalendar 
        onTaskClick={handleTaskClick} 
        onAddTask={handleAddTask} 
      />

      <AnimatePresence>
        {showTaskForm && (
          <TaskForm
            task={selectedTask}
            initialDate={selectedDate}
            onClose={handleCloseModal}
          />
        )}
        
        {selectedTask && !showTaskForm && (
          <TaskDetailModal
            task={selectedTask}
            onClose={handleCloseModal}
            onEdit={handleEditTask}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarPage