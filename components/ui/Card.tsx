import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'yellow' | 'sage' | 'dark';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'white', children, ...props }, ref) => {
    const variantClass = variant !== 'white' ? `neo-card--${variant}` : '';

    return (
      <div
        ref={ref}
        className={`neo-card ${variantClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
