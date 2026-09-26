import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  elevated = false,
  ...props
}) => {
  const baseClass = elevated ? 'glass-panel-elevated' : 'glass-card';
  const hoverClass = hoverEffect ? 'glass-card-hover cursor-pointer' : '';

  return (
    <div className={`${baseClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
