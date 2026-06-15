import React from 'react';
import { SimulationStatus, AlertType, AlertLevel, UserRole } from '@/types';
import {
  Clock,
  Layers,
  Droplets,
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Settings,
  Eye,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusColor, getAlertLevelColor } from '@/utils';

interface StatusBadgeProps {
  status: SimulationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const colorClass = getStatusColor(status as SimulationStatus);

  const getIcon = () => {
    switch (status) {
      case SimulationStatus.PENDING_VERIFICATION:
        return <Clock size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.MESHING:
        return <Layers size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.TWO_PHASE_FLOW:
        return <Droplets size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.MASS_TRANSFER:
        return <FlaskConical size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.EFFICIENCY_EVALUATION:
        return <TrendingUp size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.COMPLETED:
        return <CheckCircle2 size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.ABNORMAL_ROLLBACK:
        return <AlertTriangle size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.PAUSED:
        return <PauseCircle size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case SimulationStatus.CANCELLED:
        return <XCircle size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      default:
        return <Loader2 size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className="animate-spin" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span className={cn(
      'status-badge',
      colorClass,
      sizeClasses[size],
      'inline-flex items-center font-medium',
      className
    )}>
      {showIcon && getIcon()}
      {status}
    </span>
  );
};

interface AlertBadgeProps {
  type: AlertType;
  level: AlertLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  type,
  level,
  size = 'md',
  showIcon = true,
  className
}) => {
  const colorClass = getAlertLevelColor(level);

  const getIcon = () => {
    switch (level) {
      case AlertLevel.CRITICAL:
        return <Flame size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case AlertLevel.DANGER:
        return <ShieldAlert size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case AlertLevel.WARNING:
        return <AlertTriangle size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case AlertLevel.INFO:
      default:
        return <Eye size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const getLabel = () => {
    switch (type) {
      case AlertType.LOW_EFFICIENCY:
      case AlertType.EXTRACTION_RATE_LOW:
        return '萃取率偏低';
      case AlertType.EMULSIFICATION:
        return '严重乳化';
      case AlertType.DEVIATION:
      case AlertType.DEVIATION_HIGH:
        return '偏差超标';
      case AlertType.CONVERGENCE:
      case AlertType.CONVERGENCE_FAILED:
        return '收敛异常';
      case AlertType.MASS_BALANCE:
        return '质量不守恒';
      default:
        return type;
    }
  };

  return (
    <span className={cn(
      'status-badge',
      colorClass,
      sizeClasses[size],
      'inline-flex items-center font-medium',
      className
    )}>
      {showIcon && getIcon()}
      {getLabel()}
    </span>
  );
};

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getColorClass = () => {
    switch (role) {
      case UserRole.ENGINEER:
        return 'status-badge-info';
      case UserRole.PROCESS_ENGINEER:
        return 'status-badge-success';
      case UserRole.CHIEF_ENGINEER:
        return 'status-badge-accent';
      case UserRole.CHIEF_SCIENTIST:
        return 'status-badge-danger';
      case UserRole.DESIGN_TEAM:
        return 'status-badge-warning';
      case UserRole.ADMIN:
        return 'status-badge-neutral';
      default:
        return 'status-badge-neutral';
    }
  };

  const getIcon = () => {
    switch (role) {
      case UserRole.ENGINEER:
        return <FlaskConical size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case UserRole.PROCESS_ENGINEER:
        return <Settings size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case UserRole.CHIEF_ENGINEER:
        return <ShieldCheck size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case UserRole.CHIEF_SCIENTIST:
        return <UserCog size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case UserRole.DESIGN_TEAM:
        return <Eye size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      case UserRole.ADMIN:
        return <UserCog size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
      default:
        return <UserCog size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />;
    }
  };

  const getLabel = () => {
    switch (role) {
      case UserRole.ENGINEER:
        return '湿法冶金工程师';
      case UserRole.PROCESS_ENGINEER:
        return '工艺工程师';
      case UserRole.CHIEF_ENGINEER:
        return '总工程师';
      case UserRole.CHIEF_SCIENTIST:
        return '首席科学家';
      case UserRole.DESIGN_TEAM:
        return '萃箱设计组';
      case UserRole.ADMIN:
        return '系统管理员';
      default:
        return role;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span className={cn(
      'status-badge',
      getColorClass(),
      sizeClasses[size],
      'inline-flex items-center font-medium',
      className
    )}>
      {showIcon && getIcon()}
      {getLabel()}
    </span>
  );
};
