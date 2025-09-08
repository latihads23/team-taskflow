
import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '../types';
import { InfoIcon, CheckCircleIcon, WarningIcon } from './Icons';

const toastConfig = {
  info: {
    icon: <InfoIcon className="h-5 w-5 text-blue-500" />,
    bg: 'bg-blue-50 border-blue-200',
  },
  success: {
    icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    bg: 'bg-green-50 border-green-200',
  },
  warning: {
    icon: <WarningIcon className="h-5 w-5 text-yellow-500" />,
    bg: 'bg-yellow-50 border-yellow-200',
  },
};

const Toast: React.FC<ToastType> = ({ message, type }) => {
  const [visible, setVisible] = useState(false);
  const config = toastConfig[type];

  useEffect(() => {
    setVisible(true); // Trigger fade-in animation on mount
  }, []);

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg shadow-lg border ${config.bg} transition-all duration-300 ease-in-out transform ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
      <div className="flex-shrink-0">{config.icon}</div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  );
};

export default Toast;
