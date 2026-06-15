import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'cyan';
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  className
}) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-700',
    accent: 'from-accent-orange to-orange-600',
    success: 'from-green-500 to-green-700',
    warning: 'from-yellow-500 to-amber-600',
    danger: 'from-red-500 to-red-700',
    cyan: 'from-accent-cyan to-cyan-600'
  };

  const bgColorClasses = {
    primary: 'bg-primary-50',
    accent: 'bg-orange-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
    cyan: 'bg-cyan-50'
  };

  const iconColorClasses = {
    primary: 'text-primary-600',
    accent: 'text-accent-orange',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    cyan: 'text-accent-cyan'
  };

  return (
    <div className={cn(
      'card p-5 hover:shadow-xl transition-all duration-300 group',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 number-scroll">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-500'
            )}>
              {trend.isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 text-xs">较昨日</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
          'group-hover:scale-110 group-hover:rotate-3',
          bgColorClasses[color]
        )}>
          <Icon className={cn('w-6 h-6', iconColorClasses[color])} />
        </div>
      </div>

      <div className={cn(
        'mt-4 h-1 rounded-full overflow-hidden',
        bgColorClasses[color]
      )}>
        <div 
          className={cn(
            'h-full rounded-full bg-gradient-to-r animate-pulse-slow',
            colorClasses[color]
          )}
          style={{ width: `${60 + Math.random() * 35}%` }}
        />
      </div>
    </div>
  );
};

export default KPICard;
