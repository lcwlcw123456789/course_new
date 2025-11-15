// analytics.js - data processing, metrics, prediction, correlation utilities
// Assumes data array items: {year: 'YYYY', category: string, food_value: number}

function toNumericYear(y) {
  return typeof y === 'string' ? parseInt(y, 10) : y;
}

export function groupByCategory(data) {
  const map = new Map();
  data.forEach((d) => {
    if (!map.has(d.category)) map.set(d.category, []);
    map.get(d.category).push(d);
  });
  // Sort by year
  for (const arr of map.values()) {
    arr.sort((a, b) => toNumericYear(a.year) - toNumericYear(b.year));
  }
  return map;
}

function std(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function median(values) {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function r2ForLinearFit(x, y, a, b) {
  const yMean = y.reduce((s, v) => s + v, 0) / y.length;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < y.length; i++) {
    const yi = y[i];
    const yhat = a + b * x[i];
    ssTot += (yi - yMean) ** 2;
    ssRes += (yi - yhat) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

function maxDrawdown(values) {
  if (!values.length) return 0;
  let peak = values[0];
  let maxDD = 0;
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v > peak) peak = v;
    else if (peak > 0) {
      const dd = (peak - v) / peak;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return maxDD;
}

export function computeMetrics(data) {
  const byCat = groupByCategory(data);
  const metrics = [];
  byCat.forEach((series, cat) => {
    const values = series.map((d) => d.food_value);
    const years = series.map((d) => toNumericYear(d.year));
    const first = values[0];
    const last = values[values.length - 1];
    const spanYears = years[years.length - 1] - years[0];
    const cagr = spanYears > 0 && first !== 0 ? Math.pow(last / first, 1 / spanYears) - 1 : 0;

    // YoY returns for volatility and counts
    const returns = [];
    let increases = 0;
    let decreases = 0;
    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const cur = values[i];
      if (prev !== 0) returns.push((cur - prev) / prev);
      if (cur > prev) increases++; else if (cur < prev) decreases++;
    }
    const volatility = std(returns);
    const avgYoYGrowth = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const increasesRatio = (increases + decreases) > 0 ? increases / (increases + decreases) : 0;

    // Central tendency & dispersion of values
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const med = median(values);
    const valueStd = values.length > 1 ? std(values) : 0;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Best/Worst year
    const bestIdx = values.indexOf(max);
    const worstIdx = values.indexOf(min);
    const bestYear = years[bestIdx];
    const worstYear = years[worstIdx];

    // Last YoY
    const lastYoY = values.length > 1 && values[values.length - 2] !== 0
      ? (values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]
      : 0;

    // Last 5-year CAGR (or as many as available)
    let last5YearCAGR = 0;
    if (years.length >= 2) {
      const endYear = years[years.length - 1];
      // find index j where span >= 5 years, closest to 5
      let j = 0;
      for (let i = years.length - 2; i >= 0; i--) {
        if (endYear - years[i] >= 5) { j = i; break; }
        j = i;
      }
      const span = endYear - years[j];
      const startVal = values[j];
      if (span > 0 && startVal !== 0) last5YearCAGR = Math.pow(values[values.length - 1] / startVal, 1 / span) - 1;
    }

    // Linear trend slope and R^2
    let slope = 0, r2 = 0;
    if (years.length > 1) {
      const { a, b } = linearRegression(series);
      slope = b;
      r2 = r2ForLinearFit(years, values, a, b);
    }

    // Max Drawdown
    const mdd = maxDrawdown(values);

    const totalGrowthAbs = last - first;
    const totalGrowthRate = first !== 0 ? last / first - 1 : 0;

    metrics.push({
      category: cat,
      first,
      last,
      years: years.length,
      spanYears,
      cagr,
      mean,
      median: med,
      valueStd,
      min,
      max,
      bestYear,
      worstYear,
      volatility,
      avgYoYGrowth,
      lastYoY,
      lastFiveYearCAGR: last5YearCAGR,
      increases,
      decreases,
      increasesRatio,
      maxDrawdown: mdd,
      totalGrowthAbs,
      totalGrowthRate,
      lastThreeYearGrowth: computeRecentGrowth(values, years, 3),
      slope,
      r2,
    });
  });
  return metrics;
}

function computeRecentGrowth(values, years, n) {
  if (values.length <= n) return 0;
  const last = values[values.length - 1];
  const prev = values[values.length - 1 - n];
  const spanYears = years[years.length - 1] - years[years.length - 1 - n];
  return spanYears > 0 && prev !== 0 ? Math.pow(last / prev, 1 / spanYears) - 1 : 0;
}

// Linear regression y = a + b*x for (x=year, y=value)
export function linearRegression(series) {
  const x = series.map((d) => toNumericYear(d.year));
  const y = series.map((d) => d.food_value);
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, v, i) => acc + v * y[i], 0);
  const sumX2 = x.reduce((acc, v) => acc + v * v, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { a: 0, b: 0 };
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return { a, b };
}

export function predictLinear(series, futureYearsCount = 5) {
  if (!series.length) return [];
  const { a, b } = linearRegression(series);
  const lastYear = toNumericYear(series[series.length - 1].year);
  const preds = [];
  for (let i = 1; i <= futureYearsCount; i++) {
    const year = (lastYear + i).toString();
    const food_value = a + b * (lastYear + i);
    preds.push({ year, category: series[0].category, food_value });
  }
  return preds;
}

// Moving average smoothing then linear regression on smoothed series
export function predictSmoothed(series, window = 3, futureYearsCount = 5) {
  if (!series.length) return [];
  const smoothed = movingAverageSeries(series, window);
  return predictLinear(smoothed, futureYearsCount).map((d) => ({
    ...d,
    method: 'smoothed',
    window,
  }));
}

export function movingAverageSeries(series, window = 3) {
  if (window <= 1) return series;
  const arr = [];
  const values = series.map((d) => d.food_value);
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    arr.push({ ...series[i], food_value: avg });
  }
  return arr;
}

