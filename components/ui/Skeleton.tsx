import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-zinc-250 dark:bg-zinc-800';
  
  const variants = {
    text: 'h-4 rounded w-3/4',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  };

  const customStyle: React.CSSProperties = {
    ...style,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};
