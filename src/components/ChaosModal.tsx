import React, { useState } from 'react';
import {
  Zap,
  X,
  Flame,
  AlertTriangle,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ChaosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (faultType: string) => Promise<void>;
}

export const ChaosModal: React.FC<ChaosModalProps> = ({ isOpen, onClose, onInject }) => {
  const [selectedFault, setSelectedFault] = useState<string>('bad_deployment');
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'bad_deployment',
      title: 'Bad Canary Deployment v1.4.2 (HTTP 500 Spike)',
      target: 'checkout-service',
      severity: 'CRITICAL',
      icon: Flame,
      color: 'from-rose-500 to-red-600',
      description:
        'Deploys an updated image tag containing a critical deserialization regression. Causes 68% HTTP 500 responses across ingress routes.',
      expectedAgentResponse:
        'Digital Twin recommends Rollback. Safety Policy classifies as HIGH RISK → Enqueues to Human Approval Queue.',
    },
    {
      id: 'oom_killed',
      title: 'Memory Leak & Cgroup OOMKilled (Exit Code 137)',
      target: 'payment-gateway',
      severity: 'CRITICAL',
      icon: AlertTriangle,
      color: 'from-amber-500 to-rose-600',
      description:
        'Unbounded connection buffer growth breaches the 512Mi memory ceiling. Linux kernel invokes OOM-killer SIGKILL.',
      expectedAgentResponse:
        'Prediction agent detects steep gradient. Digital Twin selects Pod Purge. Safety Policy authorizes Autonomous Pod Restart.',
    },
    {
      id: 'cpu_spike',
      title: 'Worker Thread Starvation (98% CPU Spike)',
      target: 'catalog-db',
      severity: 'HIGH',
      icon: Cpu,
      color: 'from-amber-500 to-yellow-600',
      description:
        'Heavy unindexed search query backlog saturates all allocated vCPU cores. p99 response latency degrades to 520ms.',
      expectedAgentResponse:
        'Isolation Forest flags CPU anomaly. Digital Twin recommends Auto-Scaling (+2 Replicas). Safety Policy authorizes auto-scale.',
    },
    {
      id: 'crash_loop',
      title: 'CrashLoopBackOff (Missing Config Secret)',
      target: 'auth-service',
      severity: 'HIGH',
      icon: Layers,
      color: 'from-blue-500 to-cyan-600',
      description:
        'Container crashes upon boot due to missing DATABASE_ENCRYPTION_KEY environment secret. Kubelet enters exponential BackOff.',
      expectedAgentResponse:
        'Gemini RCA isolates missing ConfigMap key. Autonomous Healing agent patches config and recycles pod.',
    },
  ];

  const handleInject = async () => {
    setIsInjecting(true);
    try {
      await onInject(selectedFault);
      onClose();
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-rose-800/80 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Chaos Fault Engineering Lab
              </h3>
              <p className="text-xs text-slate-400">
                Inject production failure scenarios into the Kubernetes cluster to test the EchoGuard Multi-Agent system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="mt-4 space-y-3">
          {scenarios.map((sc) => {
            const isSelected = selectedFault === sc.id;
            const Icon = sc.icon;

            return (
              <div
                key={sc.id}
                onClick={() => setSelectedFault(sc.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-950/30 shadow-md ring-1 ring-rose-500/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr ${sc.color} text-white shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{sc.title}</h4>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>Target: {sc.target}</span>
                        <span>·</span>
                        <span className="text-rose-400 font-bold">{sc.severity}</span>
                      </div>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="scenario"
                    checked={isSelected}
                    onChange={() => setSelectedFault(sc.id)}
                    className="mt-1 h-4 w-4 text-rose-500 focus:ring-rose-500"
                  />
                </div>

                <p className="mt-2 text-[11px] text-slate-300 leading-relaxed pl-10">
                  {sc.description}
                </p>

                <div className="mt-2 text-[10px] text-cyan-300 font-mono pl-10 border-t border-slate-800/60 pt-1.5 flex items-center gap-1.5">
                  <span className="font-bold text-slate-400">Pipeline Flow:</span>
                  <span>{sc.expectedAgentResponse}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-400">
            Agents will trigger immediately upon injection
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleInject}
              disabled={isInjecting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-amber-500 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>{isInjecting ? 'Injecting Chaos...' : 'Trigger Chaos Fault'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
