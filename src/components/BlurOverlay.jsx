import React from 'react';
import { motion } from 'framer-motion';

const BlurOverlay = ({ element, intensity = 3, isVisible = true }) => {
  if (!element || !isVisible) return null;

  const rect = element.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  const style = {
    position: 'absolute',
    left: rect.left + scrollX,
    top: rect.top + scrollY,
    width: rect.width,
    height: rect.height,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: `blur(${intensity * 4}px)`,
    borderRadius: '8px',
    pointerEvents: 'none',
    zIndex: 1000
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      style={style}
      className="blur-overlay"
    />
  );
};

export default BlurOverlay;