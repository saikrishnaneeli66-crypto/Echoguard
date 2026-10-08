import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Incident,
  RemediationAction,
  TelemetryPoint,
  ClusterEvent,
} from '../types/echoguard.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'echoguard-db.json');

export interface AuditRecord {
  id: string;
  timestamp: number;
  actor: 'Autonomous Agent' | 'Human Engineer' | 'System Operator' | 'Chaos Injector';
  actionType: string;
  target: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SafetyPolicyRule {
  actionType: 'restart_pod' | 'scale_replicas' | 'rollback' | 'reroute_traffic' | 'config_update';
  riskTier: 'low' | 'medium' | 'high';
  autoExecutable: boolean;
  maxDailyExecutions: number;
  cooldownPeriodSec: number;
  blastRadiusTolerance: 'pod' | 'deployment' | 'cluster';
}

export interface DatabaseSchema {
  incidents: Incident[];
  actions: RemediationAction[];
  events: ClusterEvent[];
  telemetryHistory: TelemetryPoint[];
  auditTrail: AuditRecord[];
  safetyPolicies: SafetyPolicyRule[];
  stats: {
    systemUptimeSeconds: number;
    totalIncidentsResolved: number;
    autonomousRemediationsCount: number;
    averageMttrSeconds: number;
  };
}

const DEFAULT_POLICIES: SafetyPolicyRule[] = [
  {
    actionType: 'restart_pod',
    riskTier: 'low',
    autoExecutable: true,
    maxDailyExecutions: 50,
    cooldownPeriodSec: 15,
    blastRadiusTolerance: 'pod',
  },
  {
    actionType: 'scale_replicas',
    riskTier: 'medium',
    autoExecutable: true,
    maxDailyExecutions: 20,
    cooldownPeriodSec: 30,
    blastRadiusTolerance: 'deployment',
  },
  {
    actionType: 'rollback',
    riskTier: 'high',
    autoExecutable: false, // Mandates Human Approval
    maxDailyExecutions: 5,
    cooldownPeriodSec: 120,
    blastRadiusTolerance: 'deployment',
  },
  {
    actionType: 'reroute_traffic',
    riskTier: 'high',
    autoExecutable: false, // Mandates Human Approval
    maxDailyExecutions: 10,
    cooldownPeriodSec: 60,
    blastRadiusTolerance: 'cluster',
  },
  {
    actionType: 'config_update',
    riskTier: 'high',
    autoExecutable: false, // Mandates Human Approval
    maxDailyExecutions: 5,
    cooldownPeriodSec: 180,
    blastRadiusTolerance: 'deployment',
  },
];

class EchoGuardDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data dir:', err);
      }
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed reading existing db file, initializing fresh store:', err);
    }

    return {
      incidents: [],
      actions: [],
      events: [
        {
          id: 'evt-init-01',
          timestamp: Date.now() - 3600000,
          type: 'Normal',
          reason: 'NodeReady',
          object: 'node/k8s-control-plane-01',
          message: 'Node k8s-control-plane-01 status is now Ready',
        },
        {
          id: 'evt-init-02',
          timestamp: Date.now() - 3500000,
          type: 'Normal',
          reason: 'Scheduled',
          object: 'pod/checkout-service-784f9bc-2k8l1',
          message: 'Successfully assigned production/checkout-service-784f9bc-2k8l1 to worker-alpha',
        },
      ],
      telemetryHistory: [],
      auditTrail: [
        {
          id: `audit-init-${Date.now()}`,
          timestamp: Date.now() - 3600000,
          actor: 'System Operator',
          actionType: 'CLUSTER_INIT',
          target: 'k8s-production-cluster',
          details: 'EchoGuard Autonomous Incident Commander cluster supervisor initialized.',
          severity: 'INFO',
        },
      ],
      safetyPolicies: DEFAULT_POLICIES,
      stats: {
        systemUptimeSeconds: 148200,
        totalIncidentsResolved: 8,
        autonomousRemediationsCount: 6,
        averageMttrSeconds: 5.2,
      },
    };
  }

  public save() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  // --- Incidents ---
  public getIncidents(): Incident[] {
    return this.data.incidents;
  }

  public addIncident(incident: Incident) {
    this.data.incidents.unshift(incident);
    this.addAudit({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      actor: 'Autonomous Agent',
      actionType: 'INCIDENT_DETECTED',
      target: incident.targetDeployment,
      details: `Incident [${incident.id}] detected: ${incident.title} (Severity: ${incident.severity})`,
      severity: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    });
    this.save();
  }

  public updateIncident(id: string, updates: Partial<Incident>) {
    const idx = this.data.incidents.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.data.incidents[idx] = { ...this.data.incidents[idx], ...updates };
      this.save();
    }
  }

  // --- Actions ---
  public getActions(): RemediationAction[] {
    return this.data.actions;
  }

  public addAction(action: RemediationAction) {
    this.data.actions.unshift(action);
    this.addAudit({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      actor: action.initiatedBy === 'autonomous_agent' ? 'Autonomous Agent' : 'Human Engineer',
      actionType: 'ACTION_ENQUEUED',
      target: action.targetResource,
      details: `Action [${action.type}] enqueued. Status: ${action.status}, Risk: ${action.riskTier.toUpperCase()}`,
      severity: action.riskTier === 'high' ? 'WARNING' : 'INFO',
    });
    this.save();
  }

  public updateAction(id: string, updates: Partial<RemediationAction>) {
    const idx = this.data.actions.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.data.actions[idx] = { ...this.data.actions[idx], ...updates };
      this.save();
    }
  }

  // --- Audit Trail ---
  public getAuditTrail(): AuditRecord[] {
    return this.data.auditTrail.slice(0, 100);
  }

  public addAudit(record: AuditRecord) {
    this.data.auditTrail.unshift(record);
    if (this.data.auditTrail.length > 200) {
      this.data.auditTrail.pop();
    }
  }

  // --- Safety Policies ---
  public getPolicies(): SafetyPolicyRule[] {
    return this.data.safetyPolicies;
  }

  // --- Events ---
  public getEvents(): ClusterEvent[] {
    return this.data.events;
  }

  public addEvent(evt: ClusterEvent) {
    this.data.events.push(evt);
    if (this.data.events.length > 100) {
      this.data.events.shift();
    }
    this.save();
  }

  // --- Stats ---
  public getStats() {
    return this.data.stats;
  }

  public updateStats(updater: (prev: DatabaseSchema['stats']) => DatabaseSchema['stats']) {
    this.data.stats = updater(this.data.stats);
    this.save();
  }

  public resetAll() {
    this.data.incidents = [];
    this.data.actions = [];
    this.addAudit({
      id: `audit-reset-${Date.now()}`,
      timestamp: Date.now(),
      actor: 'Human Engineer',
      actionType: 'SYSTEM_RESET',
      target: 'cluster/all',
      details: 'All active incidents and pending actions purged; cluster reset to baseline.',
      severity: 'INFO',
    });
    this.save();
  }
}

export const db = new EchoGuardDatabase();
