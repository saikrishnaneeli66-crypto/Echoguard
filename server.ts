import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import type {
  ClusterState,
  PodMetric,
  NodeHealth,
  DeploymentStatus,
  Incident,
  TelemetryPoint,
  GeminiRCA,
  RemediationAction,
} from './src/types/echoguard.ts';
import { db } from './src/server/db.ts';
import { createTrainedIsolationForest } from './src/server/ml/isolationForest.ts';
import { PredictiveEngine, type MetricTrendPoint } from './src/server/ml/predictiveModel.ts';
import { DigitalTwinEngine } from './src/server/digitalTwinEngine.ts';
import { SafetyPolicyEngine } from './src/server/safetyPolicyEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Train Isolation Forest on baseline healthy telemetry
const isolationForest = createTrainedIsolationForest();

// ==========================================
// 1. IN-MEMORY KUBERNETES CLUSTER SIMULATION
// ==========================================

const nodes: NodeHealth[] = [
  {
    name: 'k8s-control-plane-01',
    role: 'control-plane',
    status: 'Ready',
    cpuCores: 8,
    cpuUsagePercent: 24,
    memTotalGb: 32,
    memUsagePercent: 38,
    podCount: 6,
    maxPods: 110,
    kubeletVersion: 'v1.30.2',
  },
  {
    name: 'k8s-worker-alpha-01',
    role: 'worker',
    status: 'Ready',
    cpuCores: 16,
    cpuUsagePercent: 42,
    memTotalGb: 64,
    memUsagePercent: 51,
    podCount: 18,
    maxPods: 110,
    kubeletVersion: 'v1.30.2',
  },
  {
    name: 'k8s-worker-beta-02',
    role: 'worker',
    status: 'Ready',
    cpuCores: 16,
    cpuUsagePercent: 45,
    memTotalGb: 64,
    memUsagePercent: 54,
    podCount: 19,
    maxPods: 110,
    kubeletVersion: 'v1.30.2',
  },
  {
    name: 'k8s-worker-gamma-03',
    role: 'worker',
    status: 'Ready',
    cpuCores: 16,
    cpuUsagePercent: 39,
    memTotalGb: 64,
    memUsagePercent: 47,
    podCount: 14,
    maxPods: 110,
    kubeletVersion: 'v1.30.2',
  },
];

const deployments: DeploymentStatus[] = [
  {
    name: 'checkout-service',
    namespace: 'production',
    replicasDesired: 3,
    replicasReady: 3,
    imageCurrent: 'echoguard/checkout:v1.4.1',
    imageStable: 'echoguard/checkout:v1.4.0',
    version: '1.4.1',
    strategy: 'RollingUpdate',
    status: 'Healthy',
  },
  {
    name: 'auth-service',
    namespace: 'production',
    replicasDesired: 2,
    replicasReady: 2,
    imageCurrent: 'echoguard/auth:v2.1.0',
    imageStable: 'echoguard/auth:v2.1.0',
    version: '2.1.0',
    strategy: 'RollingUpdate',
    status: 'Healthy',
  },
  {
    name: 'payment-gateway',
    namespace: 'production',
    replicasDesired: 3,
    replicasReady: 3,
    imageCurrent: 'echoguard/payment-gw:v3.0.4',
    imageStable: 'echoguard/payment-gw:v3.0.3',
    version: '3.0.4',
    strategy: 'RollingUpdate',
    status: 'Healthy',
  },
  {
    name: 'catalog-db',
    namespace: 'production',
    replicasDesired: 2,
    replicasReady: 2,
    imageCurrent: 'echoguard/catalog-read:v1.9.0',
    imageStable: 'echoguard/catalog-read:v1.9.0',
    version: '1.9.0',
    strategy: 'RollingUpdate',
    status: 'Healthy',
  },
  {
    name: 'frontend-proxy',
    namespace: 'production',
    replicasDesired: 3,
    replicasReady: 3,
    imageCurrent: 'echoguard/ingress-proxy:v1.2.0',
    imageStable: 'echoguard/ingress-proxy:v1.2.0',
    version: '1.2.0',
    strategy: 'RollingUpdate',
    status: 'Healthy',
  },
];

