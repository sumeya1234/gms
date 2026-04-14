import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
 return (
 <div 
 className={`card ${className}`} 
 style={{
 backgroundColor: 'var(--bg-main)',
 borderRadius: '8px',
 border: '1px solid var(--border-light)',
 boxShadow: 'var(--shadow-sm)',
 overflow: 'hidden'
 }}
 {...props}
 >
 {children}
 </div>
 );
};

export const CardHeader = ({ children }) => (
 <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
 {children}
 </div>
);

export const CardBody = ({ children }) => (
 <div style={{ padding: '1.5rem' }}>
 {children}
 </div>
);

export const CardTitle = ({ children }) => (
 <h3 style={{ fontSize: 'var(--font-sizes-lg)', fontWeight: '600', margin: 0 }}>
 {children}
 </h3>
);
