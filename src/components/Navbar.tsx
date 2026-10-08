import React from 'react';
import {
  ShieldAlert,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  Zap,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clusterHealthy: boolean;
  activeIncidentsCount: number;
  pendingApprovalsCount: number;
  onOpenChaos: () => void;
  onOpenAcademic: () => void;
  onResetCluster: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clusterHealthy,
  activeIncidentsCount,
  pendingApprovalsCount,
  onOpenChaos,
  onOpenAcademic,
  onResetCluster,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Cluster Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">EchoGuard</span>
              <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-400 uppercase border border-cyan-800/50">
                AIOps Commander
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>k8s-us-east · v1.30.2</span>
              <span className="text-slate-600">|</span>
              {clusterHealthy ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Nominal
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 text-[11px] font-medium animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Incident Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Cluster & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'incidents'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Incidents & AI Pipeline
            {activeIncidentsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50 animate-bounce">
                {activeIncidentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'approvals'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Approval Queue
            {pendingApprovalsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950 animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('digital-twin')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'digital-twin'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Digital Twin Sandbox
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Audit Log & Policies
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Chaos Fault Injection button */}
          <button
            onClick={onOpenChaos}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-amber-500 transition-all active:scale-95"
            title="Inject chaos faults (bad deployment, memory leak, cpu spike)"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Chaos Fault Lab</span>
          </button>

          {/* Reset Cluster button */}
          <button
            onClick={onResetCluster}
            disabled={isResetting}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Restore baseline nominal state"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Academic Info */}
          <button
            onClick={onOpenAcademic}
            className="flex items-center gap-1 rounded-lg border border-indigo-800/60 bg-indigo-950/60 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-900/60 transition-colors"
            title="Vardhaman College of Engineering Phase-I project details"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">VCE Phase-I</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-2 overflow-x-auto gap-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'overview' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'}`}
        >
          Cluster Health
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${activeTab === 'incidents' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'}`}
        >
          Incidents {activeIncidentsCount > 0 && `(${activeIncidentsCount})`}
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${activeTab === 'approvals' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'}`}
        >
          Approvals {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}
        </button>
        <button
          onClick={() => setActiveTab('digital-twin')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'digital-twin' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'}`}
        >
          Digital Twin
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'audit' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'}`}
        >
          Audit & Policy
        </button>
      </div>
    </header>
  );
};