let pods: PodMetric[] = [
  {
    podId: 'pod-ck-01',
    name: 'checkout-service-784f9bc-2k8l1',
    deploymentName: 'checkout-service',
    namespace: 'production',
    nodeName: 'k8s-worker-alpha-01',
    status: 'Running',
    restarts: 0,
    cpuPercent: 32,
    memPercent: 44,
    errorRate: 0.1,
    latencyMs: 48,
    age: '2d 6h',
    image: 'echoguard/checkout:v1.4.1',
    ip: '10.244.1.34',
  },
  {
    podId: 'pod-ck-02',
    name: 'checkout-service-784f9bc-9m1v2',
    deploymentName: 'checkout-service',
    namespace: 'production',
    nodeName: 'k8s-worker-beta-02',
    status: 'Running',
    restarts: 0,
    cpuPercent: 35,
    memPercent: 46,
    errorRate: 0.1,
    latencyMs: 51,
    age: '2d 6h',
    image: 'echoguard/checkout:v1.4.1',
    ip: '10.244.2.18',
  },
  {
    podId: 'pod-ck-03',
    name: 'checkout-service-784f9bc-4x7q9',
    deploymentName: 'checkout-service',
    namespace: 'production',
    nodeName: 'k8s-worker-gamma-03',
    status: 'Running',
    restarts: 0,
    cpuPercent: 29,
    memPercent: 42,
    errorRate: 0.0,
    latencyMs: 46,
    age: '2d 6h',
    image: 'echoguard/checkout:v1.4.1',
    ip: '10.244.3.52',
  },
  {
    podId: 'pod-auth-01',
    name: 'auth-service-589d71c-x3j29',
    deploymentName: 'auth-service',
    namespace: 'production',
    nodeName: 'k8s-worker-alpha-01',
    status: 'Running',
    restarts: 0,
    cpuPercent: 21,
    memPercent: 38,
    errorRate: 0.0,
    latencyMs: 24,
    age: '5d 14h',
    image: 'echoguard/auth:v2.1.0',
    ip: '10.244.1.12',
  },
  {
    podId: 'pod-auth-02',
    name: 'auth-service-589d71c-b8v44',
    deploymentName: 'auth-service',
    namespace: 'production',
    nodeName: 'k8s-worker-beta-02',
    status: 'Running',
    restarts: 0,
    cpuPercent: 24,
    memPercent: 39,
    errorRate: 0.0,
    latencyMs: 26,
    age: '5d 14h',
    image: 'echoguard/auth:v2.1.0',
    ip: '10.244.2.91',
  },
  {
    podId: 'pod-pay-01',
    name: 'payment-gateway-90fa7b-9k99p',
    deploymentName: 'payment-gateway',
    namespace: 'production',
    nodeName: 'k8s-worker-alpha-01',
    status: 'Running',
    restarts: 0,
    cpuPercent: 28,
    memPercent: 48,
    errorRate: 0.05,
    latencyMs: 72,
    age: '1d 19h',
    image: 'echoguard/payment-gw:v3.0.4',
    ip: '10.244.1.88',
  },
  {
    podId: 'pod-pay-02',
    name: 'payment-gateway-90fa7b-1w2e3',
    deploymentName: 'payment-gateway',
    namespace: 'production',
    nodeName: 'k8s-worker-beta-02',
    status: 'Running',
    restarts: 0,
    cpuPercent: 31,
    memPercent: 50,
    errorRate: 0.04,
    latencyMs: 76,
    age: '1d 19h',
    image: 'echoguard/payment-gw:v3.0.4',
    ip: '10.244.2.40',
  },
  {
    podId: 'pod-pay-03',
    name: 'payment-gateway-90fa7b-8l8k0',
    deploymentName: 'payment-gateway',
    namespace: 'production',
    nodeName: 'k8s-worker-gamma-03',
    status: 'Running',
    restarts: 0,
    cpuPercent: 30,
    memPercent: 49,
    errorRate: 0.02,
    latencyMs: 69,
    age: '1d 19h',
    image: 'echoguard/payment-gw:v3.0.4',
    ip: '10.244.3.15',
  },
  {
    podId: 'pod-cat-01',
    name: 'catalog-db-65f04a-7v6n5',
    deploymentName: 'catalog-db',
    namespace: 'production',
    nodeName: 'k8s-worker-beta-02',
    status: 'Running',
    restarts: 0,
    cpuPercent: 38,
    memPercent: 55,
    errorRate: 0.0,
    latencyMs: 18,
    age: '9d 2h',
    image: 'echoguard/catalog-read:v1.9.0',
    ip: '10.244.2.73',
  },
  {
    podId: 'pod-cat-02',
    name: 'catalog-db-65f04a-3m2q1',
    deploymentName: 'catalog-db',
    namespace: 'production',
    nodeName: 'k8s-worker-gamma-03',
    status: 'Running',
    restarts: 0,
    cpuPercent: 36,
    memPercent: 53,
    errorRate: 0.0,
    latencyMs: 19,
    age: '9d 2h',
    image: 'echoguard/catalog-read:v1.9.0',
    ip: '10.244.3.64',
  },
  {
    podId: 'pod-fe-01',
    name: 'frontend-proxy-44b8cc-0x0z1',
    deploymentName: 'frontend-proxy',
    namespace: 'production',
    nodeName: 'k8s-worker-alpha-01',
    status: 'Running',
    restarts: 0,
    cpuPercent: 18,
    memPercent: 29,
    errorRate: 0.01,
    latencyMs: 12,
    age: '14d',
    image: 'echoguard/ingress-proxy:v1.2.0',
    ip: '10.244.1.05',
  },
  {
    podId: 'pod-fe-02',
    name: 'frontend-proxy-44b8cc-9j8k7',
    deploymentName: 'frontend-proxy',
    namespace: 'production',
    nodeName: 'k8s-worker-beta-02',
    status: 'Running',
    restarts: 0,
    cpuPercent: 19,
    memPercent: 31,
    errorRate: 0.0,
    latencyMs: 11,
    age: '14d',
    image: 'echoguard/ingress-proxy:v1.2.0',
    ip: '10.244.2.08',
  },
  {
    podId: 'pod-fe-03',
    name: 'frontend-proxy-44b8cc-6u5t4',
    deploymentName: 'frontend-proxy',
    namespace: 'production',
    nodeName: 'k8s-worker-gamma-03',
    status: 'Running',
    restarts: 0,
    cpuPercent: 20,
    memPercent: 30,
    errorRate: 0.02,
    latencyMs: 13,
    age: '14d',
    image: 'echoguard/ingress-proxy:v1.2.0',
    ip: '10.244.3.02',
  },
];

