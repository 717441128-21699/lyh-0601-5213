import { SimulationTask, ExportOptions, CloudData } from '../types';
import { exportToCSV, exportToJSON, formatNumber, formatPercentage } from '../utils';
import dayjs from 'dayjs';

export interface LogisticsDataPoint {
  stage: number;
  timestamp: string;
  aqueousFlowRate: number;
  organicFlowRate: number;
  phaseRatio: number;
  stirringSpeed: number;
  temperature: number;
  ph: number;
}

export function generateLogisticsData(task: SimulationTask): LogisticsDataPoint[] {
  const data: LogisticsDataPoint[] = [];
  const stages = task.geometry.stages;
  
  for (let stage = 1; stage <= stages; stage++) {
    const baseTime = dayjs(task.createdAt);
    for (let t = 0; t < 10; t++) {
      data.push({
        stage,
        timestamp: baseTime.add(t * 10, 'minute').toISOString(),
        aqueousFlowRate: 10 + Math.random() * 2,
        organicFlowRate: 10 * task.geometry.phaseRatio + Math.random() * 2,
        phaseRatio: task.geometry.phaseRatio + (Math.random() - 0.5) * 0.1,
        stirringSpeed: task.geometry.stirringSpeed + (Math.random() - 0.5) * 10,
        temperature: task.system.temperature + (Math.random() - 0.5) * 2,
        ph: task.system.ph + (Math.random() - 0.5) * 0.2
      });
    }
  }
  
  return data;
}

export function generateMassTransferData(task: SimulationTask): Record<string, any>[] {
  if (!task.results) return [];
  
  const matrix = task.results.massTransferCoefficientMatrix;
  const elements = Object.keys(task.results.concentrationAxialDistribution);
  
  return matrix.map((row, i) => {
    const obj: Record<string, any> = {
      stage: i + 1,
    };
    
    row.forEach((value, j) => {
      obj[`k_${i + 1}_${j + 1}`] = value;
    });
    
    elements.forEach(element => {
      const concentrations = task.results!.concentrationAxialDistribution[element];
      obj[`${element}_inlet`] = concentrations[i];
      obj[`${element}_outlet`] = concentrations[i + 1];
      obj[`${element}_extractionRate`] = (concentrations[i] - concentrations[i + 1]) / concentrations[i];
    });
    
    obj['stageEfficiency'] = task.results.stageEfficiencyCurve[i];
    
    return obj;
  });
}

export async function exportLogisticsData(
  task: SimulationTask,
  options: ExportOptions
): Promise<void> {
  let data = generateLogisticsData(task);
  
  if (options.filterBy.extractantType) {
    const extractantType = options.filterBy.extractantType;
    data = data.filter(() => 
      Object.keys(task.system.extractantRatio).includes(extractantType)
    );
  }
  
  if (options.filterBy.phRange) {
    const [minPh, maxPh] = options.filterBy.phRange;
    data = data.filter(d => d.ph >= minPh && d.ph <= maxPh);
  }
  
  if (options.filterBy.phaseRatioRange) {
    const [minRatio, maxRatio] = options.filterBy.phaseRatioRange;
    data = data.filter(d => d.phaseRatio >= minRatio && d.phaseRatio <= maxRatio);
  }
  
  const filename = `全场物流数据_${task.id}_${dayjs().format('YYYYMMDD')}`;
  
  if (options.format === 'csv') {
    exportToCSV(data, `${filename}.csv`);
  } else if (options.format === 'json') {
    exportToJSON(data, `${filename}.json`);
  } else if (options.format === 'excel') {
    exportToCSV(data, `${filename}.csv`);
  }
}

export async function exportMassTransferMatrix(
  task: SimulationTask,
  options: ExportOptions
): Promise<void> {
  if (!task.results) return;
  
  const massTransferData = generateMassTransferData(task);
  const filename = `传质系数矩阵_${task.id}_${dayjs().format('YYYYMMDD')}`;
  
  if (options.format === 'csv') {
    exportToCSV(massTransferData, `${filename}.csv`);
  } else if (options.format === 'json') {
    exportToJSON({
      taskId: task.id,
      taskName: task.name,
      matrix: task.results.massTransferCoefficientMatrix,
      stageData: massTransferData,
      metadata: {
        extractantType: Object.keys(task.system.extractantRatio),
        ph: task.system.ph,
        phaseRatio: task.geometry.phaseRatio,
        stages: task.geometry.stages
      }
    }, `${filename}.json`);
  } else if (options.format === 'excel') {
    exportToCSV(massTransferData, `${filename}.csv`);
  }
}

