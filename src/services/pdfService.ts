import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SimulationTask } from '../types';
import { formatDateTime, formatPercentage, formatNumber } from '../utils';

export async function generateSimulationReport(task: SimulationTask): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text('稀土萃取分离模拟报告', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`报告编号: ${task.id}`, margin, yPosition);
  doc.text(`生成时间: ${formatDateTime(new Date())}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 8;

  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text('一、任务基本信息', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const basicInfo = [
    ['任务名称', task.name],
    ['创建时间', formatDateTime(task.createdAt)],
    ['创建人', task.createdBy],
    ['当前状态', task.status],
    ['完成进度', `${task.progress.toFixed(1)}%`]
  ];

  basicInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 40, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text('二、萃取体系参数', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const systemInfo = [
    ['体系名称', task.system.name],
    ['pH值', task.system.ph.toString()],
    ['温度', `${task.system.temperature}°C`],
    ['目标分离因子', task.system.targetSeparationFactor.toString()]
  ];

  systemInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 40, yPosition);
    yPosition += 6;
  });

  yPosition += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('料液浓度:', margin + 5, yPosition);
  yPosition += 6;
  task.system.feedConcentrations.forEach(fc => {
    doc.setFont('helvetica', 'normal');
    doc.text(`  ${fc.element}: ${fc.concentration} ${fc.unit}`, margin + 10, yPosition);
    yPosition += 5;
  });

  yPosition += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('萃取剂配比:', margin + 5, yPosition);
  yPosition += 6;
  Object.entries(task.system.extractantRatio).forEach(([key, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`  ${key}: ${value}`, margin + 10, yPosition);
    yPosition += 5;
  });

  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text('三、混合澄清槽几何参数', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const geometryInfo = [
    ['混合室尺寸', `${task.geometry.mixerLength}×${task.geometry.mixerWidth}×${task.geometry.mixerHeight} m`],
    ['澄清室尺寸', `${task.geometry.settlerLength}×${task.geometry.settlerWidth}×${task.geometry.settlerHeight} m`],
    ['搅拌桨类型', task.geometry.impellerType],
    ['搅拌桨直径', `${task.geometry.impellerDiameter} m`],
    ['级数', task.geometry.stages.toString()],
    ['搅拌转速', `${task.geometry.stirringSpeed.toFixed(0)} rpm`],
    ['相比', task.geometry.phaseRatio.toFixed(2)]
  ];

  geometryInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 45, yPosition);
    yPosition += 6;
  });

  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  if (task.results) {
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 44, 89);
    doc.text('四、模拟结果', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const resultsInfo = [
      ['平均萃取率', formatPercentage(task.results.averageExtractionRate)],
      ['分离因子', formatNumber(task.results.separationFactor, 3)],
      ['物质守恒误差', formatPercentage(task.results.materialBalance.error, 4)]
    ];

    resultsInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + 5, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 45, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('各级效率:', margin + 5, yPosition);
    yPosition += 6;

    const colWidth = 25;
    const startX = margin + 10;
    doc.setFontSize(9);
    doc.text('级号', startX, yPosition);
    doc.text('效率(%)', startX + colWidth, yPosition);
    yPosition += 5;

    task.results.stageEfficiencyCurve.forEach((eff, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}`, startX, yPosition);
      doc.text(formatPercentage(eff, 1), startX + colWidth, yPosition);
      yPosition += 4.5;

      if (yPosition > pageHeight - 30 && idx < task.results!.stageEfficiencyCurve.length - 1) {
        doc.addPage();
        yPosition = margin;
      }
    });

    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('浓度轴向分布:', margin + 5, yPosition);
    yPosition += 6;

    const elements = Object.keys(task.results.concentrationAxialDistribution);
    elements.forEach(element => {
      const concentrations = task.results!.concentrationAxialDistribution[element];
      doc.setFont('helvetica', 'normal');
      doc.text(`${element}: 入口=${formatNumber(concentrations[0], 4)} → 出口=${formatNumber(concentrations[concentrations.length - 1], 4)} mol/L`, 
               margin + 10, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('传质系数矩阵:', margin + 5, yPosition);
    yPosition += 6;

    const matrix = task.results.massTransferCoefficientMatrix;
    const cellWidth = 18;
    const matrixStartX = margin + 10;

    doc.setFontSize(8);
    for (let i = 0; i < Math.min(matrix.length, 5); i++) {
      for (let j = 0; j < Math.min(matrix[i].length, 5); j++) {
        doc.text(matrix[i][j].toFixed(3), matrixStartX + j * cellWidth, yPosition);
      }
      yPosition += 4.5;
    }
    if (matrix.length > 5) {
      doc.setFontSize(9);
      doc.text(`... (共${matrix.length}×${matrix[0].length}矩阵)`, matrixStartX, yPosition);
      yPosition += 6;
    }
  }

  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  if (task.alerts.length > 0) {
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 44, 89);
    doc.text('五、预警记录', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    task.alerts.forEach((alert, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(alert.level === 'critical' ? 239 : alert.level === 'danger' ? 239 : 245, 
                       alert.level === 'critical' ? 68 : alert.level === 'danger' ? 68 : 158, 
                       alert.level === 'critical' ? 68 : alert.level === 'danger' ? 68 : 11);
      doc.text(`${idx + 1}. [${alert.level.toUpperCase()}] ${alert.message}`, margin + 5, yPosition);
      yPosition += 6;
      doc.setTextColor(100);
      doc.text(`   时间: ${formatDateTime(alert.timestamp)} | 级号: ${alert.stage} | 已确认: ${alert.acknowledged ? '是' : '否'}`, margin + 8, yPosition);
      yPosition += 5;
    });
  }

  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text('六、审批流程', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const approvalInfo = [
    ['一级审批(物质守恒验证)', 
     task.approval.stage1.approved 
       ? `已通过 - ${task.approval.stage1.approvedBy} - ${task.approval.stage1.approvedAt ? formatDateTime(task.approval.stage1.approvedAt) : ''}`
       : '待审批'],
    ['二级审批(技术可行性)', 
     task.approval.stage2.approved 
       ? `已通过 - ${task.approval.stage2.approvedBy} - ${task.approval.stage2.approvedAt ? formatDateTime(task.approval.stage2.approvedAt) : ''}`
       : '待审批'],
    ['推送设计组', task.approval.pushedToDesign ? `已推送 - ${task.approval.pushedAt ? formatDateTime(task.approval.pushedAt) : ''}` : '未推送']
  ];

  approvalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 50, yPosition);
    yPosition += 6;
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('稀土萃取分离多物理场模拟与工艺参数智能优化平台', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('第 1 页 / 共 ' + doc.internal.pages.length + ' 页', pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc;
}

export async function downloadReport(task: SimulationTask): Promise<void> {
  const doc = await generateSimulationReport(task);
  doc.save(`萃取模拟报告_${task.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function captureAndGenerateReport(elementId: string, task: SimulationTask): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    await downloadReport(task);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = await generateSimulationReport(task);
    
    doc.addPage();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let yPos = 20;
    if (imgHeight > pageHeight - 40) {
      const ratio = (pageHeight - 40) / imgHeight;
      const finalWidth = imgWidth * ratio;
      const finalHeight = pageHeight - 40;
      doc.addImage(imgData, 'PNG', (pageWidth - finalWidth) / 2, yPos, finalWidth, finalHeight);
    } else {
      doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
    }
    
    doc.save(`萃取模拟报告_${task.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('截图生成失败，使用标准报告格式:', error);
    await downloadReport(task);
  }
}