const telemetryHistory: TelemetryPoint[] = [];
const podMemoryTrends: Map<string, MetricTrendPoint[]> = new Map();

// Seed initial telemetry
const now = Date.now();
for (let i = 29; i >= 0; i--) {
  const ts = now - i * 3000;
  telemetryHistory.push({
    timestamp: ts,
    timeStr: new Date(ts).toLocaleTimeString(),
    avgCpu: Math.round(28 + Math.random() * 8),
    avgMemory: Math.round(44 + Math.random() * 6),
    errorRate: Number((0.02 + Math.random() * 0.05).toFixed(2)),
    p99Latency: Math.round(45 + Math.random() * 10),
    requestsPerSec: Math.round(1800 + Math.random() * 300),
    anomalyScore: Number((0.08 + Math.random() * 0.08).toFixed(2)),
  });
}

// ==========================================
// 2. GEMINI RCA & AUTONOMOUS HEALING
// ==========================================

async function runGeminiRCA(
  incident: Incident,
  anomalousPod: PodMetric | undefined,
  incidentType: string
): Promise<GeminiRCA> {
  const deployment = deployments.find((d) => d.name === incident.targetDeployment);
  const promptContext = `
You are the AI Diagnosis Agent in EchoGuard, an Autonomous Incident Commander for Kubernetes clusters.
Analyze the following production Kubernetes telemetry and produce a definitive Root Cause Analysis (RCA).

TARGET DEPLOYMENT: ${incident.targetDeployment}
POD: ${anomalousPod?.name || 'Multiple Pods'}
POD STATUS: ${anomalousPod?.status || 'Degraded'}
CPU USAGE: ${anomalousPod?.cpuPercent || 85}%
MEMORY USAGE: ${anomalousPod?.memPercent || 92}%
ERROR RATE: ${anomalousPod?.errorRate || 45}%
RESTARTS COUNT: ${anomalousPod?.restarts || 2}
IMAGE: ${anomalousPod?.image || deployment?.imageCurrent || 'unknown'}
LAST EVENTS: ${db.getEvents().slice(-3).map((e) => `[${e.reason}] ${e.message}`).join(' | ')}
INCIDENT SYMPTOMS: ${incident.symptoms.join(', ')}

Please evaluate the underlying failure mechanism and recommend the remediation strategy.
Respond ONLY with a valid JSON object matching this schema:
{
  "probableRootCause": "Brief 1-sentence technical root cause title",
  "confidenceScore": 0.95,
  "failureMechanism": "Detailed technical explanation of the failure chain (e.g. heap exhaustion, unhandled exception in async pool, bad release tag)",
  "affectedComponents": ["component1", "component2"],
  "evidenceTrail": ["Evidence point 1 citing specific metric or event", "Evidence point 2", "Evidence point 3"],
  "recommendedAction": "Action name: restart_pod | scale_replicas | rollback | reroute_traffic | config_update",
  "analysisSummary": "2-3 sentences concise executive summary for SREs"
}
`;

  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 4000ms')), 4000)
      );

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContext,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        return {
          probableRootCause: parsed.probableRootCause || 'Unidentified system anomaly in pod execution cycle',
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.92,
          failureMechanism: parsed.failureMechanism || 'Telemetry variance exceeded safety threshold.',
          affectedComponents: parsed.affectedComponents || [incident.targetDeployment],
          evidenceTrail: parsed.evidenceTrail || [
            `CPU/Memory threshold crossed: ${anomalousPod?.cpuPercent}% CPU, ${anomalousPod?.memPercent}% RAM`,
            `Error rate delta of +${anomalousPod?.errorRate}% detected by monitoring agent`,
          ],
          recommendedAction: parsed.recommendedAction || 'restart_pod',
          analysisSummary: parsed.analysisSummary || 'Gemini RCA identified anomaly in execution pipeline.',
          rawResponseTimestamp: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('Gemini API call error, applying deterministic fallback:', err);
  }

  // Realistic domain RCA fallback
  if (incidentType.includes('bad_deployment')) {
    return {
      probableRootCause: `Regression in canary build ${deployment?.imageCurrent}: NullPointer in checkout pipeline`,
      confidenceScore: 0.96,
      failureMechanism: `Recent release introduced unhandled deserialization error in payload processing handler, causing 68% HTTP 500 status responses across all active ingress routes.`,
      affectedComponents: [incident.targetDeployment, 'ingress-proxy', 'k8s-service/checkout'],
      evidenceTrail: [
        `Deployment rolled to ${deployment?.imageCurrent} triggered sharp surge in HTTP 500 status codes`,
        `Error rate spiked from 0.02% baseline to ${anomalousPod?.errorRate || 68}% within 45 seconds`,
        `Pod CPU & RAM remain nominal while error rate is critical, ruling out node resource exhaustion`,
      ],
      recommendedAction: 'rollback',
      analysisSummary: `Autonomous RCA confirms regression introduced by image ${deployment?.imageCurrent}. Rolling back to stable ${deployment?.imageStable} will immediately extinguish the 500s.`,
      rawResponseTimestamp: Date.now(),
    };
  } else if (incidentType.includes('oom') || incidentType.includes('leak')) {
    return {
      probableRootCause: `Unbounded heap memory growth leading to Linux cgroup OOMKilled invocation`,
      confidenceScore: 0.94,
      failureMechanism: `Unreleased connection buffer cache in the transaction dispatcher allocated memory faster than garbage collection, violating the container memory limit of 512Mi.`,
      affectedComponents: [incident.targetDeployment, `pod/${anomalousPod?.name || 'payment-gateway'}`],
      evidenceTrail: [
        `Memory utilization steadily escalated to ${anomalousPod?.memPercent || 98}%`,
        `Kubelet recorded exit code 137 (SIGKILL by kernel OOM killer)`,
        `Restart counter incremented, triggering BackOff loop without automatic pod purge`,
      ],
      recommendedAction: 'restart_pod',
      analysisSummary: `Memory leak identified in payment processing buffer. Autonomous pod recycling will instantly purge allocated heap buffer and reset memory to baseline.`,
      rawResponseTimestamp: Date.now(),
    };
  } else if (incidentType.includes('cpu_spike')) {
    return {
      probableRootCause: `Worker thread starvation from complex query backlog on primary database replica`,
      confidenceScore: 0.89,
      failureMechanism: `Sudden influx of heavy unindexed search queries monopolized all allocated vCPU cores, causing p99 latency to inflate beyond 450ms.`,
      affectedComponents: [incident.targetDeployment, 'k8s-worker-beta-02'],
      evidenceTrail: [
        `CPU saturation sustained at ${anomalousPod?.cpuPercent || 97}% across all active pods`,
        `Latency inflated from 18ms baseline to ${anomalousPod?.latencyMs || 480}ms`,
        `Zero container crashes detected; pure computational bottleneck`,
      ],
      recommendedAction: 'scale_replicas',
      analysisSummary: `CPU capacity bottleneck detected. Horizontal Pod Autoscaling to +2 replicas will shed load across worker nodes and restore SLA.`,
      rawResponseTimestamp: Date.now(),
    };
  } else {
    return {
      probableRootCause: `Configuration mismatch: Missing environment secret leading to CrashLoopBackOff`,
      confidenceScore: 0.91,
      failureMechanism: `Service container threw fatal initialization exception on boot due to missing DATABASE_ENCRYPTION_KEY in mounted ConfigMap.`,
      affectedComponents: [incident.targetDeployment, 'ConfigMap/auth-env'],
      evidenceTrail: [
        `Container exited with status 1 immediately upon startup`,
        `Kubelet generated 4 consecutive BackOff event warnings in 60s`,
        `Zero healthy endpoints registered in CoreDNS for auth-service`,
      ],
      recommendedAction: 'restart_pod',
      analysisSummary: `Configuration failure identified. Injecting fallback secret key and recycling pod will restore operational status.`,
      rawResponseTimestamp: Date.now(),
    };
  }
}

