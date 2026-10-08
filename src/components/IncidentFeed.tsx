import React, { useState } from 'react';
import type { Incident } from '../types/echoguard.ts';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AgentPipelineTracker } from './AgentPipelineTracker.tsx';

interface IncidentFeedProps {
  incidents: Incident[];
  onSelectActionForApproval?: (incident: Incident) => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({ incidents, onSelectActionForApproval }) => {
  const [expandedId, setExpandedId] = useState<string | null>(incidents[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white">Cluster is Healthy · Zero Active Incidents</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
          The EchoGuard telemetry scraper and Isolation Forest anomaly detector are monitoring all Kubernetes pods and services in real-time.
        </p>
        <p className="text-xs text-cyan-400 mt-3 font-semibold">
          💡 Click "Chaos Fault Lab" in the top bar to simulate real-world failure scenarios!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Incidents Feed & Autonomous Remediation</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {incidents.filter((i) => i.status !== 'resolved').length} Active · {incidents.filter((i) => i.status === 'resolved').length} Resolved
        </span>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => {
          const isExpanded = expandedId === incident.id;
          const isResolved = incident.status === 'resolved';

          return (
            <div
              key={incident.id}
              className={`rounded-2xl border transition-all ${
                isResolved
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-rose-700/80 bg-rose-950/20 shadow-xl shadow-rose-950/30'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(incident.id)}
                className="flex cursor-pointer items-center justify-between p-4.5 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isResolved
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    }`}
                  >
                    {isResolved ? <CheckCircle2 className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm tracking-tight">{incident.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-rose-900/70 text-rose-200 border border-rose-700'
                            : 'bg-amber-900/70 text-amber-200 border border-amber-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                        {incident.targetDeployment}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(incident.detectedAt).toLocaleTimeString()}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-300">ID: {incident.id}</span>
                      <span>·</span>
                      <span className="text-slate-400">
                        Status:{' '}
                        <span
                          className={`font-semibold ${
                            isResolved
                              ? 'text-emerald-400'
                              : incident.status === 'pending_approval'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </span>
                      {incident.mttrSeconds && (
                        <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800/80">
                          MTTR: {incident.mttrSeconds}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {incident.status === 'pending_approval' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectActionForApproval) onSelectActionForApproval(incident);
                      }}
                      className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all animate-pulse"
                    >
                      Review Approval
                    </button>
                  )}
                  <button className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Deep Dive Body */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-5 space-y-5 bg-slate-950/40">
                  {/* Multi-Agent Pipeline Visualizer */}
                  <AgentPipelineTracker currentStage={incident.pipelineStage} incidentStatus={incident.status} />

                  {/* 1. Gemini AI Root Cause Analysis Card */}
                  {incident.geminiDiagnosis && (
                    <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-4 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between border-b border-cyan-800/40 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                            Gemini 3.8 Flash · Root Cause Analysis (RCA)
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400">Diagnosis Confidence:</span>
                          <span className="rounded bg-cyan-900/60 px-2 py-0.5 font-mono font-bold text-cyan-300 border border-cyan-700">
                            {Math.round(incident.geminiDiagnosis.confidenceScore * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h5 className="text-sm font-bold text-white">
                          {incident.geminiDiagnosis.probableRootCause}
                        </h5>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {incident.geminiDiagnosis.failureMechanism}
                        </p>
                      </div>

                      {/* Evidence Citations */}
                      <div className="mt-3 rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Correlated Evidence Trail (Telemetry + K8s Events)
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {incident.geminiDiagnosis.evidenceTrail.map((ev, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">›</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. Digital Twin What-If Simulation Comparison */}
                  {incident.digitalTwinSimulation && (
                    <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-4">
                      <div className="flex items-center justify-between border-b border-indigo-800/40 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-400" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                            Digital Twin State-Projection Evaluation
                          </h4>
                        </div>
                        <span className="text-xs text-indigo-200">
                          Rationale: {incident.digitalTwinSimulation.rationale}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {incident.digitalTwinSimulation.candidates.map((cand) => {
                          const isRecommended = cand.id === incident.digitalTwinSimulation?.recommendedActionId;

                          return (
                            <div
                              key={cand.id}
                              className={`rounded-xl p-3 border text-xs transition-all ${
                                isRecommended
                                  ? 'border-indigo-400 bg-indigo-900/40 shadow-md ring-1 ring-indigo-400/50'
                                  : 'border-slate-800 bg-slate-900/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-[11px] truncate">{cand.title}</span>
                                {isRecommended && (
                                  <span className="rounded bg-indigo-500 px-1.5 py-0.2 text-[9px] font-extrabold text-white uppercase">
                                    Twin Choice
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-400 mt-2">
                                <div className="flex justify-between">
                                  <span>Projected Error Relief:</span>
                                  <span className="font-mono text-emerald-400">-{cand.projectedErrorReduction}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Projected Recovery:</span>
                                  <span className="font-mono text-slate-200">{cand.projectedRecoveryTimeSec}s</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Risk Tier:</span>
                                  <span
                                    className={`font-bold uppercase ${
                                      cand.riskTier === 'high'
                                        ? 'text-rose-400'
                                        : cand.riskTier === 'medium'
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {cand.riskTier}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Safety Policy & Remediation Execution Trace */}
                  {incident.remediationAction && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                            Remediation Action Execution Trace
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                          Initiated By: {incident.remediationAction.initiatedBy}
                        </span>
                      </div>

                      {/* Execution Terminal */}
                      <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800 max-h-40 overflow-y-auto space-y-1">
                        <div className="text-slate-500 flex items-center gap-1.5 mb-1">
                          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Kubernetes Healing Agent Audit Trail</span>
                        </div>
                        {incident.remediationAction.executionLog.map((log, lidx) => (
                          <div key={lidx} className="leading-relaxed">
                            <span className="text-cyan-500">›</span> {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
