import React, { useState, useEffect, useCallback } from 'react';
import type {
  ClusterState,
  TelemetryPoint,
  Incident,
  RemediationAction,
} from './types/echoguard.ts';
import type { AuditRecord, SafetyPolicyRule } from './server/db.ts';
import { api, type AcademicProjectInfo } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { LiveTelemetryChart } from './components/LiveTelemetryChart.tsx';
import { ClusterTopology } from './components/ClusterTopology.tsx';
import { IncidentFeed } from './components/IncidentFeed.tsx';
import { ApprovalQueue } from './components/ApprovalQueue.tsx';
import { DigitalTwinExplorer } from './components/DigitalTwinExplorer.tsx';
import { AuditPolicyView } from './components/AuditPolicyView.tsx';
import { ChaosModal } from './components/ChaosModal.tsx';
import { AcademicModal } from './components/AcademicModal.tsx';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [clusterState, setClusterState] = useState<ClusterState | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingActions, setPendingActions] = useState<RemediationAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [policies, setPolicies] = useState<SafetyPolicyRule[]>([]);
  const [academicInfo, setAcademicInfo] = useState<AcademicProjectInfo | null>(null);

  const [isChaosModalOpen, setIsChaosModalOpen] = useState<boolean>(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Poll cluster data
  const refreshData = useCallback(async () => {
    try {
      const [statusRes, telemetryRes, incRes, actRes, auditRes, policyRes] = await Promise.all([
        api.getClusterStatus(),
        api.getTelemetryHistory(),
        api.getIncidents(),
        api.getPendingActions(),
        api.getAuditLog(),
        api.getSafetyPolicies(),
      ]);

      setClusterState(statusRes);
      setTelemetry(telemetryRes);
      setIncidents(incRes);
      setPendingActions(actRes);
      setAuditLogs(auditRes);
      setPolicies(policyRes);
    } catch (err) {
      console.warn('Telemetry refresh cycle warning:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    api.getAcademicInfo().then(setAcademicInfo).catch(console.warn);

    const interval = setInterval(refreshData, 2500);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handle Approve Action
  const handleApproveAction = async (id: string, approver: string) => {
    try {
      const res = await api.approveAction(id, approver);
      showToast(`Action approved by ${approver}. Kubernetes Healing Agent dispatched.`);
      await refreshData();
    } catch (err) {
      console.error('Approval failed:', err);
      showToast('Error approving remediation action.');
    }
  };

  // Handle Reject Action
  const handleRejectAction = async (id: string, reason: string) => {
    try {
      await api.rejectAction(id, reason);
      showToast('Action rejected. Incident status updated.');
      await refreshData();
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast('Error rejecting remediation action.');
    }
  };

  // Handle Chaos Injection
  const handleInjectChaos = async (faultType: string) => {
    try {
      const res = await api.injectChaos(faultType);
      showToast(`Chaos fault injected: ${faultType}! EchoGuard pipeline active.`);
      setActiveTab('incidents');
      await refreshData();
    } catch (err) {
      console.error('Chaos injection failed:', err);
      showToast('Error triggering chaos scenario.');
    }
  };

  // Handle Cluster Reset
  const handleResetCluster = async () => {
    setIsResetting(true);
    try {
      await api.resetCluster();
      showToast('Cluster restored to 100% nominal state.');
      await refreshData();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const activeIncidentsCount = clusterState?.activeIncidentCount || 0;
  const pendingApprovalsCount = pendingActions.length;
  const isHealthy = clusterState?.healthy ?? true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-slide-up">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clusterHealthy={isHealthy}
        activeIncidentsCount={activeIncidentsCount}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenChaos={() => setIsChaosModalOpen(true)}
        onOpenAcademic={() => setIsAcademicModalOpen(true)}
        onResetCluster={handleResetCluster}
        isResetting={isResetting}
      />

      {/* Top Banner & SRE Key Performance Indicators */}
      <section className="border-b border-slate-800/80 bg-slate-900/30 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* KPI 1 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cluster Health
              </span>
              <div className="mt-1 flex items-center gap-1.5 font-bold text-sm">
                <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
                <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>
                  {isHealthy ? '100% Nominal' : 'DEGRADED'}
                </span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Incidents
              </span>
              <div className="mt-1 text-sm font-extrabold text-white font-mono flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <span>{activeIncidentsCount}</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Approval Queue
              </span>
              <div className="mt-1 text-sm font-extrabold text-amber-400 font-mono flex items-center gap-1.5">
                <Cpu className="h-4 w-4" />
                <span>{pendingApprovalsCount}</span>
                {pendingApprovalsCount > 0 && <span className="text-[10px] text-amber-300 font-sans">Pending</span>}
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Avg MTTR (Recovery)
              </span>
              <div className="mt-1 text-sm font-extrabold text-white font-mono flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>{clusterState?.averageMttrSeconds || 4.8}s</span>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Resolved
              </span>
              <div className="mt-1 text-sm font-extrabold text-white font-mono flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                <span>{clusterState?.totalIncidentsResolved || 12}</span>
              </div>
            </div>

            {/* KPI 6 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Auto-Remediation Rate
              </span>
              <div className="mt-1 text-sm font-extrabold text-cyan-400 font-mono flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                <span>83.3%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <LiveTelemetryChart data={telemetry} />
            {clusterState && (
              <ClusterTopology
                nodes={clusterState.nodes}
                deployments={clusterState.deployments}
                pods={clusterState.pods}
              />
            )}
          </div>
        )}

        {activeTab === 'incidents' && (
          <IncidentFeed
            incidents={incidents}
            onSelectActionForApproval={() => setActiveTab('approvals')}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueue
            pendingActions={pendingActions}
            incidents={incidents}
            onApprove={handleApproveAction}
            onReject={handleRejectAction}
          />
        )}

        {activeTab === 'digital-twin' && clusterState && (
          <DigitalTwinExplorer deployments={clusterState.deployments} />
        )}

        {activeTab === 'audit' && (
          <AuditPolicyView auditLogs={auditLogs} policies={policies} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-300">EchoGuard — Autonomous Incident Commander</span>
            <span className="mx-2">·</span>
            <span>Kubernetes Control Plane Supervisor & Gemini RCA Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAcademicModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Vardhaman College of Engineering · CSE Batch 24MPCS-A18
            </button>
            <span>·</span>
            <span className="font-mono text-slate-400">Node/Express + Vite + React 19</span>
          </div>
        </div>
      </footer>

      {/* Chaos Injection Modal */}
      <ChaosModal
        isOpen={isChaosModalOpen}
        onClose={() => setIsChaosModalOpen(false)}
        onInject={handleInjectChaos}
      />

      {/* Academic Project Info Modal */}
      <AcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        info={academicInfo}
      />
    </div>
  );
}
