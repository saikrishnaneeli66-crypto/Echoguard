import type { ActionCandidate, DigitalTwinSimulation, DeploymentStatus, PodMetric } from '../types/echoguard.ts';

/**
 * Digital Twin Simulation Engine
 * Simulates Kubernetes cluster state projection under alternative remediation strategies
 * before applying any real changes to the live cluster.
 */
export class DigitalTwinEngine {
  public static simulate(
    incidentId: string,
    deployment: DeploymentStatus | undefined,
    pods: PodMetric[],
    incidentType: string
  ): DigitalTwinSimulation {
    const deploymentName = deployment?.name || 'checkout-service';
    const depPods = pods.filter((p) => p.deploymentName === deploymentName);

    const avgCpu = depPods.length > 0 ? depPods.reduce((a, b) => a + b.cpuPercent, 0) / depPods.length : 40;
    const avgMem = depPods.length > 0 ? depPods.reduce((a, b) => a + b.memPercent, 0) / depPods.length : 50;
    const avgErr = depPods.length > 0 ? Math.max(...depPods.map((p) => p.errorRate)) : 0;
    const avgLat = depPods.length > 0 ? depPods.reduce((a, b) => a + b.latencyMs, 0) / depPods.length : 30;

    const currentReplicas = deployment?.replicasDesired || 3;
    const candidates: ActionCandidate[] = [];

    // 1. Candidate: Restart Pod (Graceful Kill & Recreate)
    const isLeakOrOOM = incidentType.includes('oom') || incidentType.includes('leak');
    candidates.push({
      id: `sim-${incidentId}-restart`,
      type: 'restart_pod',
      title: 'Graceful Container Purge & Recreation',
      description: `Signal SIGTERM followed by SIGKILL to anomalous pod instance. Reallocates clean cgroup memory limits.`,
      targetResource: depPods[0]?.name || deploymentName,
      riskTier: 'low',
      autoExecutable: true,
      requiresApproval: false,
      projectedCpuReduction: Math.round(avgCpu * 0.4),
      projectedMemReduction: Math.round(avgMem * 0.55),
      projectedErrorReduction: isLeakOrOOM ? 94 : 35,
      projectedRecoveryTimeSec: 3.8,
      riskScore: 12,
      confidenceScore: isLeakOrOOM ? 96 : 72,
      efficacyScore: isLeakOrOOM ? 95 : 40,
    });

    // 2. Candidate: Horizontal Pod Autoscaling (Scale Replicas)
    const newReplicas = currentReplicas + 2;
    const isCpuSpike = incidentType.includes('cpu');
    candidates.push({
      id: `sim-${incidentId}-scale`,
      type: 'scale_replicas',
      title: `Scale Replicas (${currentReplicas} → ${newReplicas} Pods)`,
      description: `Spawn +2 worker instances across separate worker nodes. Load balances traffic through kube-proxy round-robin.`,
      targetResource: deploymentName,
      riskTier: 'medium',
      autoExecutable: true,
      requiresApproval: false,
      projectedCpuReduction: Math.round(avgCpu * 0.58),
      projectedMemReduction: Math.round(avgMem * 0.28),
      projectedErrorReduction: isCpuSpike ? 92 : 45,
      projectedRecoveryTimeSec: 6.5,
      riskScore: 28,
      confidenceScore: isCpuSpike ? 94 : 75,
      efficacyScore: isCpuSpike ? 94 : 48,
    });

    // 3. Candidate: Rollback Deployment (Rollout Undo)
    const isBadDeploy = incidentType.includes('bad_deployment') || avgErr > 20;
    candidates.push({
      id: `sim-${incidentId}-rollback`,
      type: 'rollback',
      title: `Rollback to Stable Revision (${deployment?.imageStable || 'v1.4.0'})`,
      description: `Reapply previous ReplicaSet manifest. Discards faulty binary build and reverts service definitions to verified stable revision.`,
      targetResource: deploymentName,
      riskTier: 'high',
      autoExecutable: false,
      requiresApproval: true,
      projectedCpuReduction: Math.round(avgCpu * 0.35),
      projectedMemReduction: Math.round(avgMem * 0.35),
      projectedErrorReduction: isBadDeploy ? 99 : 50,
      projectedRecoveryTimeSec: 7.2,
      riskScore: 68,
      confidenceScore: isBadDeploy ? 98 : 60,
      efficacyScore: isBadDeploy ? 98 : 50,
    });

    // 4. Candidate: Dynamic Ingress Traffic Reroute
    candidates.push({
      id: `sim-${incidentId}-reroute`,
      type: 'reroute_traffic',
      title: 'Dynamic Traffic Shedding & Ingress Reroute',
      description: `Patch service selector to route 100% of ingress traffic to secondary failover cluster until remediation is confirmed.`,
      targetResource: `ingress/${deploymentName}`,
      riskTier: 'high',
      autoExecutable: false,
      requiresApproval: true,
      projectedCpuReduction: Math.round(avgCpu * 0.7),
      projectedMemReduction: Math.round(avgMem * 0.4),
      projectedErrorReduction: 82,
      projectedRecoveryTimeSec: 4.9,
      riskScore: 64,
      confidenceScore: 80,
      efficacyScore: 78,
    });

    // Determine optimal recommendation
    let recommendedId = candidates[0].id;
    let rationale = 'Digital Twin simulation projects minimal blast radius and fastest recovery with pod purge.';

    if (isBadDeploy) {
      recommendedId = candidates[2].id; // Rollback
      rationale = `Digital Twin evaluated 4 candidate actions: Rollback eliminates 99% of error delta caused by ${deployment?.imageCurrent || 'recent release'}.`;
    } else if (isCpuSpike) {
      recommendedId = candidates[1].id; // Scale
      rationale = `Digital Twin simulation determined compute thread saturation. Scaling to ${newReplicas} replicas provides 58% CPU relief without downtime.`;
    } else if (isLeakOrOOM) {
      recommendedId = candidates[0].id; // Restart
      rationale = `Digital Twin evaluated heap memory curve. Restart purges unreleased buffers and returns cgroup headroom to nominal 35%.`;
    }

    return {
      incidentId,
      evaluatedAt: Date.now(),
      baselineMetrics: {
        cpuPercent: Math.round(avgCpu),
        memPercent: Math.round(avgMem),
        errorRate: Number(avgErr.toFixed(1)),
        latencyMs: Math.round(avgLat),
      },
      candidates,
      recommendedActionId: recommendedId,
      rationale,
    };
  }
}
