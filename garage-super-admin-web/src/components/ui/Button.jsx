import React from 'react';

// Ensures high-visibility and minimum 24x24 touch target constraints, usually 44px
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
 borderRadius: '6px', /* Minimalist rounding */
 transition: 'all 0.2s',
 cursor: 'pointer',
 border: 'none',
 minHeight: 'var(--touch-target-min)', /* Satisfying target size constraint */
 minWidth: 'var(--touch-target-min)'
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

 // Convert objects to simple inline styles for lack of a CSS-in-JS library, 
 // or we can use standard classes mapped to the index.css variables if we prefer.
 // Given standard React requirements, inline style merging works fine here.
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
