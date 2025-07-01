import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import { FiCalendar, FiRefreshCw } from 'react-icons/fi'
import CalendarIntegrationModal from './CalendarIntegrationModal'

const CalendarSyncButton = ({ className = "" }) => {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${className}`}
      >
        <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
        <span>カレンダー連携</span>
      </motion.button>

      <CalendarIntegrationModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

export default CalendarSyncButton