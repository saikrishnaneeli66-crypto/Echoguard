import type { ActionCandidate, RiskTier } from '../types/echoguard.ts';

export interface PolicyEvaluationResult {
  decision: 'AUTONOMOUS_APPROVED' | 'HUMAN_APPROVAL_REQUIRED' | 'POLICY_VIOLATION';
  riskTier: RiskTier;
  reason: string;
  policyRule: string;
  auditMessage: string;
}

export class SafetyPolicyEngine {
  public static evaluate(candidate: ActionCandidate, currentReplicas = 3): PolicyEvaluationResult {
    // 1. Rollback Rule
    if (candidate.type === 'rollback') {
      return {
        decision: 'HUMAN_APPROVAL_REQUIRED',
        riskTier: 'high',
        reason: 'Rollback mutates production deployment revisions and carries potential data schema drift risk.',
        policyRule: 'RULE-POL-03: rollback → risk: high, auto: false (Mandates human-in-the-loop engineer authorization)',
        auditMessage: `Safety policy flagged '${candidate.title}' as HIGH RISK. Dispatched to SRE approval queue.`,
      };
    }

    // 2. Traffic Reroute Rule
    if (candidate.type === 'reroute_traffic') {
      return {
        decision: 'HUMAN_APPROVAL_REQUIRED',
        riskTier: 'high',
        reason: 'Traffic shedding directly alters customer-facing routing and edge ingress policies.',
        policyRule: 'RULE-POL-04: reroute_traffic → risk: high, auto: false (Mandates human engineer approval)',
        auditMessage: `Safety policy flagged traffic diversion on '${candidate.targetResource}' as HIGH RISK.`,
      };
    }

    // 3. Scale Replicas Rule
    if (candidate.type === 'scale_replicas') {
      const projectedReplicas = currentReplicas + 2;
      const MAX_REPLICAS = 10;
      const MIN_REPLICAS = 2;

      if (projectedReplicas > MAX_REPLICAS) {
        return {
          decision: 'POLICY_VIOLATION',
          riskTier: 'medium',
          reason: `Projected replicas (${projectedReplicas}) exceeds cluster safety limit of ${MAX_REPLICAS}.`,
          policyRule: 'RULE-POL-02: scale_replicas bounds check [min: 2, max: 10]',
          auditMessage: `Scaling rejected by safety bounds: cannot exceed ${MAX_REPLICAS} replicas.`,
        };
      }

      return {
        decision: 'AUTONOMOUS_APPROVED',
        riskTier: 'medium',
        reason: `Scaling from ${currentReplicas} to ${projectedReplicas} pods is within safe operating envelopes (2 to 10).`,
        policyRule: 'RULE-POL-02: scale_replicas → risk: medium, auto: true (Limits: min 2, max 10)',
        auditMessage: `Autonomous scale-up approved by safety engine for '${candidate.targetResource}'.`,
      };
    }

    // 4. Pod Restart Rule
    if (candidate.type === 'restart_pod') {
      return {
        decision: 'AUTONOMOUS_APPROVED',
        riskTier: 'low',
        reason: 'Individual pod recreation is covered by Kubernetes ReplicaSet controller with minimal blast radius.',
        policyRule: 'RULE-POL-01: restart_pod → risk: low, auto: true',
        auditMessage: `Autonomous pod restart authorized for '${candidate.targetResource}'.`,
      };
    }

    // Default Fallback
    return {
      decision: 'HUMAN_APPROVAL_REQUIRED',
      riskTier: 'high',
      reason: 'Unknown action type requires explicit human verification.',
      policyRule: 'RULE-POL-DEFAULT: unclassified action → risk: high',
      auditMessage: `Unclassified action enqueued for engineer review.`,
    };
  }
}
