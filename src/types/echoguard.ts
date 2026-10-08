export type PodStatus = 'Running' | 'CrashLoopBackOff' | 'OOMKilled' | 'Error' | 'Pending' | 'Terminating';

export interface PodMetric {
  podId: string;
  name: string;
  deploymentName: string;
  namespace: string;
  nodeName: string;
  status: PodStatus;
  restarts: number;
  cpuPercent: number; // 0-100%
  memPercent: number; // 0-100%
  errorRate: number; // 0-100%
  latencyMs: number;
  age: string;
  image: string;
  ip: string;
}

export interface NodeHealth {
  name: string;
  role: 'control-plane' | 'worker';
  status: 'Ready' | 'NotReady';
  cpuCores: number;
  cpuUsagePercent: number;
  memTotalGb: number;
  memUsagePercent: number;
  podCount: number;
  maxPods: number;
  kubeletVersion: string;
}

export interface DeploymentStatus {
  name: string;
  namespace: string;
  replicasDesired: number;
  replicasReady: number;
  imageCurrent: string;
  imageStable: string;
  version: string;
  strategy: 'RollingUpdate' | 'Recreate';
  status: 'Healthy' | 'Degraded' | 'Healing' | 'RollingBack';
}

export interface TelemetryPoint {
  timestamp: number;
  timeStr: string;
  avgCpu: number;
  avgMemory: number;
  errorRate: number;
  p99Latency: number;
  requestsPerSec: number;
  anomalyScore: number;
}

export type RiskTier = 'low' | 'medium' | 'high';

export interface ActionCandidate {
  id: string;
  type: 'restart_pod' | 'scale_replicas' | 'rollback' | 'reroute_traffic' | 'config_update';
  title: string;
  description: string;
  targetResource: string;
  riskTier: RiskTier;
  autoExecutable: boolean;
  requiresApproval: boolean;
  projectedCpuReduction: number;
  projectedMemReduction: number;
  projectedErrorReduction: number;
  projectedRecoveryTimeSec: number;
  riskScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  efficacyScore: number; // 0 - 100
}

export interface DigitalTwinSimulation {
  incidentId: string;
  evaluatedAt: number;
  baselineMetrics: {
    cpuPercent: number;
    memPercent: number;
    errorRate: number;
    latencyMs: number;
  };
  candidates: ActionCandidate[];
  recommendedActionId: string;
  rationale: string;
}

export interface GeminiRCA {
  probableRootCause: string;
  confidenceScore: number; // 0.0 - 1.0
  failureMechanism: string;
  affectedComponents: string[];
  evidenceTrail: string[];
  recommendedAction: string;
  analysisSummary: string;
  rawResponseTimestamp: number;
}

export interface RemediationAction {
  id: string;
  incidentId: string;
  type: 'restart_pod' | 'scale_replicas' | 'rollback' | 'reroute_traffic' | 'config_update';
  targetResource: string;
  riskTier: RiskTier;
  status: 'pending_approval' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed';
  initiatedBy: 'autonomous_agent' | 'human_engineer';
  initiatedAt: number;
  completedAt?: number;
  executionLog: string[];
  approvedBy?: string;
  rejectionReason?: string;
  beforeMetrics?: {
    cpu: number;
    mem: number;
    errorRate: number;
  };
  afterMetrics?: {
    cpu: number;
    mem: number;
    errorRate: number;
  };
  verificationResult?: 'recovered' | 'partial' | 'failed';
}

export interface Incident {
  id: string;
  correlationId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetDeployment: string;
  targetPod?: string;
  status: 'active' | 'investigating' | 'healing' | 'pending_approval' | 'resolved';
  detectedAt: number;
  resolvedAt?: number;
  anomalyScore: number; // 0.0 - 1.0
  symptoms: string[];
  geminiDiagnosis?: GeminiRCA;
  digitalTwinSimulation?: DigitalTwinSimulation;
  remediationAction?: RemediationAction;
  mttrSeconds?: number;
  pipelineStage:
    | 'telemetry_collection'
    | 'anomaly_detection'
    | 'correlation'
    | 'gemini_diagnosis'
    | 'prediction'
    | 'digital_twin_simulation'
    | 'safety_policy_evaluation'
    | 'healing_execution'
    | 'verification'
    | 'learning_recorded';
}

export interface ClusterEvent {
  id: string;
  timestamp: number;
  type: 'Normal' | 'Warning' | 'Error';
  reason: string;
  object: string;
  message: string;
}

export interface ClusterState {
  healthy: boolean;
  clusterName: string;
  kubernetesVersion: string;
  nodes: NodeHealth[];
  deployments: DeploymentStatus[];
  pods: PodMetric[];
  activeIncidentCount: number;
  pendingApprovalsCount: number;
  systemUptimeSeconds: number;
  totalIncidentsResolved: number;
  autonomousRemediationsCount: number;
  averageMttrSeconds: number;
}
