import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SafeIcon from '../../common/SafeIcon'
import { FiBell, FiUser, FiLogOut } from 'react-icons/fi'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const demoUser = JSON.parse(localStorage.getItem('demo-user') || 'null')
  const currentUser = user || demoUser

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.header 
      className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <SafeIcon icon={FiBell} className="w-5 h-5 text-gray-600" />
          </motion.button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiUser} className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {currentUser?.email?.split('@')[0] || currentUser?.full_name || 'User'}
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
          >
            <SafeIcon icon={FiLogOut} className="w-5 h-5 text-red-600" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}

export default Header