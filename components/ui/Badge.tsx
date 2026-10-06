import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'white' | 'yellow' | 'sage' | 'dark' | 'danger' | 'success';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'white', children, ...props }, ref) => {
    const variantClass = variant !== 'white' ? `neo-badge--${variant}` : '';

    return (
      <span
        ref={ref}
        className={`neo-badge ${variantClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
