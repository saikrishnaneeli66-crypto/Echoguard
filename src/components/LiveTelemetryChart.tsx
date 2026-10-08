import React, { useState } from 'react';
import type { TelemetryPoint } from '../types/echoguard.ts';
import { Activity, Flame, Clock, AlertOctagon } from 'lucide-react';

interface LiveTelemetryChartProps {
  data: TelemetryPoint[];
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<'cpu' | 'memory' | 'error' | 'latency' | 'anomaly'>('cpu');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-500">
        Collecting initial telemetry samples...
      </div>
    );
  }

  const latest = data[data.length - 1];

  const getMetricConfig = () => {
    switch (activeMetric) {
      case 'cpu':
        return {
          title: 'Cluster CPU Utilization',
          unit: '%',
          color: '#06b6d4', // cyan-500
          fillColor: 'rgba(6, 182, 212, 0.15)',
          current: `${latest.avgCpu}%`,
          getValue: (d: TelemetryPoint) => d.avgCpu,
          maxVal: 100,
          threshold: 80,
        };
      case 'memory':
        return {
          title: 'Cluster cgroup Memory',
          unit: '%',
          color: '#8b5cf6', // purple-500
          fillColor: 'rgba(139, 92, 246, 0.15)',
          current: `${latest.avgMemory}%`,
          getValue: (d: TelemetryPoint) => d.avgMemory,
          maxVal: 100,
          threshold: 85,
        };
      case 'error':
        return {
          title: 'Ingress Error Rate (HTTP 5xx)',
          unit: '%',
          color: '#f43f5e', // rose-500
          fillColor: 'rgba(244, 63, 94, 0.2)',
          current: `${latest.errorRate}%`,
          getValue: (d: TelemetryPoint) => d.errorRate,
          maxVal: Math.max(10, ...data.map((d) => d.errorRate)),
          threshold: 5,
        };
      case 'latency':
        return {
          title: 'p99 Response Latency',
          unit: 'ms',
          color: '#f59e0b', // amber-500
          fillColor: 'rgba(245, 158, 11, 0.15)',
          current: `${latest.p99Latency}ms`,
          getValue: (d: TelemetryPoint) => d.p99Latency,
          maxVal: Math.max(150, ...data.map((d) => d.p99Latency)),
          threshold: 200,
        };
      case 'anomaly':
        return {
          title: 'Isolation Forest Anomaly Score',
          unit: ' (0-1.0)',
          color: '#10b981', // emerald-500
          fillColor: 'rgba(16, 185, 129, 0.15)',
          current: `${latest.anomalyScore}`,
          getValue: (d: TelemetryPoint) => d.anomalyScore,
          maxVal: 1.0,
          threshold: 0.65,
        };
    }
  };

  const config = getMetricConfig();

  // SVG dimensions
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Coordinate scaling
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * graphWidth;
    const val = config.getValue(d);
    const y = padding.top + graphHeight - (Math.min(config.maxVal, Math.max(0, val)) / config.maxVal) * graphHeight;
    return { x, y, val, d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Simple smooth curve
    const prev = points[idx - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  const thresholdY =
    padding.top + graphHeight - (Math.min(config.maxVal, config.threshold) / config.maxVal) * graphHeight;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-sm">
      {/* Metric Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">{config.title}</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-slate-300">
              Live: {config.current}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry buffer (Isolation Forest ML & continuous health scraping)
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveMetric('cpu')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeMetric === 'cpu' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            CPU %
          </button>
          <button
            onClick={() => setActiveMetric('memory')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeMetric === 'memory' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Memory %
          </button>
          <button
            onClick={() => setActiveMetric('error')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeMetric === 'error' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Errors %
          </button>
          <button
            onClick={() => setActiveMetric('latency')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeMetric === 'latency' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            p99 Latency
          </button>
          <button
            onClick={() => setActiveMetric('anomaly')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeMetric === 'anomaly' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Isolation Forest
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const valLabel = Math.round(ratio * config.maxVal * 10) / 10;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Alert Threshold line */}
          {config.threshold <= config.maxVal && (
            <g>
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={width - padding.right}
                y2={thresholdY}
                stroke="#e11d48"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text
                x={width - padding.right}
                y={thresholdY - 4}
                textAnchor="end"
                className="text-[9px] fill-rose-400 font-mono font-semibold"
              >
                Threshold ({config.threshold}
                {config.unit})
              </text>
            </g>
          )}

          {/* Fill Area */}
          <path d={areaD} fill={`url(#grad-${activeMetric})`} />

          {/* Line Stroke */}
          <path d={pathD} fill="none" stroke={config.color} strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive Hover Targets */}
          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 2}
                fill={hoveredIndex === i ? '#ffffff' : config.color}
                stroke={config.color}
                strokeWidth={hoveredIndex === i ? 2 : 1}
                className="transition-all"
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-slate-700 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-md text-xs"
            style={{
              left: `${Math.min(85, Math.max(10, (points[hoveredIndex].x / width) * 100))}%`,
              top: '20px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
              <Clock className="h-3 w-3" />
              <span>{points[hoveredIndex].d.timeStr}</span>
            </div>
            <div className="mt-1 font-bold text-white text-sm">
              {points[hoveredIndex].val}
              <span className="text-xs font-normal text-slate-400">{config.unit}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-300">
              <span>CPU: {points[hoveredIndex].d.avgCpu}%</span>
              <span>·</span>
              <span>Mem: {points[hoveredIndex].d.avgMemory}%</span>
              <span>·</span>
              <span className={points[hoveredIndex].d.errorRate > 1 ? 'text-rose-400 font-bold' : ''}>
                Err: {points[hoveredIndex].d.errorRate}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mini KPI Footer */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4 text-xs">
        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Activity className="h-3 w-3 text-cyan-400" />
            <span>Avg Node Load</span>
          </div>
          <div className="mt-1 text-sm font-bold text-white">{latest.avgCpu}% CPU / {latest.avgMemory}% RAM</div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>5xx Error Rate</span>
          </div>
          <div className={`mt-1 text-sm font-bold ${latest.errorRate > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {latest.errorRate}% {latest.errorRate > 1 ? '⚠️ Out of bounds' : '✓ Nominal'}
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>p99 Latency</span>
          </div>
          <div className="mt-1 text-sm font-bold text-white">{latest.p99Latency} ms</div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <AlertOctagon className="h-3 w-3 text-emerald-400" />
            <span>Anomaly Score (iForest)</span>
          </div>
          <div className={`mt-1 text-sm font-bold ${latest.anomalyScore > 0.65 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {latest.anomalyScore} {latest.anomalyScore > 0.65 ? '⚠️ Anomaly' : '✓ Normal'}
          </div>
        </div>
      </div>
    </div>
  );
};
