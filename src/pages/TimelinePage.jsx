import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TimelineView from '../components/timeline/TimelineView'
import TaskForm from '../components/tasks/TaskForm'
import TaskDetailModal from '../components/tasks/TaskDetailModal'

const TimelinePage = () => {
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setShowTaskForm(true)
  }

  const handleCloseModal = () => {
    setSelectedTask(null)
    setShowTaskForm(false)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">タイムライン</h1>
          <p className="text-gray-600 mt-1">
            時系列でタスクを視覚的に管理し、ドラッグ&ドロップで期限を調整できます
          </p>
        </div>
      </motion.div>

      <TimelineView
        onTaskClick={handleTaskClick}
        onEditTask={handleEditTask}
      />

      <AnimatePresence>
        {showTaskForm && (
          <TaskForm
            task={selectedTask}
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

export default TimelinePage