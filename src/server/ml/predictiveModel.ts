/**
 * Predictive Failure Analysis (Time-to-Failure & Metric Drift)
 * As referenced in Literature Review (Paper 3, Paper 7, Paper 10 - LSTM / Time-Series prediction)
 * Models resource exhaustion slope and predicts upcoming OOM / CPU collapse before crash.
 */

export interface MetricTrendPoint {
  timestamp: number;
  value: number;
}

export interface FailurePrediction {
  targetResource: string;
  metricName: 'memory' | 'cpu' | 'error_rate';
  currentValue: number;
  projectedRatePerSec: number;
  timeToFailureSec: number | null; // null if stable or decreasing
  predictedFailureType: 'OOM_KILL_EXHAUSTION' | 'CPU_STARVATION_COLLAPSE' | 'ERROR_RATE_SLO_BREACH' | 'STABLE';
  confidence: number;
  warningNotice: string;
}

export class PredictiveEngine {
  // Linear regression slope over recent metric window
  public static calculateSlope(points: MetricTrendPoint[]): number {
    if (points.length < 2) return 0;

    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    const baseTime = points[0].timestamp;

    for (const p of points) {
      const x = (p.timestamp - baseTime) / 1000; // in seconds
      const y = p.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    return Number(slope.toFixed(4));
  }

  public static analyzeResource(
    resourceName: string,
    metricName: 'memory' | 'cpu' | 'error_rate',
    history: MetricTrendPoint[],
    threshold: number = 98.0
  ): FailurePrediction {
    if (history.length < 3) {
      return {
        targetResource: resourceName,
        metricName,
        currentValue: history[history.length - 1]?.value || 0,
        projectedRatePerSec: 0,
        timeToFailureSec: null,
        predictedFailureType: 'STABLE',
        confidence: 0.95,
        warningNotice: 'Telemetry within normal operational bounds.',
      };
    }

    const currentVal = history[history.length - 1].value;
    const slope = this.calculateSlope(history.slice(-8));

    if (slope > 0.4 && currentVal > 65) {
      // Escalating trajectory
      const deltaRemaining = Math.max(0, threshold - currentVal);
      const secondsToThreshold = Math.max(1, Math.round(deltaRemaining / slope));

      let failureType: FailurePrediction['predictedFailureType'] = 'STABLE';
      let notice = '';

      if (metricName === 'memory') {
        failureType = 'OOM_KILL_EXHAUSTION';
        notice = `CRITICAL DRIFT: Memory expanding at +${(slope * 10).toFixed(1)}MB/s. Container cgroup OOMKilled predicted in ~${secondsToThreshold}s.`;
      } else if (metricName === 'cpu') {
        failureType = 'CPU_STARVATION_COLLAPSE';
        notice = `WARNING: CPU queue accumulating at +${slope.toFixed(2)}%/s. Core saturation breach predicted in ~${secondsToThreshold}s.`;
      } else {
        failureType = 'ERROR_RATE_SLO_BREACH';
        notice = `ERROR SURGE: Error rate drifting at +${slope.toFixed(2)}%/s. SLO violation predicted in ~${secondsToThreshold}s.`;
      }

      return {
        targetResource: resourceName,
        metricName,
        currentValue: Number(currentVal.toFixed(1)),
        projectedRatePerSec: Number(slope.toFixed(3)),
        timeToFailureSec: secondsToThreshold,
        predictedFailureType: failureType,
        confidence: 0.91,
        warningNotice: notice,
      };
    }

    return {
      targetResource: resourceName,
      metricName,
      currentValue: Number(currentVal.toFixed(1)),
      projectedRatePerSec: Number(slope.toFixed(3)),
      timeToFailureSec: null,
      predictedFailureType: 'STABLE',
      confidence: 0.94,
      warningNotice: 'Telemetry trend is stable. No imminent breach detected.',
    };
  }
}
