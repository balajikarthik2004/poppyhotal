import React from 'react';

export default function PoppysLogo({ size = 42, showText = true }) {
  return (
    <div className="poppys-official-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img 
        src="/favicon.png" 
        alt="Poppys Hotels Logo" 
        style={{ width: 150, height:80, flexShrink: 0, borderRadius: '8px', objectFit: 'contain' }} 
      />

      
    </div>
  );
}
