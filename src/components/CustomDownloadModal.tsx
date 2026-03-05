'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomDownloadModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
  title: string;
  format: string;
}

export function CustomDownloadModal({ open, onClose, data, title, format }: CustomDownloadModalProps) {
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDataTable, setIncludeDataTable] = useState(true);
  const [rowLimit, setRowLimit] = useState<'all' | '1year' | '5years' | 'custom'>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(format === 'custom' ? 'pdf' : format);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [fontSize, setFontSize] = useState('medium');
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customRowCount, setCustomRowCount] = useState('120');
  const [customTimeUnit, setCustomTimeUnit] = useState<'rows' | 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes'>('rows');
  const [customTimeValue, setCustomTimeValue] = useState('10');

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const downloadFormat = format === 'custom' ? selectedFormat : format;
      switch(downloadFormat.toLowerCase()) {
        case 'csv':
          await downloadCSV();
          break;
        case 'excel':
          await downloadExcel();
          break;
        case 'pdf':
          await downloadPDF();
          break;
        case 'json':
          downloadJSON();
          break;
        case 'png':
        case 'jpg':
          await downloadImage(downloadFormat);
          break;
        default:
          alert(`${downloadFormat} download coming soon!`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const downloadCSV = async () => {
    let csv = '';
    
    if (includeSummary) {
      csv += 'Summary\n';
      csv += Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n');
      csv += '\n\n';
    }
    
    if (includeDataTable && data.schedule) {
      csv += 'Data Table\n';
      const headers = Object.keys(data.schedule[0] || {});
      csv += headers.join(',') + '\n';
      
      const rows = getFilteredRows(data.schedule);
      csv += rows.map(row => headers.map(h => row[h]).join(',')).join('\n');
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    if (includeSummary) {
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Field', key: 'Field', width: 30 },
        { header: 'Value', key: 'Value', width: 40 }
      ];
      Object.entries(data).forEach(([key, value]) => {
        summarySheet.addRow({ Field: key, Value: value });
      });
    }

    if (includeDataTable && data.schedule) {
      const rows = getFilteredRows(data.schedule);
      const dataSheet = workbook.addWorksheet('Data');
      const headers = Object.keys(rows[0] || {});
      dataSheet.columns = headers.map((header) => ({ header, key: header, width: 18 }));
      rows.forEach((row) => dataSheet.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${Date.now()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Apply custom colors
    const rgb = hexToRgb(primaryColor);
    const accentRgb = hexToRgb(accentColor);
    
    // Title with primary color
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.setFontSize(fontSize === 'small' ? 16 : fontSize === 'large' ? 24 : 20);
    doc.text(title, 20, yPos);
    yPos += 15;
    
    // Reset to black for content
    doc.setTextColor(0, 0, 0);
    
    // Summary
    if (includeSummary) {
      doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      doc.setFontSize(fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14);
      doc.text('Summary', 20, yPos);
      yPos += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(fontSize === 'small' ? 9 : fontSize === 'large' ? 11 : 10);
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          doc.text(`${key}: ${value}`, 20, yPos);
          yPos += 7;
        }
      });
      yPos += 10;
    }
    
    // Data Table
    if (includeDataTable && data.schedule) {
      const rows = getFilteredRows(data.schedule);
      const headers = Object.keys(rows[0] || {});
      
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: rows.map(row => headers.map(h => row[h])),
        headStyles: {
          fillColor: [rgb.r, rgb.g, rgb.b],
          fontSize: fontSize === 'small' ? 8 : fontSize === 'large' ? 11 : 9,
        },
        bodyStyles: {
          fontSize: fontSize === 'small' ? 7 : fontSize === 'large' ? 10 : 8,
        },
      });
    }
    
    // Add watermark if enabled
    if (includeWatermark) {
      doc.setFontSize(60);
      doc.setTextColor(220, 220, 220);
      doc.text('CALCULATOR', 105, 150, { align: 'center', angle: 45 });
    }
    
    doc.save(`${title}-${Date.now()}.pdf`);
  };
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const downloadJSON = () => {
    const exportData: any = {};
    
    if (includeSummary) {
      exportData.summary = data;
    }
    
    if (includeDataTable && data.schedule) {
      exportData.data = getFilteredRows(data.schedule);
    }
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadImage = async (format: string) => {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.querySelector('.calculator-result');
    if (element) {
      const canvas = await html2canvas(element as HTMLElement);
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const url = canvas.toDataURL(mimeType);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-${Date.now()}.${format}`;
      a.click();
    }
  };

  const getFilteredRows = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return [];
    
    switch(rowLimit) {
      case '1year':
        return schedule.slice(0, 12);
      case '5years':
        return schedule.slice(0, 60);
      case 'custom':
        const count = calculateCustomRowCount();
        return schedule.slice(0, count);
      default:
        return schedule;
    }
  };
  
  const calculateCustomRowCount = () => {
    const value = parseInt(customTimeValue) || 10;
    
    switch(customTimeUnit) {
      case 'rows':
        return parseInt(customRowCount) || 120;
      case 'years':
        return value * 12; // months in years
      case 'months':
        return value;
      case 'weeks':
        return Math.ceil(value / 4); // approximate weeks to months
      case 'days':
        return Math.ceil(value / 30); // approximate days to months
      case 'hours':
        return Math.ceil(value / 720); // approximate hours to months
      case 'minutes':
        return Math.ceil(value / 43200); // approximate minutes to months
      default:
        return parseInt(customRowCount) || 120;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">🎨 Customize Download</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Full control over your download ({format === 'custom' ? 'Select Format' : format.toUpperCase()})
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* ALWAYS SHOW Preview Section at TOP */}
          <div className="space-y-2 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                👁️
              </div>
              <div>
                <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">LIVE PREVIEW</Label>
                <p className="text-xs text-slate-600 dark:text-slate-400">Your {format === 'custom' ? selectedFormat.toUpperCase() : format.toUpperCase()} will look like this:</p>
              </div>
            </div>
            
            {/* Preview Card - Always Visible */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
              {/* PDF/Document Header */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between" style={{ backgroundColor: `${primaryColor}15` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {format === 'custom' ? selectedFormat.toUpperCase() : format.toUpperCase()}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Title Preview */}
                <div 
                  className="font-bold border-b pb-2"
                  style={{ 
                    color: primaryColor,
                    fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '20px' : '16px'
                  }}
                >
                  📊 {title}
                  <div className="text-xs text-muted-foreground font-normal mt-1">
                    Generated on {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                {/* Summary Preview */}
                {includeSummary && (
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                    <div 
                      className="font-semibold flex items-center gap-2"
                      style={{ 
                        color: accentColor,
                        fontSize: fontSize === 'small' ? '11px' : fontSize === 'large' ? '15px' : '13px'
                      }}
                    >
                      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }}></span>
                      Key Metrics & Input Values
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(data).slice(0, 6).map(([key, value]: [string, any], idx) => (
                        <div key={idx} className="flex justify-between items-center px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          <span className="font-medium text-slate-600 dark:text-slate-400">{key}:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Charts Preview */}
                {includeCharts && (
                  <div className="space-y-2">
                    <div 
                      className="font-semibold text-xs flex items-center gap-2"
                      style={{ color: accentColor }}
                    >
                      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }}></span>
                      Visual Graphs & Diagrams
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl">📈</div>
                          <div className="text-xs text-muted-foreground">Line Chart</div>
                        </div>
                      </div>
                      <div className="h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl">🥧</div>
                          <div className="text-xs text-muted-foreground">Pie Chart</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Table Preview */}
                {includeDataTable && (
                  <div className="space-y-2">
                    <div 
                      className="font-semibold text-xs flex items-center gap-2"
                      style={{ color: accentColor }}
                    >
                      <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }}></span>
                      Full Amortization Schedule
                      {rowLimit !== 'all' && (
                        <span className="ml-1 text-muted-foreground font-normal">
                          ({rowLimit === 'custom' 
                            ? `Limited to ${calculateCustomRowCount()} rows` 
                            : rowLimit === '1year' ? 'First 12 months' : 'First 5 years'})
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-700 p-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div>Period</div>
                        <div>Payment</div>
                        <div>Principal</div>
                        <div>Balance</div>
                      </div>
                      <div className="p-2 text-xs space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="grid grid-cols-4 gap-1 text-muted-foreground">
                            <div>Month {i}</div>
                            <div>₹{(5000 + i * 100).toLocaleString()}</div>
                            <div>₹{(3000 + i * 50).toLocaleString()}</div>
                            <div>₹{(50000 - i * 3000).toLocaleString()}</div>
                          </div>
                        ))}
                        <div className="text-center text-xs text-muted-foreground italic pt-1 border-t border-slate-200 dark:border-slate-700">
                          ... {data.schedule?.length ? `${Math.min(data.schedule.length - 3, calculateCustomRowCount() - 3)} more rows` : 'more data'} ...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  
                {/* Watermark Preview */}
                {includeWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-slate-200 dark:text-slate-800 font-black text-4xl opacity-10 rotate-[-45deg] select-none">
                      CALCULATOR LOOP
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom Meta Info */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>📏 Font: <strong>{fontSize.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>🎨 Colors: <span className="inline-block w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: primaryColor }}></span> <span className="inline-block w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: accentColor }}></span></span>
                </div>
                <div>
                  Format: <strong>{format === 'custom' ? selectedFormat.toUpperCase() : format.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          </div>
        
          {/* Format Selection (only for custom) */}
          {format === 'custom' && (
            <div className="space-y-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <Label className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">📄 SELECT FORMAT</Label>
              <div className="grid grid-cols-4 gap-2">
                {['pdf', 'excel', 'csv', 'json', 'png', 'jpg', 'html', 'word'].map((fmt) => (
                  <Button
                    key={fmt}
                    variant={selectedFormat === fmt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFormat(fmt)}
                    className="text-xs uppercase"
                  >
                    {fmt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Style & Color Options */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">🎨 STYLE & COLORS</Label>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <span className="text-xs font-mono">{primaryColor}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Accent Color</Label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={accentColor} 
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <span className="text-xs font-mono">{accentColor}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Font Size</Label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map((size) => (
                    <Button
                      key={size}
                      variant={fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFontSize(size)}
                      className="flex-1 text-xs capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Include Summary */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Include Summary</Label>
              <p className="text-sm text-muted-foreground">Key metrics and input values</p>
            </div>
            <Switch
              checked={includeSummary}
              onCheckedChange={setIncludeSummary}
            />
          </div>

          {/* Include Charts */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Include Charts</Label>
              <p className="text-sm text-muted-foreground">Visual graphs and diagrams</p>
            </div>
            <Switch
              checked={includeCharts}
              onCheckedChange={setIncludeCharts}
            />
          </div>

          {/* Include Data Table */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Include Data Table</Label>
              <p className="text-sm text-muted-foreground">Full amortization schedule</p>
            </div>
            <Switch
              checked={includeDataTable}
              onCheckedChange={setIncludeDataTable}
            />
          </div>

          {/* Row Limit */}
          {includeDataTable && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">ROW LIMIT</Label>
              <div className="flex gap-2">
                <Button
                  variant={rowLimit === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRowLimit('all')}
                  className="flex-1"
                >
                  All Rows
                </Button>
                <Button
                  variant={rowLimit === '1year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRowLimit('1year')}
                  className="flex-1"
                >
                  1 Year
                </Button>
                <Button
                  variant={rowLimit === '5years' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRowLimit('5years')}
                  className="flex-1"
                >
                  5 Years
                </Button>
                <Button
                  variant={rowLimit === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRowLimit('custom')}
                  className="flex-1"
                >
                  Custom
                </Button>
              </div>
              
              {/* Custom Row Input */}
              {rowLimit === 'custom' && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
                  <Label className="text-xs font-semibold text-amber-900 dark:text-amber-100">⚙️ CUSTOM RANGE</Label>
                  
                  {/* Time Unit Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Select Unit</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { value: 'rows', label: 'Rows', icon: '📊' },
                        { value: 'years', label: 'Years', icon: '📅' },
                        { value: 'months', label: 'Months', icon: '📆' },
                        { value: 'weeks', label: 'Weeks', icon: '📋' },
                        { value: 'days', label: 'Days', icon: '📄' },
                        { value: 'hours', label: 'Hours', icon: '⏰' },
                        { value: 'minutes', label: 'Mins', icon: '⏱️' },
                      ].map((unit) => (
                        <Button
                          key={unit.value}
                          variant={customTimeUnit === unit.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCustomTimeUnit(unit.value as any)}
                          className="text-xs h-8 px-2"
                        >
                          {unit.icon}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-center font-medium text-amber-900 dark:text-amber-100">
                      {customTimeUnit === 'rows' ? 'Rows' : 
                       customTimeUnit === 'years' ? 'Years' : 
                       customTimeUnit === 'months' ? 'Months' : 
                       customTimeUnit === 'weeks' ? 'Weeks' : 
                       customTimeUnit === 'days' ? 'Days' : 
                       customTimeUnit === 'hours' ? 'Hours' : 'Minutes'}
                    </div>
                  </div>
                  
                  {/* Value Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      {customTimeUnit === 'rows' ? 'Number of Rows' : `Number of ${customTimeUnit.charAt(0).toUpperCase() + customTimeUnit.slice(1)}`}
                    </Label>
                    <input
                      type="number"
                      value={customTimeUnit === 'rows' ? customRowCount : customTimeValue}
                      onChange={(e) => customTimeUnit === 'rows' ? setCustomRowCount(e.target.value) : setCustomTimeValue(e.target.value)}
                      min="1"
                      max={customTimeUnit === 'rows' ? '10000' : customTimeUnit === 'years' ? '100' : customTimeUnit === 'months' ? '1200' : '100000'}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder={`Enter ${customTimeUnit}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {customTimeUnit === 'rows' 
                        ? `Will export ${customRowCount} rows` 
                        : `≈ ${calculateCustomRowCount()} rows (converted from ${customTimeValue} ${customTimeUnit})`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Watermark */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Add Watermark</Label>
              <p className="text-sm text-muted-foreground">Brand your downloads</p>
            </div>
            <Switch
              checked={includeWatermark}
              onCheckedChange={setIncludeWatermark}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading} 
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : `Download ${format === 'custom' ? selectedFormat.toUpperCase() : format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
