import type {
  ClusterState,
  Incident,
  TelemetryPoint,
  ClusterEvent,
  RemediationAction,
  DigitalTwinSimulation,
} from '../types/echoguard.ts';
import type { AuditRecord, SafetyPolicyRule } from '../server/db.ts';

export interface AcademicProjectInfo {
  institution: string;
  department: string;
  class: string;
  academicYear: string;
  batchId: string;
  projectTitle: string;
  teamMembers: Array<{
    sNo: number;
    rollNumber: string;
    name: string;
    email: string;
    phone: string;
  }>;
  guide: {
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
    areaOfInterest: string;
  };
}

export const api = {
  async getClusterStatus(): Promise<ClusterState> {
    const res = await fetch('/api/cluster/status');
    if (!res.ok) throw new Error('Failed to fetch cluster status');
    return res.json();
  },

  async getTelemetryHistory(): Promise<TelemetryPoint[]> {
    const res = await fetch('/api/telemetry/history');
    if (!res.ok) throw new Error('Failed to fetch telemetry history');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getEvents(): Promise<ClusterEvent[]> {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getPendingActions(): Promise<RemediationAction[]> {
    const res = await fetch('/api/actions/pending');
    if (!res.ok) throw new Error('Failed to fetch pending actions');
    return res.json();
  },

  async getAuditLog(): Promise<AuditRecord[]> {
    const res = await fetch('/api/audit-log');
    if (!res.ok) throw new Error('Failed to fetch audit log');
    return res.json();
  },

  async getSafetyPolicies(): Promise<SafetyPolicyRule[]> {
    const res = await fetch('/api/safety-policies');
    if (!res.ok) throw new Error('Failed to fetch safety policies');
    return res.json();
  },

  async approveAction(id: string, approvedBy = 'SRE Lead (Human)'): Promise<{ success: boolean; action: RemediationAction }> {
    const res = await fetch(`/api/actions/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy }),
    });
    if (!res.ok) throw new Error('Failed to approve action');
    return res.json();
  },

  async rejectAction(id: string, rejectionReason: string, rejectedBy = 'SRE Lead (Human)'): Promise<{ success: boolean; action: RemediationAction }> {
    const res = await fetch(`/api/actions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason, rejectedBy }),
    });
    if (!res.ok) throw new Error('Failed to reject action');
    return res.json();
  },

  async injectChaos(faultType: string): Promise<{ success: boolean; message: string; incidentId: string }> {
    const res = await fetch('/api/chaos/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faultType }),
    });
    if (!res.ok) throw new Error('Failed to inject chaos fault');
    return res.json();
  },

  async simulateDigitalTwin(deploymentName: string, incidentType: string): Promise<DigitalTwinSimulation> {
    const res = await fetch('/api/digital-twin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deploymentName, incidentType }),
    });
    if (!res.ok) throw new Error('Failed to simulate digital twin');
    return res.json();
  },

  async resetCluster(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/cluster/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset cluster');
    return res.json();
  },

  async getAcademicInfo(): Promise<AcademicProjectInfo> {
    const res = await fetch('/api/academic-info');
    if (!res.ok) throw new Error('Failed to fetch academic metadata');
    return res.json();
  },
};