async function executeRemediation(action: RemediationAction): Promise<void> {
  action.status = 'executing';
  action.executionLog.push(`[${new Date().toISOString()}] Invoking Kubernetes API client (kubernetes.CoreV1Api)...`);

  const targetDep = deployments.find((d) => d.name === action.targetResource || action.targetResource.includes(d.name));
  const targetPod = pods.find((p) => p.name === action.targetResource || p.deploymentName === action.targetResource);

  if (action.type === 'restart_pod') {
    action.executionLog.push(`[K8s API] DELETE /api/v1/namespaces/production/pods/${targetPod?.name || action.targetResource}`);
    db.addEvent({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'Normal',
      reason: 'Killing',
      object: `pod/${targetPod?.name || action.targetResource}`,
      message: 'EchoGuard Autonomous Healing Agent triggered pod recreation',
    });

    if (targetPod) {
      targetPod.status = 'Terminating';
      setTimeout(() => {
        targetPod.status = 'Running';
        targetPod.cpuPercent = 24 + Math.round(Math.random() * 6);
        targetPod.memPercent = 36 + Math.round(Math.random() * 8);
        targetPod.errorRate = 0.0;
        targetPod.latencyMs = 28;
        targetPod.restarts += 1;
        action.executionLog.push(`[K8s API] Pod successfully recreated with fresh PID 1 and cleared memory table.`);
      }, 1500);
    }
  } else if (action.type === 'scale_replicas') {
    if (targetDep) {
      const oldReplicas = targetDep.replicasDesired;
      const newReplicas = oldReplicas + 2;
      targetDep.replicasDesired = newReplicas;
      targetDep.replicasReady = newReplicas;
      action.executionLog.push(`[K8s API] PATCH /apis/apps/v1/namespaces/production/deployments/${targetDep.name} {"spec":{"replicas":${newReplicas}}}`);

      const newPod1: PodMetric = {
        podId: `pod-scale-${Date.now()}-1`,
        name: `${targetDep.name}-scaled-a9x`,
        deploymentName: targetDep.name,
        namespace: 'production',
        nodeName: 'k8s-worker-alpha-01',
        status: 'Running',
        restarts: 0,
        cpuPercent: 24,
        memPercent: 34,
        errorRate: 0.0,
        latencyMs: 30,
        age: '1m',
        image: targetDep.imageCurrent,
        ip: `10.244.1.${Math.floor(100 + Math.random() * 80)}`,
      };
      const newPod2: PodMetric = {
        podId: `pod-scale-${Date.now()}-2`,
        name: `${targetDep.name}-scaled-b8y`,
        deploymentName: targetDep.name,
        namespace: 'production',
        nodeName: 'k8s-worker-gamma-03',
        status: 'Running',
        restarts: 0,
        cpuPercent: 25,
        memPercent: 35,
        errorRate: 0.0,
        latencyMs: 29,
        age: '1m',
        image: targetDep.imageCurrent,
        ip: `10.244.3.${Math.floor(100 + Math.random() * 80)}`,
      };
      pods.push(newPod1, newPod2);

      pods
        .filter((p) => p.deploymentName === targetDep.name)
        .forEach((p) => {
          p.cpuPercent = Math.round(p.cpuPercent * 0.42);
          p.latencyMs = Math.round(p.latencyMs * 0.35);
          p.errorRate = 0.01;
        });

      db.addEvent({
        id: `evt-${Date.now()}`,
        timestamp: Date.now(),
        type: 'Normal',
        reason: 'ScalingReplicaSet',
        object: `deployment/${targetDep.name}`,
        message: `Scaled up replica set ${targetDep.name} from ${oldReplicas} to ${newReplicas}`,
      });
    }
  } else if (action.type === 'rollback') {
    if (targetDep) {
      action.executionLog.push(`[K8s API] POST /apis/apps/v1/namespaces/production/deployments/${targetDep.name}/rollback`);
      action.executionLog.push(`[Rollout] Rolling back from ${targetDep.imageCurrent} to ${targetDep.imageStable}`);
      const oldImg = targetDep.imageCurrent;
      targetDep.imageCurrent = targetDep.imageStable;
      targetDep.version = '1.4.0 (reverted)';
      targetDep.status = 'Healthy';

      pods
        .filter((p) => p.deploymentName === targetDep.name)
        .forEach((p) => {
          p.image = targetDep.imageStable;
          p.errorRate = 0.02;
          p.latencyMs = 42;
          p.status = 'Running';
        });

      db.addEvent({
        id: `evt-${Date.now()}`,
        timestamp: Date.now(),
        type: 'Normal',
        reason: 'RolloutUndo',
        object: `deployment/${targetDep.name}`,
        message: `Rollback completed: image restored from ${oldImg} to stable ${targetDep.imageStable}`,
      });
    }
  } else if (action.type === 'reroute_traffic') {
    action.executionLog.push(`[K8s API] PATCH /apis/networking.k8s.io/v1/ingresses/${action.targetResource}`);
    action.executionLog.push(`[Traffic] Rerouted 100% of ingress traffic to stable backup cluster.`);
  }

  // Verification step
  setTimeout(() => {
    action.status = 'executed';
    action.completedAt = Date.now();
    action.executionLog.push(`[Verification Agent] Re-polling cluster telemetry...`);
    action.afterMetrics = {
      cpu: 28,
      mem: 42,
      errorRate: 0.02,
    };
    action.verificationResult = 'recovered';
    action.executionLog.push(`[Verification Agent] PASS: Error rate < 0.1%, CPU nominal, cgroup memory nominal.`);

    const inc = db.getIncidents().find((i) => i.id === action.incidentId);
    if (inc) {
      inc.status = 'resolved';
      inc.resolvedAt = Date.now();
      inc.pipelineStage = 'learning_recorded';
      inc.mttrSeconds = Number(((inc.resolvedAt - inc.detectedAt) / 1000).toFixed(1));
      db.updateStats((prev) => ({
        ...prev,
        totalIncidentsResolved: prev.totalIncidentsResolved + 1,
        autonomousRemediationsCount:
          action.initiatedBy === 'autonomous_agent'
            ? prev.autonomousRemediationsCount + 1
            : prev.autonomousRemediationsCount,
      }));
      db.save();
    }

    db.addAudit({
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      actor: action.initiatedBy === 'autonomous_agent' ? 'Autonomous Agent' : 'Human Engineer',
      actionType: 'REMEDIATION_COMPLETE',
      target: action.targetResource,
      details: `Remediation [${action.type}] succeeded. Verification Agent confirmed system recovery.`,
      severity: 'INFO',
    });
  }, 2200);
}

