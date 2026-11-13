/**
 * STATGUARD Statistical Engine
 * Production mathematical implementations of Z-Score, IQR, Moving Averages,
 * Shannon Entropy, and Isolation Forest Anomaly Detection.
 */

export interface FeatureStats {
  mean: number;
  stdDev: number;
  variance: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  min: number;
  max: number;
}

/**
 * Calculates mean of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates sample variance and standard deviation
 */
export function calculateStdDev(values: number[], mean?: number): { stdDev: number; variance: number } {
  if (values.length < 2) return { stdDev: 0, variance: 0 };
  const m = mean !== undefined ? mean : calculateMean(values);
  const sumSqDiff = values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0);
  const variance = sumSqDiff / (values.length - 1);
  return {
    variance,
    stdDev: Math.sqrt(variance)
  };
}

/**
 * Calculates Z-Score for a given value: Z = (X - μ) / σ
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0 || isNaN(stdDev)) return 0;
  return (value - mean) / stdDev;
}

/**
 * Computes percentile from a sorted array of numbers
 */
function getPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculates Quartiles, IQR, and Outlier Bounds (Tukey's method)
 */
export function calculateIQR(values: number[], multiplier: number = 1.5): {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
} {
  if (values.length === 0) {
    return { q1: 0, median: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = getPercentile(sorted, 25);
  const median = getPercentile(sorted, 50);
  const q3 = getPercentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return { q1, median, q3, iqr, lowerBound, upperBound };
}

/**
 * Computes complete feature baseline statistics
 */
export function calculateFeatureStats(values: number[], iqrMultiplier: number = 1.5): FeatureStats {
  if (values.length === 0) {
    return {
      mean: 0, stdDev: 0, variance: 0, median: 0,
      q1: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0, min: 0, max: 0
    };
  }
  const mean = calculateMean(values);
  const { stdDev, variance } = calculateStdDev(values, mean);
  const { q1, median, q3, iqr, lowerBound, upperBound } = calculateIQR(values, iqrMultiplier);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    mean, stdDev, variance, median, q1, q3, iqr, lowerBound, upperBound, min, max
  };
}

/**
 * Calculates Simple Moving Average (SMA) and rolling standard deviation
 */
export function calculateMovingAverages(
  values: number[],
  windowSize: number = 10
): { sma: number[]; upperBand: number[]; lowerBand: number[] } {
  const sma: number[] = [];
  const upperBand: number[] = [];
  const lowerBand: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const windowVals = values.slice(start, i + 1);
    const mean = calculateMean(windowVals);
    const { stdDev } = calculateStdDev(windowVals, mean);

    sma.push(mean);
    upperBand.push(mean + 2 * stdDev);
    lowerBand.push(Math.max(0, mean - 2 * stdDev));
  }

  return { sma, upperBand, lowerBand };
}

/**
 * Calculates Shannon Entropy: H(X) = - Σ P(x) * log2(P(x))
 * Lower entropy in IP/port distributions indicates targeted traffic (DDoS/Flooding).
 * High uniform entropy across many ports indicates scanning.
 */
export function calculateShannonEntropy(items: (string | number)[]): number {
  if (items.length === 0) return 0;
  const counts = new Map<string | number, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  const total = items.length;
  let entropy = 0;

  for (const count of counts.values()) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

// ---------------------------------------------------------------------------
// Isolation Forest (iForest) Ensemble Implementation
// ---------------------------------------------------------------------------

interface IsolationNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size: number;
  isLeaf: boolean;
}

/**
 * Average path length of unsuccessful searches in a Binary Search Tree:
 * c(n) = 2 * (ln(n - 1) + 0.5772156649) - 2 * (n - 1) / n
 */
function c(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerMascheroni = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
}

export class IsolationForest {
  private trees: IsolationNode[] = [];
  private numTrees: number;
  private subSampleSize: number;
  private maxDepth: number;

  constructor(numTrees: number = 30, subSampleSize: number = 64) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.maxDepth = Math.ceil(Math.log2(Math.max(subSampleSize, 2)));
  }

  public fit(data: number[][]): void {
    if (data.length === 0 || data[0].length === 0) return;
    this.trees = [];

    const effectiveSampleSize = Math.min(data.length, this.subSampleSize);
    this.maxDepth = Math.ceil(Math.log2(Math.max(effectiveSampleSize, 2)));

    for (let t = 0; t < this.numTrees; t++) {
      // Subsample with randomized indices
      const sampleIndices: number[] = [];
      const used = new Set<number>();
      while (sampleIndices.length < effectiveSampleSize) {
        const randIdx = Math.floor(Math.random() * data.length);
        if (!used.has(randIdx)) {
          used.add(randIdx);
          sampleIndices.push(randIdx);
        }
      }
      const sample = sampleIndices.map(idx => data[idx]);
      this.trees.push(this.buildTree(sample, 0));
    }
  }

  private buildTree(data: number[][], currentDepth: number): IsolationNode {
    if (currentDepth >= this.maxDepth || data.length <= 1) {
      return { size: data.length, isLeaf: true };
    }

    const numFeatures = data[0].length;
    // Pick a random feature
    const featureIdx = Math.floor(Math.random() * numFeatures);
    const featureVals = data.map(d => d[featureIdx]);
    const minVal = Math.min(...featureVals);
    const maxVal = Math.max(...featureVals);

    if (minVal === maxVal) {
      return { size: data.length, isLeaf: true };
    }

    // Split uniformly between min and max
    const splitValue = minVal + Math.random() * (maxVal - minVal);
    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (const point of data) {
      if (point[featureIdx] < splitValue) {
        leftData.push(point);
      } else {
        rightData.push(point);
      }
    }

    if (leftData.length === 0 || rightData.length === 0) {
      return { size: data.length, isLeaf: true };
    }

    return {
      splitFeature: featureIdx,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1),
      right: this.buildTree(rightData, currentDepth + 1),
      size: data.length,
      isLeaf: false
    };
  }

  private pathLength(point: number[], node: IsolationNode, currentDepth: number): number {
    if (node.isLeaf || node.splitFeature === undefined || node.splitValue === undefined) {
      return currentDepth + c(node.size);
    }

    if (point[node.splitFeature] < node.splitValue) {
      return node.left ? this.pathLength(point, node.left, currentDepth + 1) : currentDepth;
    } else {
      return node.right ? this.pathLength(point, node.right, currentDepth + 1) : currentDepth;
    }
  }

  /**
   * Returns anomaly score between 0 and 1.
   * Score > 0.6 is anomalous, < 0.5 is normal.
   */
  public score(point: number[]): number {
    if (this.trees.length === 0) return 0;
    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += this.pathLength(point, tree, 0);
    }
    const avgPath = totalPath / this.trees.length;
    const avgC = c(this.subSampleSize);
    if (avgC === 0) return 0.5;
    return Math.pow(2, -avgPath / avgC);
  }
}
