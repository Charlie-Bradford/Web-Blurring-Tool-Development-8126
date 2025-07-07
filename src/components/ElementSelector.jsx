import React, { useEffect, useState } from 'react';

const ElementSelector = ({ onElementSelect, isActive }) => {
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e) => {
      const element = e.target;
      if (element && element !== document.body && element !== document.documentElement) {
        // Remove previous highlights
        document.querySelectorAll('.webblur-highlight').forEach(el => {
          el.classList.remove('webblur-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('webblur-highlight');
        setHoveredElement(element);
      }
    };

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      if (element && element !== document.body && element !== document.documentElement) {
        onElementSelect(element);
        element.classList.add('webblur-selected');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Clean up highlights
        document.querySelectorAll('.webblur-highlight').forEach(el => {
          el.classList.remove('webblur-highlight');
        });
        setHoveredElement(null);
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    // Add selection mode class to body
    document.body.classList.add('webblur-selection-mode');

    return () => {
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('webblur-selection-mode');
      
      // Remove all highlights
      document.querySelectorAll('.webblur-highlight').forEach(el => {
        el.classList.remove('webblur-highlight');
      });
    };
  }, [isActive, onElementSelect]);

  return null;
};

export default ElementSelector;