// Simple polynomial regression using normal equations and Gaussian elimination
function solveGaussian(A, b) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    // Pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    const pivot = A[i][i] || 1e-12;
    // Normalize
    for (let j = i; j < n; j++) A[i][j] /= pivot;
    b[i] /= pivot;
    // Eliminate
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = A[k][i];
      for (let j = i; j < n; j++) A[k][j] -= factor * A[i][j];
      b[k] -= factor * b[i];
    }
  }
  return b; // solution vector
}

export function polynomialRegression(series, degree = 2) {
  const x = series.map((d) => toNumericYear(d.year));
  const y = series.map((d) => d.food_value);
  const n = x.length;
  const d = Math.max(1, Math.min(degree, n - 1));
  // Build normal equations: (X^T X) c = X^T y
  const XTX = Array.from({ length: d + 1 }, () => Array(d + 1).fill(0));
  const XTy = Array(d + 1).fill(0);
  const powCache = new Map();
  const p = (xi, k) => {
    const key = xi + ':' + k;
    if (powCache.has(key)) return powCache.get(key);
    const val = Math.pow(xi, k);
    powCache.set(key, val);
    return val;
  };
  for (let i = 0; i < n; i++) {
    for (let r = 0; r <= d; r++) {
      for (let c = 0; c <= d; c++) {
        XTX[r][c] += p(x[i], r + c);
      }
      XTy[r] += y[i] * p(x[i], r);
    }
  }
  const coeffs = solveGaussian(XTX, XTy); // c0..cd
  return coeffs; // f(x) = c0 + c1 x + c2 x^2 + ...
}

export function predictPolynomial(series, degree = 2, futureYearsCount = 5) {
  if (!series.length) return [];
  const coeffs = polynomialRegression(series, degree);
  const lastYear = toNumericYear(series[series.length - 1].year);
  const preds = [];
  const evalPoly = (x) => coeffs.reduce((acc, c, idx) => acc + c * Math.pow(x, idx), 0);
  for (let i = 1; i <= futureYearsCount; i++) {
    const yr = lastYear + i;
    preds.push({ year: yr.toString(), category: series[0].category, food_value: evalPoly(yr) });
  }
  return preds;
}

// Pearson correlation of two arrays
function pearson(x, y) {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : num / denom;
}

