import React from 'react'
import { motion } from 'framer-motion'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <motion.main 
          className="flex-1 p-6 ml-64"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pt-16">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}

export default Layout