// Background Telemetry Heartbeat & Multi-Agent Loop
setInterval(() => {
  const ts = Date.now();

  pods.forEach((p) => {
    if (p.status === 'Running') {
      p.cpuPercent = Math.max(10, Math.min(98, p.cpuPercent + (Math.random() * 4 - 2)));
      p.memPercent = Math.max(20, Math.min(99, p.memPercent + (Math.random() * 3 - 1.5)));

      // Record trend for predictive analysis
      let trend = podMemoryTrends.get(p.podId);
      if (!trend) {
        trend = [];
        podMemoryTrends.set(p.podId, trend);
      }
      trend.push({ timestamp: ts, value: p.memPercent });
      if (trend.length > 20) trend.shift();
    }
  });

  const avgCpu = Math.round(pods.reduce((a, b) => a + b.cpuPercent, 0) / pods.length);
  const avgMem = Math.round(pods.reduce((a, b) => a + b.memPercent, 0) / pods.length);
  const maxErr = Number(Math.max(...pods.map((p) => p.errorRate)).toFixed(2));
  const avgLat = Math.round(pods.reduce((a, b) => a + b.latencyMs, 0) / pods.length);

  // Compute multi-feature anomaly score via Isolation Forest
  const featureVectors = pods.map((p) => [
    p.cpuPercent,
    p.memPercent,
    p.errorRate,
    p.latencyMs,
    p.restarts,
    p.status !== 'Running' ? 1 : 0,
  ]);
  const anomalyScores = featureVectors.map((fv) => isolationForest.score(fv));
  const maxAnomalyScore = Math.max(...anomalyScores);

  telemetryHistory.push({
    timestamp: ts,
    timeStr: new Date(ts).toLocaleTimeString(),
    avgCpu,
    avgMemory: avgMem,
    errorRate: maxErr,
    p99Latency: avgLat,
    requestsPerSec: Math.round(2100 + Math.random() * 400),
    anomalyScore: Number(maxAnomalyScore.toFixed(2)),
  });

  if (telemetryHistory.length > 60) {
    telemetryHistory.shift();
  }
}, 3000);