export async function exportFullData(
  task: SimulationTask,
  options: ExportOptions
): Promise<void> {
  const fullData = {
    task: {
      id: task.id,
      name: task.name,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.updatedAt
    },
    system: task.system,
    geometry: task.geometry,
    simulationParams: task.simulationParams,
    results: task.results,
    logisticsData: options.includeLogisticsData ? generateLogisticsData(task) : undefined,
    massTransferData: options.includeMassTransferMatrix ? generateMassTransferData(task) : undefined,
    monitoringData: task.monitoringData,
    alerts: task.alerts,
    adjustmentLog: task.adjustmentLog,
    approval: task.approval
  };
  
  const filename = `完整模拟数据_${task.id}_${dayjs().format('YYYYMMDD')}`;
  
  if (options.format === 'json') {
    exportToJSON(fullData, `${filename}.json`);
  } else if (options.format === 'csv') {
    const csvData = [
      {
        '任务ID': task.id,
        '任务名称': task.name,
        '状态': task.status,
        '平均萃取率': task.results ? formatPercentage(task.results.averageExtractionRate) : 'N/A',
        '分离因子': task.results ? formatNumber(task.results.separationFactor, 3) : 'N/A',
        '物质守恒误差': task.results ? formatPercentage(task.results.materialBalance.error, 4) : 'N/A',
        'pH值': task.system.ph,
        '相比': task.geometry.phaseRatio.toFixed(2),
        '搅拌转速': `${task.geometry.stirringSpeed.toFixed(0)} rpm`,
        '级数': task.geometry.stages
      }
    ];
    exportToCSV(csvData, `${filename}.csv`);
  }
}

export function exportCloudDataToVTK(cloudData: CloudData, filename: string): void {
  const { dimensions, data, minValue, maxValue } = cloudData;
  
  let vtkContent = `# vtk DataFile Version 3.0
Volume data
ASCII
DATASET STRUCTURED_POINTS
DIMENSIONS ${dimensions.x} ${dimensions.y} ${dimensions.z}
ORIGIN 0 0 0
SPACING 1 1 1
POINT_DATA ${dimensions.x * dimensions.y * dimensions.z}
SCALARS volume_scalars float 1
LOOKUP_TABLE default
`;
  
  for (let z = 0; z < dimensions.z; z++) {
    for (let y = 0; y < dimensions.y; y++) {
      for (let x = 0; x < dimensions.x; x++) {
        vtkContent += `${data[x][y][z].toFixed(6)}\n`;
      }
    }
  }
  
  const blob = new Blob([vtkContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.vtk`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportConcentrationProfile(task: SimulationTask): void {
  if (!task.results) return;
  
  const elements = Object.keys(task.results.concentrationAxialDistribution);
  const stages = task.geometry.stages;
  
  const data: Record<string, any>[] = [];
  for (let i = 0; i <= stages; i++) {
    const row: Record<string, any> = { stage: i };
    elements.forEach(element => {
      row[element] = task.results!.concentrationAxialDistribution[element][i];
    });
    data.push(row);
  }
  
  const filename = `浓度轴向分布_${task.id}_${dayjs().format('YYYYMMDD')}.csv`;
  exportToCSV(data, filename);
}

export function exportStageEfficiency(task: SimulationTask): void {
  if (!task.results) return;
  
  const data = task.results.stageEfficiencyCurve.map((eff, idx) => ({
    stage: idx + 1,
    efficiency: eff,
    efficiencyPercentage: formatPercentage(eff, 2)
  }));
  
  const filename = `级效率曲线_${task.id}_${dayjs().format('YYYYMMDD')}.csv`;
  exportToCSV(data, filename);
}

export function exportRaffinatePrediction(task: SimulationTask): void {
  if (!task.results) return;
  
  const data = task.results.raffinateRatePrediction.map((rate, idx) => ({
    stage: idx + 1,
    raffinateRate: rate,
    cumulativeRaffinate: task.results!.raffinateRatePrediction
      .slice(0, idx + 1)
      .reduce((a, b) => a + b, 0) / (idx + 1)
  }));
  
  const filename = `萃余率预测_${task.id}_${dayjs().format('YYYYMMDD')}.csv`;
  exportToCSV(data, filename);
}

export function exportMonitoringData(task: SimulationTask): void {
  const { monitoringData } = task;
  
  const interfacialTensionData = monitoringData.interfacialTension.map((d, idx) => ({
    index: idx,
    time: d.time,
    interfacialTension: d.value
  }));
  
  const filename = `监控数据_${task.id}_${dayjs().format('YYYYMMDD')}.json`;
  exportToJSON({
    interfacialTension: interfacialTensionData,
    distributionRatio: monitoringData.distributionRatio,
    residenceTimeDistribution: monitoringData.residenceTimeDistribution,
    extractionRate: monitoringData.extractionRate,
    separationFactor: monitoringData.separationFactor,
    emulsificationIndex: monitoringData.emulsificationIndex
  }, filename);
}

export function exportAllTasksData(tasks: SimulationTask[]): void {
  const summaryData = tasks.map(task => ({
    id: task.id,
    name: task.name,
    status: task.status,
    system: task.system.name,
    stages: task.geometry.stages,
    ph: task.system.ph,
    phaseRatio: task.geometry.phaseRatio.toFixed(2),
    stirringSpeed: task.geometry.stirringSpeed.toFixed(0),
    averageExtractionRate: task.results ? task.results.averageExtractionRate.toFixed(4) : 'N/A',
    separationFactor: task.results ? task.results.separationFactor.toFixed(3) : 'N/A',
    createdAt: task.createdAt,
    completedAt: task.status === 'completed' ? task.updatedAt : 'N/A',
    stage1Approval: task.approval.stage1.approved ? '已通过' : '待审批',
    stage2Approval: task.approval.stage2.approved ? '已通过' : '待审批',
    pushedToDesign: task.approval.pushedToDesign ? '已推送' : '未推送'
  }));
  
  const filename = `所有任务汇总_${dayjs().format('YYYYMMDD')}.csv`;
  exportToCSV(summaryData, filename);
}