export function correlationMatrix(data) {
  const byCat = groupByCategory(data);
  const categories = Array.from(byCat.keys());
  const matrix = {};
  categories.forEach((catA) => {
    const seriesA = byCat.get(catA).map((d) => d.food_value);
    const arr = [];
    categories.forEach((catB) => {
      if (catA === catB) return;
      const seriesB = byCat.get(catB).map((d) => d.food_value);
      // Align lengths (should be same by year set) but guard anyway
      const len = Math.min(seriesA.length, seriesB.length);
      const corr = pearson(seriesA.slice(0, len), seriesB.slice(0, len));
      arr.push({ category: catB, correlation: corr });
    });
    arr.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    matrix[catA] = arr;
  });
  return matrix;
}

export function topRecommendations(metrics) {
  if (!metrics || !metrics.length) return { stable: [], growth: [], trending: [] };
  const stable = [...metrics].sort((a, b) => a.volatility - b.volatility).slice(0, 5);
  const growth = [...metrics].sort((a, b) => b.cagr - a.cagr).slice(0, 5);
  const trending = [...metrics].sort((a, b) => b.lastThreeYearGrowth - a.lastThreeYearGrowth).slice(0, 5);
  return { stable, growth, trending };
}

export function formatPercent(v, digits = 2) {
  return (v * 100).toFixed(digits) + '%';
}

// ----- New forecasting utilities -----
function safeNumericYear(y) {
  return typeof y === 'string' ? parseInt(y, 10) : y;
}

// Exponential (log-linear) fit: ln(y) = A + B * year
function fitLogLinear(series) {
  const data = series.filter((d) => d.food_value > 0);
  if (data.length < 2) return null;
  const x = data.map((d) => safeNumericYear(d.year));
  const y = data.map((d) => Math.log(d.food_value));
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, v, i) => acc + v * y[i], 0);
  const sumX2 = x.reduce((acc, v) => acc + v * v, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const B = (n * sumXY - sumX * sumY) / denom;
  const A = (sumY - B * sumX) / n;
  return { A, B };
}

export function predictExponential(series, futureYearsCount = 5) {
  const fit = fitLogLinear(series);
  if (!fit) return predictLinear(series, futureYearsCount);
  const lastYear = safeNumericYear(series[series.length - 1].year);
  const { A, B } = fit;
  const preds = [];
  for (let i = 1; i <= futureYearsCount; i++) {
    const yr = lastYear + i;
    const food_value = Math.exp(A + B * yr);
    preds.push({ year: yr.toString(), category: series[0].category, food_value });
  }
  return preds;
}

export function lastFittedExponential(series) {
  const fit = fitLogLinear(series);
  if (!fit) {
    const { a, b } = linearRegression(series);
    const lastYear = safeNumericYear(series[series.length - 1].year);
    return a + b * lastYear;
  }
  const { A, B } = fit;
  const lastYear = safeNumericYear(series[series.length - 1].year);
  return Math.exp(A + B * lastYear);
}

