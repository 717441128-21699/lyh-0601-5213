import {
  SimulationStatus,
  SimulationStatusLabels,
  AlertLevel,
  AlertType,
  AlertTypeLabels,
  UserRole,
  UserRoleLabels,
  ImpellerType,
  ImpellerTypeLabels
} from '../types';
import dayjs from 'dayjs';

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}分钟`;
  return `${(seconds / 3600).toFixed(2)}小时`;
}

export function getStatusColor(status: SimulationStatus): string {
  switch (status) {
    case SimulationStatus.PENDING_VERIFICATION:
      return 'bg-gray-100 text-gray-800';
    case SimulationStatus.MESHING:
      return 'bg-blue-100 text-blue-800';
    case SimulationStatus.TWO_PHASE_FLOW:
      return 'bg-cyan-100 text-cyan-800';
    case SimulationStatus.MASS_TRANSFER:
      return 'bg-purple-100 text-purple-800';
    case SimulationStatus.EFFICIENCY_EVALUATION:
      return 'bg-orange-100 text-orange-800';
    case SimulationStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case SimulationStatus.ABNORMAL_ROLLBACK:
      return 'bg-red-100 text-red-800';
    case SimulationStatus.PAUSED:
      return 'bg-yellow-100 text-yellow-800';
    case SimulationStatus.CANCELLED:
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: SimulationStatus): string {
  return SimulationStatusLabels[status] || status;
}

export function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.WARNING:
      return 'bg-yellow-100 text-yellow-800';
    case AlertLevel.DANGER:
      return 'bg-red-100 text-red-800';
    case AlertLevel.CRITICAL:
      return 'bg-red-600 text-white animate-pulse-alert';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getAlertTypeLabel(type: AlertType): string {
  return AlertTypeLabels[type] || type;
}

export function getUserRoleLabel(role: UserRole): string {
  return UserRoleLabels[role] || role;
}

export function getImpellerTypeLabel(type: ImpellerType): string {
  return ImpellerTypeLabels[type] || type;
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const maxDeviation = Math.max(...values.map(v => Math.abs((v - mean) / mean) * 100));
  return maxDeviation;
}

export function checkMaterialBalance(inlet: number, outlet: number, tolerance: number = 0.01): { valid: boolean; error: number } {
  const error = Math.abs(inlet - outlet) / inlet;
  return {
    valid: error <= tolerance,
    error
  };
}

export function calculateSeparationFactor(distributionRatioA: number, distributionRatioB: number): number {
  if (distributionRatioB === 0) return 0;
  return distributionRatioA / distributionRatioB;
}

export function calculateExtractionRate(feedConcentration: number, raffinateConcentration: number): number {
  if (feedConcentration === 0) return 0;
  return (feedConcentration - raffinateConcentration) / feedConcentration;
}

export function calculateStageEfficiency(actualTransfer: number, equilibriumTransfer: number): number {
  if (equilibriumTransfer === 0) return 0;
  return actualTransfer / equilibriumTransfer;
}

export function interpolateColor(value: number, min: number, max: number): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  const r = Math.round(255 * (1 - normalized));
  const g = Math.round(255 * normalized);
  const b = 0;
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateColorScale(count: number, baseHue: number = 210): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360) / count) % 360;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

export function getRareEarthElementColor(element: string): string {
  const colorMap: Record<string, string> = {
    'La': '#FF6B6B',
    'Ce': '#4ECDC4',
    'Pr': '#45B7D1',
    'Nd': '#96CEB4',
    'Pm': '#FFEAA7',
    'Sm': '#DDA0DD',
    'Eu': '#98D8C8',
    'Gd': '#F7DC6F',
    'Tb': '#BB8FCE',
    'Dy': '#85C1E9',
    'Ho': '#F8B500',
    'Er': '#82E0AA',
    'Tm': '#F1948A',
    'Yb': '#85C1E9',
    'Lu': '#D7BDE2',
    'Y': '#AED6F1',
    'Sc': '#A9DFBF'
  };
  return colorMap[element] || '#888888';
}
