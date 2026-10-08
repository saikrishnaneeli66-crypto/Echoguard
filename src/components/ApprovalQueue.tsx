import React, { useState } from 'react';
import type { RemediationAction, Incident } from '../types/echoguard.ts';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ApprovalQueueProps {
  pendingActions: RemediationAction[];
  incidents: Incident[];
  onApprove: (id: string, approver: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  pendingActions,
  incidents,
  onApprove,
  onReject,
}) => {
  const [approverName, setApproverName] = useState('SRE On-Call (Lead)');
  const [rejectReason, setRejectReason] = useState('');
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await onApprove(id, approverName);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) return;
    setIsProcessing(id);
    try {
      await onReject(id, rejectReason);
      setActiveRejectId(null);
      setRejectReason('');
    } finally {
      setIsProcessing(null);
    }
  };

  if (pendingActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white">Approval Queue is Clear</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
          No high-risk actions are awaiting human intervention. Low and medium-risk remediation actions (such as pod restarts and auto-scaling) execute autonomously per predefined safety policies.
        </p>
        <div className="mt-4 rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-400 max-w-md">
          <span className="font-semibold text-slate-200">How to trigger an approval request:</span>
          <p className="mt-1">
            Click <strong className="text-amber-400">Chaos Fault Lab</strong> → Select{' '}
            <strong className="text-white">Bad Canary Deployment (v1.4.2)</strong>. The Digital Twin will propose a
            deployment rollback, which is classified as High Risk and enqueued here for approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Human-in-the-Loop SRE Approval Station
          </h3>
        </div>
        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/40 animate-pulse">
          {pendingActions.length} Actions Awaiting Authorization
        </span>
      </div>

      <div className="space-y-4">
        {pendingActions.map((action) => {
          const inc = incidents.find((i) => i.id === action.incidentId);
          const twin = inc?.digitalTwinSimulation;
          const candidate = twin?.candidates.find((c) => c.type === action.type);

          return (
            <div
              key={action.id}
              className="rounded-2xl border border-amber-600/70 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      High-Risk Remediation: {action.type.toUpperCase().replace('_', ' ')}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      Target: {action.targetResource} · Incident: {action.incidentId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-300 border border-rose-800">
                    Risk Tier: HIGH
                  </span>
                  <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-800">
                    Auto-Exec: BLOCKED
                  </span>
                </div>
              </div>

              {/* Rationale & Digital Twin Projection */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Safety Policy Reason */}
                <div className="rounded-xl bg-slate-950/80 p-3.5 border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Safety Policy Engine Constraint
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This action mutates production deployment revisions (Rollout Undo). Per{' '}
                    <strong className="text-white">RULE-POL-03</strong>, automated execution is blocked to safeguard
                    against unintended schema divergence.
                  </p>
                  {inc?.geminiDiagnosis && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-cyan-300">
                      <strong>Gemini RCA Verdict:</strong> {inc.geminiDiagnosis.probableRootCause}
                    </div>
                  )}
                </div>

                {/* Right: Digital Twin Projected Recovery */}
                <div className="rounded-xl bg-indigo-950/30 p-3.5 border border-indigo-800/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-2 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Digital Twin Simulated Impact
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-950/80 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Error Reduction</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        -{candidate?.projectedErrorReduction || 99}%
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Recovery Time</span>
                      <span className="text-sm font-bold text-white font-mono">
                        ~{candidate?.projectedRecoveryTimeSec || 7.2}s
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-950/80 p-2 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Efficacy Score</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">
                        {candidate?.efficacyScore || 98}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Decision Station */}
              <div className="mt-4 rounded-xl bg-slate-950 p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <label className="text-xs text-slate-400 font-medium">Signing SRE Operator:</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Reject trigger */}
                  <button
                    onClick={() => setActiveRejectId(activeRejectId === action.id ? null : action.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Action
                  </button>

                  {/* Approve button */}
                  <button
                    onClick={() => handleApprove(action.id)}
                    disabled={isProcessing === action.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isProcessing === action.id ? 'Dispatching...' : 'Authorize & Execute Remediation'}
                  </button>
                </div>
              </div>

              {/* Reject Confirmation Drawer */}
              {activeRejectId === action.id && (
                <div className="mt-3 rounded-xl border border-rose-800/80 bg-rose-950/30 p-3.5 space-y-2">
                  <label className="text-xs font-semibold text-rose-200 block">
                    Reason for rejecting autonomous remediation recommendation:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SRE preferring manual canary hotfix over immediate rollback"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-lg border border-rose-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setActiveRejectId(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(action.id)}
                      disabled={!rejectReason || isProcessing === action.id}
                      className="rounded bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
