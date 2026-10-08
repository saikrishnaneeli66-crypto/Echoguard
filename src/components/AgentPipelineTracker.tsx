import React from 'react';
import type { Incident } from '../types/echoguard.ts';
import {
  Activity,
  Search,
  Sparkles,
  Layers,
  ShieldCheck,
  Wrench,
  CheckCircle,
  Database,
  TrendingUp,
  Share2,
} from 'lucide-react';

interface AgentPipelineTrackerProps {
  currentStage: Incident['pipelineStage'] | undefined;
  incidentStatus: Incident['status'] | undefined;
}

export const AgentPipelineTracker: React.FC<AgentPipelineTrackerProps> = ({ currentStage, incidentStatus }) => {
  const stages = [
    { id: 'telemetry_collection', name: 'Telemetry Scraper', icon: Activity, desc: 'Scraping metrics & logs' },
    { id: 'anomaly_detection', name: 'Detection Agent', icon: Search, desc: 'Isolation Forest ML' },
    { id: 'correlation', name: 'Correlation Agent', icon: Share2, desc: 'Grouping logs & events' },
    { id: 'gemini_diagnosis', name: 'Diagnosis Agent', icon: Sparkles, desc: 'Gemini 3.8 Flash RCA' },
    { id: 'prediction', name: 'Prediction Agent', icon: TrendingUp, desc: 'Time-to-failure trend' },
    { id: 'digital_twin_simulation', name: 'Digital Twin', icon: Layers, desc: 'What-if state projection' },
    { id: 'safety_policy_evaluation', name: 'Safety Policy', icon: ShieldCheck, desc: 'Risk tier evaluation' },
    { id: 'healing_execution', name: 'Healing Agent', icon: Wrench, desc: 'Kubernetes API mutate' },
    { id: 'verification', name: 'Verification Agent', icon: CheckCircle, desc: 'Before/after check' },
    { id: 'learning_recorded', name: 'Learning Agent', icon: Database, desc: 'Persistent incident memory' },
  ];

  const getStageIndex = (stageId: string) => {
    return stages.findIndex((s) => s.id === stageId);
  };

  const currentIndex = currentStage ? getStageIndex(currentStage) : -1;
  const isResolved = incidentStatus === 'resolved';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            EchoGuard Multi-Agent Autonomous Decision Pipeline
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Decoupled multi-agent architecture executing above Kubernetes control plane
          </p>
        </div>
        {incidentStatus === 'pending_approval' && (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 animate-pulse">
            PAUSED: Human SRE Approval Required at Safety Gate
          </span>
        )}
        {isResolved && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
            ✓ Autonomous Pipeline Succeeded & Verified
          </span>
        )}
      </div>

      {/* Horizontal Agent Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = isResolved || idx < currentIndex;
          const isCurrent = !isResolved && idx === currentIndex;
          const isPending = !isResolved && idx > currentIndex;

          return (
            <div
              key={stage.id}
              className={`relative flex flex-col items-center rounded-xl p-2.5 text-center transition-all ${
                isCurrent
                  ? 'border-2 border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 scale-105 z-10'
                  : isDone
                  ? 'border border-emerald-800/80 bg-emerald-950/20'
                  : 'border border-slate-800 bg-slate-950/40 opacity-60'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg mb-1.5 ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 animate-bounce'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <span
                className={`text-[11px] font-bold line-clamp-1 ${
                  isCurrent ? 'text-cyan-300 font-extrabold' : isDone ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {stage.name}
              </span>

              <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{stage.desc}</span>

              {/* Status Indicator */}
              <div className="mt-2">
                {isCurrent && (
                  <span className="inline-block rounded bg-cyan-400 px-1 py-0.2 text-[8px] font-extrabold text-slate-950 uppercase tracking-wider animate-pulse">
                    Active
                  </span>
                )}
                {isDone && <span className="text-[9px] text-emerald-400 font-bold">✓ Complete</span>}
                {isPending && <span className="text-[9px] text-slate-600">Pending</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
