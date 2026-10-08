import React, { useState } from 'react';
import type { NodeHealth, DeploymentStatus, PodMetric } from '../types/echoguard.ts';
import {
  Server,
  Box,
  Cpu,
  Database,
  Terminal,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
} from 'lucide-react';

interface ClusterTopologyProps {
  nodes: NodeHealth[];
  deployments: DeploymentStatus[];
  pods: PodMetric[];
}

export const ClusterTopology: React.FC<ClusterTopologyProps> = ({ nodes, deployments, pods }) => {
  const [selectedPod, setSelectedPod] = useState<PodMetric | null>(null);

  const getStatusBadge = (status: PodMetric['status']) => {
    switch (status) {
      case 'Running':
        return (
          <span className="flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3" /> Running
          </span>
        );
      case 'OOMKilled':
        return (
          <span className="flex items-center gap-1 rounded bg-rose-950/90 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-800 animate-pulse">
            <XCircle className="h-3 w-3" /> OOMKilled (137)
          </span>
        );
      case 'CrashLoopBackOff':
        return (
          <span className="flex items-center gap-1 rounded bg-amber-950/90 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-800 animate-pulse">
            <AlertCircle className="h-3 w-3" /> CrashLoopBackOff
          </span>
        );
      case 'Terminating':
        return (
          <span className="flex items-center gap-1 rounded bg-cyan-950 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-800">
            Terminating...
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cluster Nodes Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Kubernetes Cluster Nodes</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {nodes.length} Nodes Active · Kubelet v1.30.2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.map((node) => (
            <div
              key={node.name}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono truncate">{node.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-cyan-400">
                  {node.role}
                </span>
              </div>

              {/* Node Metrics Meters */}
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>CPU ({node.cpuCores} Cores)</span>
                    <span className="font-mono text-slate-200">{node.cpuUsagePercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.cpuUsagePercent > 80 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${node.cpuUsagePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Memory ({node.memTotalGb}GB)</span>
                    <span className="font-mono text-slate-200">{node.memUsagePercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.memUsagePercent > 85 ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${node.memUsagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>Capacity: {node.podCount} / {node.maxPods} Pods</span>
                  <span className="text-emerald-400 font-semibold">● Ready</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Microservice Deployments Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Active Deployments (Production Namespace)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {deployments.length} Services Supervised
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {deployments.map((dep) => (
            <div
              key={dep.name}
              className={`rounded-xl border p-4 transition-all ${
                dep.status === 'Degraded'
                  ? 'border-rose-700/80 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-mono">{dep.name}</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    dep.status === 'Degraded'
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-700 animate-pulse'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {dep.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Replicas</span>
                  <span className="font-bold text-white font-mono">
                    {dep.replicasReady} / {dep.replicasDesired} Ready
                  </span>
                </div>
                <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Current Image</span>
                  <span className="font-mono text-[11px] text-cyan-300 truncate block" title={dep.imageCurrent}>
                    {dep.imageCurrent.split(':')[1] || dep.imageCurrent}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Stable: <span className="font-mono text-slate-300">{dep.imageStable.split(':')[1]}</span></span>
                <span>Strategy: {dep.strategy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Pods Matrix Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Monitored Pods Telemetry Matrix</h3>
          </div>
          <span className="text-xs text-slate-400">Click any pod to inspect live container cgroups & logs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pods.map((pod) => (
            <div
              key={pod.podId}
              onClick={() => setSelectedPod(pod)}
              className={`group cursor-pointer rounded-xl border p-3.5 transition-all hover:scale-[1.01] ${
                pod.status === 'OOMKilled' || pod.status === 'CrashLoopBackOff' || pod.errorRate > 10
                  ? 'border-rose-800/80 bg-rose-950/30 shadow-lg shadow-rose-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                  {pod.name}
                </span>
                {getStatusBadge(pod.status)}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>{pod.deploymentName}</span>
                <span className="text-slate-500">{pod.ip}</span>
              </div>

              {/* Resource Bars */}
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>CPU Usage</span>
                    <span className="font-mono text-slate-200">{pod.cpuPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pod.cpuPercent > 80 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, pod.cpuPercent)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>cgroup Memory</span>
                    <span className="font-mono text-slate-200">{pod.memPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pod.memPercent > 85 ? 'bg-rose-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, pod.memPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pod Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                <span className={pod.restarts > 0 ? 'text-amber-400 font-semibold' : ''}>
                  Restarts: {pod.restarts}
                </span>
                <span className={pod.errorRate > 1 ? 'text-rose-400 font-bold' : ''}>
                  Error: {pod.errorRate}%
                </span>
                <span>p99: {pod.latencyMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pod Deep Inspection Modal */}
      {selectedPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">{selectedPod.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Node: {selectedPod.nodeName} · IP: {selectedPod.ip} · Namespace: {selectedPod.namespace}
                </p>
              </div>
              <button
                onClick={() => setSelectedPod(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Status</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedPod.status}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CPU Load</span>
                <span className="text-xs font-bold text-cyan-400 mt-1 block">{selectedPod.cpuPercent}%</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Memory cgroup</span>
                <span className="text-xs font-bold text-purple-400 mt-1 block">{selectedPod.memPercent}%</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Restart Count</span>
                <span className="text-xs font-bold text-amber-400 mt-1 block">{selectedPod.restarts} times</span>
              </div>
            </div>

            {/* Container Log Console */}
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-300 mb-2 block flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                Live Container Stdout/Stderr (read_namespaced_pod_log)
              </span>
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 max-h-56 overflow-y-auto space-y-1.5 leading-relaxed">
                <div className="text-slate-500">
                  [2026-10-07T21:48:12Z] INFO: Container {selectedPod.name} started PID 1
                </div>
                <div className="text-slate-400">
                  [2026-10-07T21:48:15Z] HTTP /api/v1/healthz 200 OK (3.2ms)
                </div>
                {selectedPod.errorRate > 5 && (
                  <div className="text-rose-400 font-semibold">
                    [2026-10-07T21:49:02Z] ERROR: Unhandled exception in worker pipeline: HTTP 500 status dispatched to caller!
                  </div>
                )}
                {selectedPod.status === 'OOMKilled' && (
                  <div className="text-rose-400 font-bold bg-rose-950/40 p-2 rounded border border-rose-800">
                    [KUBELET ALERT] Container memory limit of 512Mi violated (used: 508Mi). Kernel OOM-killer invoked SIGKILL (137).
                  </div>
                )}
                {selectedPod.status === 'CrashLoopBackOff' && (
                  <div className="text-amber-400 font-semibold bg-amber-950/40 p-2 rounded border border-amber-800">
                    [FATAL] ConfigMap error: Missing environment variable DATABASE_ENCRYPTION_KEY. Process exited with code 1.
                  </div>
                )}
                <div className="text-slate-500">
                  [2026-10-07T21:49:50Z] Telemetry scraper healthy. Metrics shipped to EchoGuard circular buffer.
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPod(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
