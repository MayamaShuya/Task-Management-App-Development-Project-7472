import React from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'

const ProgressComparison = ({ current, previous, label }) => {
  if (!previous && previous !== 0) return null

  const difference = current - previous
  const percentageChange = previous > 0 ? Math.round((difference / previous) * 100) : 0
  
  const getIcon = () => {
    if (difference > 0) return FiTrendingUp
    if (difference < 0) return FiTrendingDown
    return FiMinus
  }

  const getColor = () => {
    if (difference > 0) return 'text-green-600'
    if (difference < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getBgColor = () => {
    if (difference > 0) return 'bg-green-50'
    if (difference < 0) return 'bg-red-50'
    return 'bg-gray-50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getBgColor()} ${getColor()}`}
    >
      <SafeIcon icon={getIcon()} className="w-3 h-3" />
      <span>
        {difference > 0 ? '+' : ''}{difference}
        {percentageChange !== 0 && ` (${percentageChange > 0 ? '+' : ''}${percentageChange}%)`}
      </span>
    </motion.div>
  )
}

export default ProgressComparison