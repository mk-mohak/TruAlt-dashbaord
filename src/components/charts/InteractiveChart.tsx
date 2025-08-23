import React, { useState, useRef, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { MessageSquare, X, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ChartAnnotation } from '../../types';

interface InteractiveChartProps {
  chartId: string;
  options: ApexOptions;
  series: any[];
  type: any;
  height?: string | number;
  enableAnnotations?: boolean;
  enableBrushing?: boolean;
  onBrushSelection?: (selection: any) => void;
}

export function InteractiveChart({
  chartId,
  options,
  series,
  type,
  height = '100%',
  enableAnnotations = true,
  enableBrushing = false,
  onBrushSelection
}: InteractiveChartProps) {
  const { state, addChartAnnotation, removeChartAnnotation } = useApp();
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ x: 0, y: 0 });
  const [annotationText, setAnnotationText] = useState('');
  const [annotationColor, setAnnotationColor] = useState('#3b82f6');
  const chartRef = useRef<any>(null);

  const chartAnnotations = state.chartAnnotations.filter(a => a.chartId === chartId);

  const enhancedOptions: ApexOptions = {
    ...options,
    chart: {
      ...options.chart,
      id: chartId,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      brush: enableBrushing ? {
        enabled: true,
        target: chartId,
        autoScaleYaxis: true,
      } : undefined,
      events: {
        ...options.chart?.events,
        click: (event: any, chartContext: any, config: any) => {
          if (enableAnnotations && event.ctrlKey) {
            const rect = event.target.getBoundingClientRect();
            setAnnotationPosition({
              x: config.dataPointIndex || 0,
              y: config.seriesIndex || 0
            });
            setShowAnnotationDialog(true);
          }
          
          // Call original click handler if exists
          if (options.chart?.events?.click) {
            options.chart.events.click(event, chartContext, config);
          }
        },
        selection: enableBrushing ? (chartContext: any, { xaxis, yaxis }: any) => {
          if (onBrushSelection) {
            onBrushSelection({ xaxis, yaxis });
          }
        } : undefined,
      },
    },
    annotations: {
      ...options.annotations,
      points: [
        ...(options.annotations?.points || []),
        ...chartAnnotations.map(annotation => ({
          x: annotation.x,
          y: annotation.y,
          marker: {
            size: 8,
            fillColor: annotation.color,
            strokeColor: '#ffffff',
            strokeWidth: 2,
          },
          label: {
            borderColor: annotation.color,
            offsetY: 0,
            style: {
              color: '#ffffff',
              background: annotation.color,
            },
            text: annotation.text,
          },
        })),
      ],
    },
    tooltip: {
      ...options.tooltip,
      custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
        const annotation = chartAnnotations.find(a => 
          a.x === dataPointIndex && a.y === seriesIndex
        );
        
        let tooltipContent = '';
        if (options.tooltip?.custom) {
          tooltipContent = options.tooltip.custom({ series, seriesIndex, dataPointIndex, w });
        } else {
          tooltipContent = `
            <div class="p-3">
              <div class="font-semibold">${w.globals.labels[dataPointIndex]}</div>
              <div>${w.globals.seriesNames[seriesIndex]}: ${series[seriesIndex][dataPointIndex]}</div>
            </div>
          `;
        }
        
        if (annotation) {
          tooltipContent += `
            <div class="border-t border-gray-200 p-2 bg-gray-50">
              <div class="text-xs font-medium text-gray-600">Note:</div>
              <div class="text-sm">${annotation.text}</div>
            </div>
          `;
        }
        
        return tooltipContent;
      },
    },
  };

  const handleAddAnnotation = () => {
    if (annotationText.trim()) {
      addChartAnnotation({
        chartId,
        x: annotationPosition.x,
        y: annotationPosition.y,
        text: annotationText.trim(),
        color: annotationColor,
      });
      
      setAnnotationText('');
      setShowAnnotationDialog(false);
    }
  };

  return (
    <div className="relative h-full">
      <Chart
        ref={chartRef}
        options={enhancedOptions}
        series={series}
        type={type}
        height={height}
      />

      {/* Annotation Controls */}
      {enableAnnotations && chartAnnotations.length > 0 && (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {chartAnnotations.length} note{chartAnnotations.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  chartAnnotations.forEach(a => removeChartAnnotation(a.id));
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Clear all annotations"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annotation Dialog */}
      {showAnnotationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Chart Annotation
              </h3>
              <button
                onClick={() => setShowAnnotationDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note Text
                </label>
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Enter your note..."
                  className="input-field w-full h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  {['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      onClick={() => setAnnotationColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        annotationColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAnnotationDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAnnotation}
                disabled={!annotationText.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {enableAnnotations && (
        <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Ctrl + Click to add notes
          </p>
        </div>
      )}
    </div>
  );
}