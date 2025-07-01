import React from 'react';
import {
  FiAlertTriangle,
  FiHome,
  FiCheckSquare,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiUser,
  FiLogOut,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiPlus,
  FiUsers,
  FiArrowRight,
  FiCheck,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiEdit3,
  FiTrash2,
  FiX,
  FiAlignLeft,
  FiFilter,
  FiSearch,
  FiList,
  FiGrid,
  FiMoon,
  FiSun,
  FiSave,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiActivity,
  FiAward,
  FiAlertCircle
} from 'react-icons/fi';

// アイコンマップ - 利用可能なアイコンのみ
const iconMap = {
  FiAlertTriangle,
  FiHome,
  FiCheckSquare,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiUser,
  FiLogOut,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiPlus,
  FiUsers,
  FiArrowRight,
  FiCheck,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiEdit3,
  FiTrash2,
  FiX,
  FiAlignLeft,
  FiFilter,
  FiSearch,
  FiList,
  FiGrid,
  FiMoon,
  FiSun,
  FiSave,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiActivity,
  FiAward,
  FiAlertCircle
};

const SafeIcon = ({ icon: IconComponent, name, className, ...props }) => {
  if (IconComponent && typeof IconComponent === 'function') {
    return <IconComponent className={className} {...props} />;
  }

  if (name && iconMap[`Fi${name}`]) {
    const Icon = iconMap[`Fi${name}`];
    return <Icon className={className} {...props} />;
  }

  return <FiAlertTriangle className={className} {...props} />;
};

export default SafeIcon;