// Holt's linear (double exponential smoothing), additive trend
function holtFit(series, alpha, beta) {
  const y = series.map((d) => d.food_value);
  if (y.length < 2) return { level: y[y.length - 1] || 0, trend: 0, sse: 0 };
  let level = y[0];
  let trend = y[1] - y[0];
  let sse = 0;
  for (let t = 1; t < y.length; t++) {
    const prevLevel = level;
    const yhat = level + trend; // forecast for t
    const obs = y[t];
    sse += (obs - yhat) * (obs - yhat);
    level = alpha * obs + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  return { level, trend, sse };
}

function optimizeHolt(series) {
  // coarse grid search for alpha and beta to minimize SSE
  const grid = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  let best = { alpha: 0.6, beta: 0.4, level: 0, trend: 0, sse: Infinity };
  for (const a of grid) {
    for (const b of grid) {
      const r = holtFit(series, a, b);
      if (r.sse < best.sse) best = { alpha: a, beta: b, ...r };
    }
  }
  return best;
}

export function predictHolt(series, futureYearsCount = 5, options = {}) {
  const { alpha, beta } = options.alpha && options.beta ? options : optimizeHolt(series);
  const { level, trend } = holtFit(series, alpha, beta);
  const lastYear = safeNumericYear(series[series.length - 1].year);
  const preds = [];
  for (let i = 1; i <= futureYearsCount; i++) {
    const yr = lastYear + i;
    const food_value = level + i * trend;
    preds.push({ year: yr.toString(), category: series[0].category, food_value });
  }
  return preds;
}

export function lastFittedHolt(series) {
  const { alpha, beta, level } = optimizeHolt(series);
  // For anchoring at last observed time, yhat_T ≈ level
  return level;
}

// AR(2) autoregression via OLS: y_t = c + phi1*y_{t-1} + phi2*y_{t-2}
function fitAR2(series) {
  const y = series.map((d) => d.food_value);
  const n = y.length;
  if (n < 3) return { c: 0, phi1: 1, phi2: 0 };
  const rows = n - 2;
  // Build normal equations for [c, phi1, phi2]
  const XTX = Array.from({ length: 3 }, () => Array(3).fill(0));
  const XTy = Array(3).fill(0);
  for (let t = 2; t < n; t++) {
    const x0 = 1;
    const x1 = y[t - 1];
    const x2 = y[t - 2];
    const yt = y[t];
    const xs = [x0, x1, x2];
    // X^T X += xs^T xs
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) XTX[r][c] += xs[r] * xs[c];
      XTy[r] += xs[r] * yt;
    }
  }
  const coeffs = solveGaussian(XTX, XTy);
  const [c, phi1, phi2] = coeffs;
  return { c, phi1, phi2 };
}

export function predictAR2(series, futureYearsCount = 5) {
  const params = fitAR2(series);
  const y = series.map((d) => d.food_value);
  const lastYear = safeNumericYear(series[series.length - 1].year);
  const preds = [];
  let y1 = y[y.length - 1];
  let y2 = y[y.length - 2] ?? y1;
  for (let i = 1; i <= futureYearsCount; i++) {
    const ynext = params.c + params.phi1 * y1 + params.phi2 * y2;
    const yr = lastYear + i;
    preds.push({ year: yr.toString(), category: series[0].category, food_value: ynext });
    y2 = y1;
    y1 = ynext;
  }
  return preds;
}

export function lastFittedAR2(series) {
  const { c, phi1, phi2 } = fitAR2(series);
  const y = series.map((d) => d.food_value);
  if (y.length < 3) return y[y.length - 1] || 0;
  // Fitted value at last index n-1 uses y[n-2], y[n-3]
  const y_last = c + phi1 * y[y.length - 1 - 1] + phi2 * y[y.length - 1 - 2];
  return y_last;
}

// Unified helpers
export function predictByMethod(series, method, futureYearsCount = 5) {
  switch (method) {
    case 'linear':
      return predictLinear(series, futureYearsCount);
    case 'poly2':
      return predictPolynomial(series, 2, futureYearsCount);
    case 'poly3':
      return predictPolynomial(series, 3, futureYearsCount);
    case 'holt':
      return predictHolt(series, futureYearsCount);
    case 'exp':
      return predictExponential(series, futureYearsCount);
    case 'ar2':
      return predictAR2(series, futureYearsCount);
    default:
      return predictLinear(series, futureYearsCount);
  }
}

export function lastFittedForMethod(series, method) {
  const lastYear = toNumericYear(series[series.length - 1].year);
  switch (method) {
    case 'linear': {
      const { a, b } = linearRegression(series);
      return a + b * lastYear;
    }
    case 'poly2': {
      const coeffs = polynomialRegression(series, 2);
      return coeffs.reduce((acc, c, i) => acc + c * Math.pow(lastYear, i), 0);
    }
    case 'poly3': {
      const coeffs = polynomialRegression(series, 3);
      return coeffs.reduce((acc, c, i) => acc + c * Math.pow(lastYear, i), 0);
    }
    case 'holt':
      return lastFittedHolt(series);
    case 'exp':
      return lastFittedExponential(series);
    case 'ar2':
      return lastFittedAR2(series);
    default: {
      const { a, b } = linearRegression(series);
      return a + b * lastYear;
    }
  }
}
// ----- End new forecasting utilities -----

