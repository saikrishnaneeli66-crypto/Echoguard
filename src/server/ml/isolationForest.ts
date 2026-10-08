/**
 * Isolation Forest Anomaly Detection Algorithm
 * As referenced in Literature Review (Paper 2, Paper 9, Paper 10).
 * Detects abnormal cluster metrics without requiring labeled training datasets.
 */

export interface FeatureVector {
  cpu: number;
  memory: number;
  errorRate: number;
  latency: number;
  restarts: number;
  isUnhealthyStatus: number;
}

interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
  isLeaf: boolean;
}

export class IsolationTree {
  root: IsolationTreeNode;
  maxDepth: number;

  constructor(data: number[][], maxDepth: number) {
    this.maxDepth = maxDepth;
    this.root = this.buildTree(data, 0);
  }

  private buildTree(data: number[][], currentDepth: number): IsolationTreeNode {
    if (data.length <= 1 || currentDepth >= this.maxDepth) {
      return { size: data.length, isLeaf: true };
    }

    const numFeatures = data[0].length;
    const splitFeature = Math.floor(Math.random() * numFeatures);

    const values = data.map((d) => d[splitFeature]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (minVal === maxVal) {
      return { size: data.length, isLeaf: true };
    }

    const splitValue = minVal + Math.random() * (maxVal - minVal);

    const leftData = data.filter((d) => d[splitFeature] < splitValue);
    const rightData = data.filter((d) => d[splitFeature] >= splitValue);

    return {
      splitFeature,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1),
      right: this.buildTree(rightData, currentDepth + 1),
      size: data.length,
      isLeaf: false,
    };
  }

  pathLength(point: number[], node: IsolationTreeNode = this.root, currentDepth = 0): number {
    if (node.isLeaf || !node.left || !node.right || node.splitFeature === undefined || node.splitValue === undefined) {
      return currentDepth + this.c(node.size);
    }

    if (point[node.splitFeature] < node.splitValue) {
      return this.pathLength(point, node.left, currentDepth + 1);
    } else {
      return this.pathLength(point, node.right, currentDepth + 1);
    }
  }

  // Harmonic average path length approximation for n instances
  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1)) / n;
  }
}

export class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private subSampleSize: number;
  private sampleSize: number;

  constructor(numTrees = 25, subSampleSize = 64) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.sampleSize = subSampleSize;
  }

  // Train forest on baseline healthy operational data
  fit(trainingData: number[][]) {
    this.trees = [];
    this.sampleSize = Math.min(trainingData.length, this.subSampleSize);
    const maxDepth = Math.ceil(Math.log2(Math.max(2, this.sampleSize)));

    for (let i = 0; i < this.numTrees; i++) {
      // Sample subset
      const sample: number[][] = [];
      for (let s = 0; s < this.sampleSize; s++) {
        const randIdx = Math.floor(Math.random() * trainingData.length);
        sample.push(trainingData[randIdx]);
      }
      this.trees.push(new IsolationTree(sample, maxDepth));
    }
  }

  // Compute Anomaly Score s(x, n) = 2^(-E(h(x)) / c(n))
  // Range: 0.0 to 1.0 (scores > 0.65 represent distinct anomalies)
  score(point: number[]): number {
    if (this.trees.length === 0) {
      return 0.1;
    }

    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(point);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cN = this.c(this.sampleSize);

    if (cN === 0) return 0.1;
    const exponent = -avgPathLength / cN;
    const anomalyScore = Math.pow(2, exponent);
    return Math.min(1.0, Math.max(0.0, Number(anomalyScore.toFixed(3))));
  }

  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1)) / n;
  }
}

// Generate realistic healthy baseline telemetry for training
export function createTrainedIsolationForest(): IsolationForest {
  const forest = new IsolationForest(25, 64);
  const baselineData: number[][] = [];

  // 120 baseline normal observations
  for (let i = 0; i < 120; i++) {
    baselineData.push([
      20 + Math.random() * 25, // CPU 20-45%
      30 + Math.random() * 30, // Memory 30-60%
      Math.random() * 0.2, // Error rate 0-0.2%
      20 + Math.random() * 35, // Latency 20-55ms
      0, // Restarts
      0, // Healthy status
    ]);
  }

  forest.fit(baselineData);
  return forest;
}
