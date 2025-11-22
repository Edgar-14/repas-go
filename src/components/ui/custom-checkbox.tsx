'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  className = ''
}) => {
  const handleClick = () => {
    onCheckedChange(!checked);
  };

  return (
    <div 
      className={`checkbox-wrapper ${className}`} 
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        padding: '10px'
      }}
    >
      <div 
        className="checkmark"
        style={{
          position: 'relative',
          width: '25px',
          height: '25px',
          border: checked ? '2px solid #00ff88' : '2px solid rgba(0, 255, 136, 0.7)',
          borderRadius: '8px',
          transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: checked ? 'linear-gradient(45deg, #00ff88, #00ffcc)' : 'rgba(0, 0, 0, 0.2)',
          boxShadow: checked ? '0 0 20px rgba(0, 255, 136, 0.3)' : '0 0 15px rgba(0, 255, 136, 0.3)',
          overflow: 'hidden'
        }}
      >
        {checked && (
          <Check 
            style={{
              width: '18px',
              height: '18px',
              color: '#1a1a1a',
              zIndex: 1,
              filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))'
            }}
          />
        )}
      </div>
      {label && (
        <span 
          className="label"
          style={{
            marginLeft: '15px',
            fontFamily: 'Segoe UI, sans-serif',
            color: '#00ff88',
            fontSize: '18px',
            textShadow: '0 0 10px rgba(0, 255, 136, 0.3)',
            opacity: 0.9,
            transition: 'all 0.3s',
            cursor: 'pointer'
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
