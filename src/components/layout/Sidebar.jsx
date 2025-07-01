import React from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import SafeIcon from '../../common/SafeIcon'
import { FiHome, FiCheckSquare, FiCalendar, FiBarChart2, FiSettings, FiClock } from 'react-icons/fi'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { icon: FiHome, label: 'ダッシュボード', path: '/dashboard' },
    { icon: FiCheckSquare, label: 'タスク', path: '/tasks' },
    { icon: FiCalendar, label: 'カレンダー', path: '/calendar' },
    { icon: FiClock, label: 'タイムライン', path: '/timeline' },
    { icon: FiBarChart2, label: '統計', path: '/analytics' },
    { icon: FiSettings, label: '設定', path: '/settings' }
  ]

  return (
    <motion.aside
      className="fixed left-0 top-16 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-40"
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.path}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  )
}

export default Sidebar