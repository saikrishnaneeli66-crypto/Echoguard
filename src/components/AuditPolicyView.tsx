import React from 'react';
import type { AuditRecord, SafetyPolicyRule } from '../server/db.ts';
import {
  FileText,
  ShieldCheck,
  Clock,
  UserCheck,
  Bot,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

interface AuditPolicyViewProps {
  auditLogs: AuditRecord[];
  policies: SafetyPolicyRule[];
}

export const AuditPolicyView: React.FC<AuditPolicyViewProps> = ({ auditLogs, policies }) => {
  return (
    <div className="space-y-6">
      {/* 1. Safety Policy Rules Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              EchoGuard Safety Policy Rulebook (Tiered Autonomous Guardrails)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Deterministic Decision Engine
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          The Safety Policy Engine enforces hard guardrails on all actions proposed by the Digital Twin. High-risk
          operations (such as deployment rollbacks and traffic shedding) are paused for human-in-the-loop authorization,
          while low/medium-risk actions execute autonomously within defined envelope limits.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Remediation Action</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Auto-Executable</th>
                <th className="px-4 py-3">Daily Limit</th>
                <th className="px-4 py-3">Cooldown</th>
                <th className="px-4 py-3">Blast Radius</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-slate-200 font-mono text-[11px]">
              {policies.map((p) => (
                <tr key={p.actionType} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-white font-mono">{p.actionType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        p.riskTier === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : p.riskTier === 'medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {p.riskTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    {p.autoExecutable ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Autonomous
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Human Approval Mandated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.maxDailyExecutions} / day</td>
                  <td className="px-4 py-3 text-slate-400">{p.cooldownPeriodSec}s</td>
                  <td className="px-4 py-3 uppercase text-slate-300">{p.blastRadiusTolerance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Audit Trail Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Autonomous & SRE Operator Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {auditLogs.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Execution Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-slate-300 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      {log.actor === 'Autonomous Agent' ? (
                        <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                      {log.actor}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-cyan-300 font-bold whitespace-nowrap">
                    {log.actionType}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-300 whitespace-nowrap">
                    {log.target}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
