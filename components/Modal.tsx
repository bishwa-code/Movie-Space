import React, { useEffect } from 'react';
import { ICONS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  fullScreen?: boolean;
}

const Modal: React.FC<Props> = ({ isOpen, onClose, children, title, fullScreen = false }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className={`bg-space-dark border border-white/10 w-full ${fullScreen ? 'h-[95vh] max-w-6xl' : 'max-w-2xl max-h-[90vh]'} rounded-2xl overflow-hidden flex flex-col shadow-2xl relative animate-slide-up`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-space-black/50">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ICONS.X size={24} className="text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;