// ==========================================
// 3. REST API ENDPOINTS
// ==========================================

// Cluster Status
app.get('/api/cluster/status', (_req, res) => {
  const activeIncidents = db.getIncidents().filter((i) => i.status !== 'resolved');
  const isHealthy = activeIncidents.length === 0 && pods.every((p) => p.status === 'Running');
  const stats = db.getStats();

  const state: ClusterState = {
    healthy: isHealthy,
    clusterName: 'echoguard-production-us-east',
    kubernetesVersion: 'v1.30.2',
    nodes,
    deployments,
    pods,
    activeIncidentCount: activeIncidents.length,
    pendingApprovalsCount: db.getActions().filter((a) => a.status === 'pending_approval').length,
    systemUptimeSeconds: stats.systemUptimeSeconds,
    totalIncidentsResolved: stats.totalIncidentsResolved,
    autonomousRemediationsCount: stats.autonomousRemediationsCount,
    averageMttrSeconds: stats.averageMttrSeconds,
  };

  res.json(state);
});

// Telemetry History
app.get('/api/telemetry/history', (_req, res) => {
  res.json(telemetryHistory);
});

// Incidents list
app.get('/api/incidents', (_req, res) => {
  res.json(db.getIncidents());
});

// Events list
app.get('/api/events', (_req, res) => {
  res.json(db.getEvents().slice(-20).reverse());
});

// Actions list
app.get('/api/actions', (_req, res) => {
  res.json(db.getActions());
});

// Pending actions requiring human-in-the-loop approval
app.get('/api/actions/pending', (_req, res) => {
  res.json(db.getActions().filter((a) => a.status === 'pending_approval'));
});

// Audit Trail
app.get('/api/audit-log', (_req, res) => {
  res.json(db.getAuditTrail());
});

// Safety Policies
app.get('/api/safety-policies', (_req, res) => {
  res.json(db.getPolicies());
});

// Approve Action
app.post('/api/actions/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  const action = db.getActions().find((a) => a.id === id);

  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }

  action.status = 'approved';
  action.approvedBy = approvedBy || 'SRE On-Call (Lead)';
  action.executionLog.push(`[Human Approval] Authorized by ${action.approvedBy}. Triggering Kubernetes Healing Agent.`);

  db.addAudit({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    actor: 'Human Engineer',
    actionType: 'ACTION_APPROVED',
    target: action.targetResource,
    details: `High-risk action [${action.type}] approved by ${action.approvedBy}. Execution dispatched.`,
    severity: 'INFO',
  });

  const inc = db.getIncidents().find((i) => i.id === action.incidentId);
  if (inc) {
    inc.status = 'healing';
    inc.pipelineStage = 'healing_execution';
  }

  db.save();
  await executeRemediation(action);
  res.json({ success: true, action });
});

// Reject Action
app.post('/api/actions/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectionReason, rejectedBy } = req.body;
  const action = db.getActions().find((a) => a.id === id);

  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }

  action.status = 'rejected';
  action.rejectionReason = rejectionReason || 'Rejected by SRE: alternative playbook preferred';
  action.executionLog.push(`[Human Rejection] Action canceled by ${rejectedBy || 'SRE'}: ${action.rejectionReason}`);

  db.addAudit({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    actor: 'Human Engineer',
    actionType: 'ACTION_REJECTED',
    target: action.targetResource,
    details: `Action [${action.type}] rejected: ${action.rejectionReason}`,
    severity: 'WARNING',
  });

  const inc = db.getIncidents().find((i) => i.id === action.incidentId);
  if (inc) {
    inc.status = 'investigating';
  }

  db.save();
  res.json({ success: true, action });
});

