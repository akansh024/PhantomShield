import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, title, className = '', headerAction, noPadding = false, glow = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl overflow-hidden relative ${glow ? 'shadow-[0_4px_30px_rgba(0,255,170,0.05)]' : ''} ${className}`}
    >
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-black/10">
          {title && <h3 className="font-semibold text-gray-200 tracking-wide text-sm">{title}</h3>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-5'}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
