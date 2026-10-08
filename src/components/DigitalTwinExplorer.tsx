import React, { useState, useEffect } from 'react';
import type { DeploymentStatus, DigitalTwinSimulation } from '../types/echoguard.ts';
import { api } from '../services/api.ts';
import {
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface DigitalTwinExplorerProps {
  deployments: DeploymentStatus[];
}

export const DigitalTwinExplorer: React.FC<DigitalTwinExplorerProps> = ({ deployments }) => {
  const [selectedService, setSelectedService] = useState<string>(deployments[0]?.name || 'checkout-service');
  const [selectedScenario, setSelectedScenario] = useState<string>('bad_deployment');
  const [simulation, setSimulation] = useState<DigitalTwinSimulation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const result = await api.simulateDigitalTwin(selectedService, selectedScenario);
      setSimulation(result);
    } catch (err) {
      console.error('Failed to run twin simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [selectedService, selectedScenario]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-indigo-800/60 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Layers className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Digital Twin Sandbox & "What-If" State Projector
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              As described in the EchoGuard architecture, the Digital Twin is a predictive state-projection model.
              Before modifying the live Kubernetes cluster, it models the mathematical impact of candidate actions on CPU,
              memory cgroups, error rates, and blast radius.
            </p>
          </div>

          {/* Quick interactive trigger */}
          <button
            onClick={runSimulation}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-run Simulation</span>
          </button>
        </div>

        {/* Configuration Selectors */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Monitored Target Microservice:
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
            >
              {deployments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} (Replicas: {d.replicasDesired}, Tag: {d.imageCurrent.split(':')[1]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Simulated Failure Hypothesis:
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="bad_deployment">Bad Canary Deployment (Elevated 500 Responses)</option>
              <option value="oom_killed">Memory Heap Leak (Escalating cgroup consumption)</option>
              <option value="cpu_spike">Compute Thread Saturation (Query Queue Spikes)</option>
              <option value="crash_loop">Missing Configuration Secret (CrashLoopBackOff)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Simulation Results Grid */}
      {simulation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Candidate Remediation Strategies Evaluated by Digital Twin
            </h4>
            <span className="text-xs text-slate-400">
              Simulated At: {new Date(simulation.evaluatedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Rationale Callout */}
          <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-4 text-xs">
            <span className="font-bold text-indigo-300 block mb-1">Optimal Strategy Selected by Twin:</span>
            <p className="text-slate-300 leading-relaxed">{simulation.rationale}</p>
          </div>

          {/* Candidates Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {simulation.candidates.map((cand) => {
              const isSelected = cand.id === simulation.recommendedActionId;

              return (
                <div
                  key={cand.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-950/30 shadow-xl ring-2 ring-indigo-500/40'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                          cand.riskTier === 'high'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-800'
                            : cand.riskTier === 'medium'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-800'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        Risk: {cand.riskTier}
                      </span>

                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-400 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Recommended
                        </span>
                      )}
                    </div>

                    <h5 className="text-sm font-bold text-white tracking-tight">{cand.title}</h5>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{cand.description}</p>
                  </div>

                  {/* Projected Metrics Table */}
                  <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Error Relief:</span>
                      <span className="font-mono font-bold text-emerald-400">-{cand.projectedErrorReduction}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CPU Relief:</span>
                      <span className="font-mono font-bold text-cyan-400">-{cand.projectedCpuReduction}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Memory Relief:</span>
                      <span className="font-mono font-bold text-purple-400">-{cand.projectedMemReduction}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Est. Recovery Time:</span>
                      <span className="font-mono font-bold text-white">{cand.projectedRecoveryTimeSec}s</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Safety Policy Gate:</span>
                      <span
                        className={`font-bold ${
                          cand.autoExecutable ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {cand.autoExecutable ? 'Auto-Execute' : 'Needs Approval'}
                      </span>
                    </div>

                    {/* Efficacy vs Risk Meters */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Efficacy Score</span>
                        <span className="font-mono font-bold text-indigo-300">{cand.efficacyScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${cand.efficacyScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