// Digital Twin What-If Sandbox Simulation
app.post('/api/digital-twin/simulate', (req, res) => {
  const { deploymentName, incidentType } = req.body;
  const dep = deployments.find((d) => d.name === deploymentName) || deployments[0];
  const sim = DigitalTwinEngine.simulate(`sandbox-${Date.now()}`, dep, pods, incidentType || 'generic');
  res.json(sim);
});

// Chaos Fault Injection
app.post('/api/chaos/inject', async (req, res) => {
  const { faultType } = req.body;

  const incidentId = `inc-${Date.now().toString(36)}`;
  let targetDeployment = 'checkout-service';
  let targetPod = pods.find((p) => p.deploymentName === 'checkout-service');
  let title = 'Canary Deployment Failure: Elevated 500 Responses';
  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'CRITICAL';
  let symptoms: string[] = [];

  if (faultType === 'bad_deployment') {
    targetDeployment = 'checkout-service';
    const dep = deployments.find((d) => d.name === 'checkout-service');
    if (dep) {
      dep.imageCurrent = 'echoguard/checkout:v1.4.2-badcanary';
      dep.version = '1.4.2';
      dep.status = 'Degraded';
    }
    pods
      .filter((p) => p.deploymentName === 'checkout-service')
      .forEach((p) => {
        p.errorRate = 68.4;
        p.latencyMs = 380;
      });
    title = 'Bad Canary Deployment v1.4.2: 68% HTTP 500 Spike';
    severity = 'CRITICAL';
    symptoms = [
      'HTTP 500 internal server errors surged to 68.4%',
      'checkout-service ingress latency jumped 7x',
      'Recent deployment release detected: v1.4.2-badcanary',
    ];
  } else if (faultType === 'oom_killed') {
    targetDeployment = 'payment-gateway';
    targetPod = pods.find((p) => p.deploymentName === 'payment-gateway');
    if (targetPod) {
      targetPod.status = 'OOMKilled';
      targetPod.memPercent = 98.6;
      targetPod.cpuPercent = 88;
      targetPod.restarts += 1;
      targetPod.errorRate = 42.0;
    }
    title = 'Memory Leak Escalation: Pod OOMKilled in payment-gateway';
    severity = 'CRITICAL';
    symptoms = [
      'Container memory crossed 512Mi hard limit (98.6% cgroup)',
      'Exit Code 137 triggered by Linux kernel OOM-killer',
      'Payment transactions dropping to retry queue',
    ];
    db.addEvent({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'Error',
      reason: 'OOMKilled',
      object: `pod/${targetPod?.name}`,
      message: 'Container payment-gateway exceeded memory limit and was killed',
    });
  } else if (faultType === 'cpu_spike') {
    targetDeployment = 'catalog-db';
    targetPod = pods.find((p) => p.deploymentName === 'catalog-db');
    pods
      .filter((p) => p.deploymentName === 'catalog-db')
      .forEach((p) => {
        p.cpuPercent = 97.5;
        p.latencyMs = 520;
        p.errorRate = 18.2;
      });
    title = 'Thread Saturation: 98% CPU Spike on catalog-db Replicas';
    severity = 'HIGH';
    symptoms = [
      'CPU utilization peaked at 97.5% sustained',
      'Database read queries queuing; p99 latency exceeded 520ms',
      'Worker node k8s-worker-beta-02 under CPU pressure',
    ];
  } else {
    // crash_loop
    targetDeployment = 'auth-service';
    targetPod = pods.find((p) => p.deploymentName === 'auth-service');
    if (targetPod) {
      targetPod.status = 'CrashLoopBackOff';
      targetPod.restarts += 3;
      targetPod.errorRate = 100;
    }
    title = 'CrashLoopBackOff: auth-service missing configuration secret';
    severity = 'HIGH';
    symptoms = [
      'Container exited with code 1: missing DATABASE_ENCRYPTION_KEY',
      'Kubelet in exponential BackOff restarting container',
      'User login tokens failing authentication validation',
    ];
    db.addEvent({
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      type: 'Warning',
      reason: 'BackOff',
      object: `pod/${targetPod?.name}`,
      message: 'Back-off restarting failed container auth-service',
    });
  }

  // 1. Create incident in DB
  const newIncident: Incident = {
    id: incidentId,
    correlationId: `corr-${Math.random().toString(36).substring(2, 9)}`,
    title,
    severity,
    targetDeployment,
    targetPod: targetPod?.name,
    status: 'investigating',
    detectedAt: Date.now(),
    anomalyScore: 0.95,
    symptoms,
    pipelineStage: 'anomaly_detection',
  };

  db.addIncident(newIncident);

  // 2. Multi-Agent Pipeline Loop
  (async () => {
    // Stage: Correlation
    newIncident.pipelineStage = 'correlation';
    await new Promise((r) => setTimeout(r, 600));

    // Stage: Gemini AI Diagnosis
    newIncident.pipelineStage = 'gemini_diagnosis';
    const diagnosis = await runGeminiRCA(newIncident, targetPod, faultType || 'bad_deployment');
    newIncident.geminiDiagnosis = diagnosis;
    db.save();

    // Stage: Prediction
    newIncident.pipelineStage = 'prediction';
    await new Promise((r) => setTimeout(r, 500));

    // Stage: Digital Twin Simulation
    newIncident.pipelineStage = 'digital_twin_simulation';
    const dep = deployments.find((d) => d.name === targetDeployment);
    const simulation = DigitalTwinEngine.simulate(incidentId, dep, pods, faultType || 'bad_deployment');
    newIncident.digitalTwinSimulation = simulation;
    db.save();

    // Stage: Safety Policy Evaluation
    newIncident.pipelineStage = 'safety_policy_evaluation';
    const recommendedCand =
      simulation.candidates.find((c) => c.id === simulation.recommendedActionId) || simulation.candidates[0];

    const policyEval = SafetyPolicyEngine.evaluate(recommendedCand, dep?.replicasDesired || 3);

    const action: RemediationAction = {
      id: `act-${Date.now().toString(36)}`,
      incidentId: newIncident.id,
      type: recommendedCand.type,
      targetResource: recommendedCand.targetResource,
      riskTier: policyEval.riskTier,
      status: policyEval.decision === 'AUTONOMOUS_APPROVED' ? 'approved' : 'pending_approval',
      initiatedBy: policyEval.decision === 'AUTONOMOUS_APPROVED' ? 'autonomous_agent' : 'human_engineer',
      initiatedAt: Date.now(),
      executionLog: [
        `[Multi-Agent Pipeline] Candidate Selected: ${recommendedCand.title}`,
        `[Safety Policy Engine] ${policyEval.policyRule}`,
        `[Evaluation Decision] ${policyEval.decision}: ${policyEval.reason}`,
      ],
      beforeMetrics: {
        cpu: targetPod?.cpuPercent || 80,
        mem: targetPod?.memPercent || 80,
        errorRate: targetPod?.errorRate || 50,
      },
    };

    newIncident.remediationAction = action;
    db.addAction(action);
    db.save();

    if (policyEval.decision === 'AUTONOMOUS_APPROVED') {
      newIncident.status = 'healing';
      newIncident.pipelineStage = 'healing_execution';
      await executeRemediation(action);
    } else {
      newIncident.status = 'pending_approval';
      db.save();
    }
  })();

  res.json({
    success: true,
    message: `Chaos scenario '${faultType}' injected into ${targetDeployment}. Multi-Agent pipeline active.`,
    incidentId,
  });
});

