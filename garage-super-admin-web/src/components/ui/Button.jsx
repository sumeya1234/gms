import React from 'react';


export const Button = ({ 
 children, 
 variant = 'primary', 
 size = 'md', 
 className = '', 
 ...props 
}) => {
 const baseStyles = {
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: '500',
 borderRadius: '6px',  transition: 'all 0.2s',
 cursor: 'pointer',
 border: 'none',
 minHeight: 'var(--touch-target-min)',  minWidth: 'var(--touch-target-min)'
 };

 const variants = {
 primary: {
 backgroundColor: 'var(--primary-600)',
 color: 'white',
 border: '1px solid var(--primary-700)'
 },
 secondary: {
 backgroundColor: 'white',
 color: 'var(--primary-600)',
 border: '1px solid var(--border-strong)'
 },
 danger: {
 backgroundColor: 'var(--danger-500)',
 color: 'white',
 },
 outline: {
 backgroundColor: 'transparent',
 color: 'var(--text-main)',
 border: '1px solid var(--border-light)'
 }
 };

 const sizes = {
 sm: { padding: '0.5rem 1rem', fontSize: 'var(--font-sizes-sm)' },
 md: { padding: '0.75rem 1.5rem', fontSize: 'var(--font-sizes-base)' },
 lg: { padding: '1rem 2rem', fontSize: 'var(--font-sizes-lg)' },
 };

 
 
 
 const style = {
 ...baseStyles,
 ...variants[variant],
 ...sizes[size]
 };

 return (
 <button 
 style={style} 
 className={`focus-ring ${className}`}
 {...props}
 >
 {children}
 </button>
 );
};