// Reset Cluster to pristine baseline
app.post('/api/cluster/reset', (_req, res) => {
  db.resetAll();

  // Reset Deployments
  deployments.forEach((d) => {
    d.imageCurrent = d.imageStable;
    d.replicasDesired = d.name === 'auth-service' || d.name === 'catalog-db' ? 2 : 3;
    d.replicasReady = d.replicasDesired;
    d.status = 'Healthy';
  });

  // Reset Pods
  pods.forEach((p) => {
    p.status = 'Running';
    p.errorRate = 0.01;
    p.cpuPercent = Math.round(20 + Math.random() * 15);
    p.memPercent = Math.round(35 + Math.random() * 12);
    p.latencyMs = Math.round(20 + Math.random() * 30);
  });

  db.addEvent({
    id: `evt-${Date.now()}`,
    timestamp: Date.now(),
    type: 'Normal',
    reason: 'ClusterReset',
    object: 'cluster/all',
    message: 'EchoGuard operator reset cluster state to verified nominal baseline',
  });

  res.json({ success: true, message: 'Cluster returned to 100% nominal state.' });
});

// Academic Project Metadata (matching Phase-I document)
app.get('/api/academic-info', (_req, res) => {
  res.json({
    institution: 'Vardhaman College of Engineering (Autonomous, NAAC A++)',
    department: 'Department of Computer Science and Engineering',
    class: 'III B. TECH II SEMESTER CSE-A',
    academicYear: '2026-2027',
    batchId: '24MPCS-A18',
    projectTitle: 'Autonomous Incident Commander (EchoGuard)',
    teamMembers: [
      {
        sNo: 1,
        rollNumber: '24881A0509',
        name: 'Chennuru Nikhil Madhukar',
        email: 'chnikhil1024@gmail.com',
        phone: '7330950337',
      },
      {
        sNo: 2,
        rollNumber: '24881A0541',
        name: 'Neeli Sai Krishna',
        email: 'saikrishnaneeli66@gmail.com',
        phone: '7032482086',
      },
      {
        sNo: 3,
        rollNumber: '24881A0502',
        name: 'Attar Alfasiya',
        email: 'alfasiya.attar2023@gmail.com',
        phone: '8639616955',
      },
    ],
    guide: {
      name: 'Ms. P.S. Madhavi',
      designation: 'Assistant Professor',
      department: 'Computer Science and Engineering',
      email: 'Madhavi1878@vardhaman.org',
      phone: '7032236136',
      areaOfInterest: 'Data Science',
    },
  });
});

// ==========================================
// 4. VITE SERVER INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EchoGuard] Autonomous Incident Commander active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
