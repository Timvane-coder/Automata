// Enhanced Multi-Distribution StatisticalWorkbook.js
// Supports Normal, T, F, Chi-Square, Exponential, Gamma, Beta, and more

import { createCanvas } from '@napi-rs/canvas';
import * as math from 'mathjs';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';


// Statistical Distribution Functions Library
class StatisticalDistributions {
    // Gamma function approximation (Lanczos approximation)
    static gamma(z) {
        const g = 7;
        const C = [0.99999999999980993,
                  676.5203681218851,
                  -1259.1392167224028,
                  771.32342877765313,
                  -176.61502916214059,
                  12.507343278686905,
                  -0.13857109526572012,
                  9.9843695780195716e-6,
                  1.5056327351493116e-7];

        if (z < 0.5) {
            return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        }

        z -= 1;
        let x = C[0];
        for (let i = 1; i < g + 2; i++) {
            x += C[i] / (z + i);
        }

        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }

    // Beta function
    static beta(a, b) {
        return this.gamma(a) * this.gamma(b) / this.gamma(a + b);
    }

    // Incomplete gamma function (lower)
    static incompleteGammaLower(s, x, iterations = 100) {
        if (x <= 0) return 0;

        let sum = 1;
        let term = 1;

        for (let n = 1; n <= iterations; n++) {
            term *= x / (s + n - 1);
            sum += term;
            if (Math.abs(term) < 1e-12) break;
        }

        return Math.pow(x, s) * Math.exp(-x) * sum / s;
    }

    // Incomplete beta function
    static incompleteBeta(x, a, b, iterations = 100) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;

        const bt = Math.pow(x, a) * Math.pow(1 - x, b) / this.beta(a, b);

        // Continued fraction
        let c = 1;
        let d = 1 - (a + b) * x / (a + 1);
        if (Math.abs(d) < 1e-30) d = 1e-30;
        d = 1 / d;
        let h = d;

        for (let m = 1; m <= iterations; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = 1 + aa / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1 / d;
            h *= d * c;

            aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
            d = 1 + aa * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = 1 + aa / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1 / d;
            const del = d * c;
            h *= del;

            if (Math.abs(del - 1) <= 1e-12) break;
        }

        return bt * h / a;
    }

    // Normal distribution
    static normalPDF(x, mean = 0, std = 1) {
        const z = (x - mean) / std;
        return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
    }

    static normalCDF(x, mean = 0, std = 1) {
        const z = (x - mean) / std;
        const sign = z < 0 ? -1 : 1;
        const absZ = Math.abs(z);

        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const t = 1.0 / (1.0 + p * absZ);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

        return 0.5 + sign * (y - 0.5);
    }

    static normalInverse(p, mean = 0, std = 1) {
        // Beasley-Springer-Moro algorithm
        const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

        const pLow = 0.02425;
        const pHigh = 1 - pLow;
        let x;

        if (p < pLow) {
            const q = Math.sqrt(-2 * Math.log(p));
            x = (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
        } else if (p <= pHigh) {
            const q = p - 0.5;
            const r = q * q;
            x = (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
        } else {
            const q = Math.sqrt(-2 * Math.log(1 - p));
            x = -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
        }

        return mean + std * x;
    }

    // T-distribution
    static tPDF(x, df) {
        const numerator = this.gamma((df + 1) / 2);
        const denominator = Math.sqrt(df * Math.PI) * this.gamma(df / 2);
        return numerator / denominator * Math.pow(1 + x * x / df, -(df + 1) / 2);
    }

    static tCDF(x, df) {
        if (df <= 0) return NaN;
        if (x === 0) return 0.5;

        const t = x / Math.sqrt(df);
        const prob = 0.5 * this.incompleteBeta((df) / (df + x * x), df / 2, 0.5);
        return x > 0 ? 1 - prob : prob;
    }

    static tInverse(p, df) {
        if (p <= 0 || p >= 1) return NaN;
        if (p === 0.5) return 0;

        // Newton-Raphson method
        let x = this.normalInverse(p); // Initial guess
        let iterations = 0;
        for (let i = 0; i < 20; i++) {
            const fx = this.tCDF(x, df) - p;
            const dfx = this.tPDF(x, df);
            const newX = x - fx / dfx;
            if (Math.abs(newX - x) < 1e-12) break;
            x = newX;
            iterations++;
        }
        if (iterations >= 20) {
            console.error(`tInverse did not converge for p=${p}, df=${df}`);
        }
        return x;
    }

    // Chi-square distribution
    static chiSquarePDF(x, df) {
        if (x <= 0) return 0;
        return Math.pow(x, df / 2 - 1) * Math.exp(-x / 2) / (Math.pow(2, df / 2) * this.gamma(df / 2));
    }

    static chiSquareCDF(x, df) {
        if (x <= 0) return 0;
        return this.incompleteGammaLower(df / 2, x / 2) / this.gamma(df / 2);
    }

    static chiSquareInverse(p, df) {
        if (p <= 0) return 0;
        if (p >= 1) return Infinity;

        // Newton-Raphson method
        let x = df; // Initial guess
        let iterations = 0;
        for (let i = 0; i < 50; i++) {
            const fx = this.chiSquareCDF(x, df) - p;
            const dfx = this.chiSquarePDF(x, df);
            if (Math.abs(dfx) < 1e-20) break;
            const newX = x - fx / dfx;
            if (newX <= 0) {
                x = x / 2;
                continue;
            }
            if (Math.abs(newX - x) < 1e-12) break;
            x = newX;
            iterations++;
        }
        if (iterations >= 50) {
            console.error(`chiSquareInverse did not converge for p=${p}, df=${df}`);
        }
        return x;
    }

    // F-distribution
    static fPDF(x, df1, df2) {
        if (x <= 0) return 0;
        const numerator = Math.pow(df1 / df2, df1 / 2) * Math.pow(x, df1 / 2 - 1);
        const denominator = this.beta(df1 / 2, df2 / 2) * Math.pow(1 + df1 * x / df2, (df1 + df2) / 2);
        return numerator / denominator;
    }

    static fCDF(x, df1, df2) {
        if (x <= 0) return 0;
        return this.incompleteBeta(df1 * x / (df1 * x + df2), df1 / 2, df2 / 2);
    }

    static fInverse(p, df1, df2) {
        if (p <= 0) return 0;
        if (p >= 1) return Infinity;

        // Newton-Raphson method
        let x = 1; // Initial guess
        let iterations = 0;
        for (let i = 0; i < 50; i++) {
            const fx = this.fCDF(x, df1, df2) - p;
            const dfx = this.fPDF(x, df1, df2);
            if (Math.abs(dfx) < 1e-20) break;
            const newX = x - fx / dfx;
            if (newX <= 0) {
                x = x / 2;
                continue;
            }
            if (Math.abs(newX - x) < 1e-12) break;
            x = newX;
            iterations++;
        }
        if (iterations >= 50) {
            console.error(`fInverse did not converge for p=${p}, df1=${df1}, df2=${df2}`);
        }
        return x;
    }

    // Exponential distribution
    static exponentialPDF(x, lambda) {
        return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
    }

    static exponentialCDF(x, lambda) {
        return x >= 0 ? 1 - Math.exp(-lambda * x) : 0;
    }

    static exponentialInverse(p, lambda) {
        return p > 0 && p < 1 ? -Math.log(1 - p) / lambda : (p === 0 ? 0 : Infinity);
    }

    // Gamma distribution
    static gammaPDF(x, shape, scale) {
        if (x <= 0) return 0;
        return Math.pow(x, shape - 1) * Math.exp(-x / scale) / (Math.pow(scale, shape) * this.gamma(shape));
    }

    static gammaCDF(x, shape, scale) {
        if (x <= 0) return 0;
        return this.incompleteGammaLower(shape, x / scale) / this.gamma(shape);
    }

    static gammaInverse(p, shape, scale) {
        if (p <= 0) return 0;
        if (p >= 1) return Infinity;

        // Use bisection method for inverse
        let low = 0;
        let high = 100 * shape * scale; // Upper bound guess
        let iterations = 0;
        while (high - low > 1e-10 && iterations < 100) {
            const mid = (low + high) / 2;
            const cdf = this.gammaCDF(mid, shape, scale);
            if (cdf < p) {
                low = mid;
            } else {
                high = mid;
            }
            iterations++;
        }
        if (iterations >= 100) {
            console.error(`gammaInverse did not converge for p=${p}, shape=${shape}, scale=${scale}`);
        }
        return (low + high) / 2;
    }

    // Beta distribution
    static betaPDF(x, alpha, beta) {
        if (x <= 0 || x >= 1) return 0;
        return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / this.beta(alpha, beta);
    }

    static betaCDF(x, alpha, beta) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        return this.incompleteBeta(x, alpha, beta);
    }

    static betaInverse(p, alpha, beta) {
        if (p <= 0) return 0;
        if (p >= 1) return 1;

        // Use bisection method for inverse
        let low = 0;
        let high = 1;
        let iterations = 0;
        while (high - low > 1e-12 && iterations < 100) {
            const mid = (low + high) / 2;
            const cdf = this.betaCDF(mid, alpha, beta);
            if (cdf < p) {
                low = mid;
            } else {
                high = mid;
            }
            iterations++;
        }
        if (iterations >= 100) {
            console.error(`betaInverse did not converge for p=${p}, alpha=${alpha}, beta=${beta}`);
        }
        return (low + high) / 2;
    }

    // Binomial distribution
    static binomialPDF(k, n, p) {
        if (k < 0 || k > n || !Number.isInteger(k)) return 0;
        return math.combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }

    static binomialCDF(x, n, p) {
        let sum = 0;
        const floorX = Math.floor(x);
        for (let k = 0; k <= floorX; k++) {
            sum += this.binomialPDF(k, n, p);
        }
        return sum;
    }

    static binomialInverse(q, n, p) {
        if (q <= 0) return 0;
        if (q >= 1) return n;
        let sum = 0;
        for (let k = 0; k <= n; k++) {
            sum += this.binomialPDF(k, n, p);
            if (sum >= q) return k;
        }
        return n;
    }

    // Bernoulli distribution (special case of binomial with n=1)
    static bernoulliPDF(k, p) {
        return this.binomialPDF(k, 1, p);
    }

    static bernoulliCDF(x, p) {
        return this.binomialCDF(x, 1, p);
    }

    static bernoulliInverse(q, p) {
        return this.binomialInverse(q, 1, p);
    }

    // Poisson distribution
    static poissonPDF(k, lambda) {
        if (k < 0 || !Number.isInteger(k)) return 0;
        return Math.exp(-lambda) * Math.pow(lambda, k) / math.factorial(k);
    }

    static poissonCDF(x, lambda) {
        let sum = 0;
        const floorX = Math.floor(x);
        for (let k = 0; k <= floorX; k++) {
            sum += this.poissonPDF(k, lambda);
        }
        return sum;
    }

    static poissonInverse(q, lambda) {
        if (q <= 0) return 0;
        if (q >= 1) return Infinity;
        let sum = 0;
        let k = 0;
        while (sum < q) {
            sum += this.poissonPDF(k, lambda);
            if (sum >= q) return k;
            k++;
        }
        return k - 1;
    }

    // Geometric distribution (trials until first success, k=1,2,...)
    static geometricPDF(k, p) {
        if (k < 1 || !Number.isInteger(k)) return 0;
        return Math.pow(1 - p, k - 1) * p;
    }

    static geometricCDF(x, p) {
        const floorX = Math.floor(x);
        if (floorX < 1) return 0;
        return 1 - Math.pow(1 - p, floorX);
    }

    static geometricInverse(q, p) {
        if (q <= 0) return 1;
        if (q >= 1) return Infinity;
        return Math.ceil(Math.log(1 - q) / Math.log(1 - p));
    }

    // Uniform distribution (continuous)
    static uniformPDF(x, min, max) {
        if (x < min || x > max) return 0;
        return 1 / (max - min);
    }

    static uniformCDF(x, min, max) {
        if (x < min) return 0;
        if (x > max) return 1;
        return (x - min) / (max - min);
    }

    static uniformInverse(p, min, max) {
        if (p < 0 || p > 1) return NaN;
        return min + p * (max - min);
    }
}

// Distribution Registry
class DistributionRegistry {
    static distributions = {
        'normal': {
            name: 'Normal Distribution',
            params: ['mean', 'std'],
            paramNames: ['μ (mean)', 'σ (standard deviation)'],
            defaultParams: [0, 1],
            pdf: (x, params) => StatisticalDistributions.normalPDF(x, params[0], params[1]),
            cdf: (x, params) => StatisticalDistributions.normalCDF(x, params[0], params[1]),
            inverse: (p, params) => StatisticalDistributions.normalInverse(p, params[0], params[1]),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
                return [mean, Math.sqrt(variance)];
            },
            useCases: ['Measurement errors', 'Natural phenomena', 'Central Limit Theorem applications']
        },
        't': {
            name: 'T Distribution',
            params: ['df'],
            paramNames: ['df (degrees of freedom)'],
            defaultParams: [10],
            pdf: (x, params) => StatisticalDistributions.tPDF(x, params[0]),
            cdf: (x, params) => StatisticalDistributions.tCDF(x, params[0]),
            inverse: (p, params) => StatisticalDistributions.tInverse(p, params[0]),
            estimateParams: (data) => [Math.max(1, data.length - 1)], // df based on sample size
            useCases: ['Small sample hypothesis testing', 'Confidence intervals with unknown variance']
        },
        'chisquare': {
            name: 'Chi-Square Distribution',
            params: ['df'],
            paramNames: ['df (degrees of freedom)'],
            defaultParams: [5],
            pdf: (x, params) => StatisticalDistributions.chiSquarePDF(x, params[0]),
            cdf: (x, params) => StatisticalDistributions.chiSquareCDF(x, params[0]),
            inverse: (p, params) => StatisticalDistributions.chiSquareInverse(p, params[0]),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                return [Math.max(1, Math.round(mean))]; // df ≈ mean for chi-square
            },
            useCases: ['Goodness of fit tests', 'Independence tests', 'Variance testing']
        },
        'f': {
            name: 'F Distribution',
            params: ['df1', 'df2'],
            paramNames: ['df1 (numerator df)', 'df2 (denominator df)'],
            defaultParams: [5, 10],
            pdf: (x, params) => StatisticalDistributions.fPDF(x, params[0], params[1]),
            cdf: (x, params) => StatisticalDistributions.fCDF(x, params[0], params[1]),
            inverse: (p, params) => StatisticalDistributions.fInverse(p, params[0], params[1]),
            estimateParams: (data) => [5, 10], // Require manual specification typically
            useCases: ['ANOVA', 'Comparing variances', 'Regression analysis']
        },
        'exponential': {
            name: 'Exponential Distribution',
            params: ['lambda'],
            paramNames: ['λ (rate parameter)'],
            defaultParams: [1],
            pdf: (x, params) => StatisticalDistributions.exponentialPDF(x, params[0]),
            cdf: (x, params) => StatisticalDistributions.exponentialCDF(x, params[0]),
            inverse: (p, params) => StatisticalDistributions.exponentialInverse(p, params[0]),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                return [1 / mean]; // λ = 1/mean for exponential
            },
            useCases: ['Survival analysis', 'Reliability engineering', 'Queueing theory']
        },
        'gamma': {
            name: 'Gamma Distribution',
            params: ['shape', 'scale'],
            paramNames: ['α (shape)', 'β (scale)'],
            defaultParams: [2, 1],
            pdf: (x, params) => StatisticalDistributions.gammaPDF(x, params[0], params[1]),
            cdf: (x, params) => StatisticalDistributions.gammaCDF(x, params[0], params[1]),
            inverse: (p, params) => StatisticalDistributions.gammaInverse(p, params[0], params[1]),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
                const scale = variance / mean;
                const shape = mean / scale;
                return [shape, scale];
            },
            useCases: ['Waiting times', 'Reliability analysis', 'Bayesian priors']
        },
        'beta': {
            name: 'Beta Distribution',
            params: ['alpha', 'beta'],
            paramNames: ['α (shape 1)', 'β (shape 2)'],
            defaultParams: [2, 2],
            pdf: (x, params) => StatisticalDistributions.betaPDF(x, params[0], params[1]),
            cdf: (x, params) => StatisticalDistributions.betaCDF(x, params[0], params[1]),
            inverse: (p, params) => StatisticalDistributions.betaInverse(p, params[0], params[1]),
            estimateParams: (data) => {
                // Method of moments estimation
                const mean = data.reduce((a, b) => a + b) / data.length;
                const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
                const temp = mean * (1 - mean) / variance - 1;
                const alpha = mean * temp;
                const beta = (1 - mean) * temp;
                return [Math.max(0.1, alpha), Math.max(0.1, beta)];
            },
            useCases: ['Proportions', 'Probabilities', 'Bayesian analysis']
        },
        'binomial': {
            name: 'Binomial Distribution',
            params: ['n', 'p'],
            paramNames: ['n (trials)', 'p (success probability)'],
            defaultParams: [10, 0.5],
            pdf: (k, params) => StatisticalDistributions.binomialPDF(k, ...params),
            cdf: (x, params) => StatisticalDistributions.binomialCDF(x, ...params),
            inverse: (p, params) => StatisticalDistributions.binomialInverse(p, ...params),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
                const pEst = 1 - variance / mean;
                const nEst = Math.round(mean / pEst);
                return [Math.max(1, nEst), Math.max(0.01, Math.min(0.99, pEst))];
            },
            useCases: ['Number of successes in fixed trials', 'Quality control', 'Survey responses']
        },
        'bernoulli': {
            name: 'Bernoulli Distribution',
            params: ['p'],
            paramNames: ['p (success probability)'],
            defaultParams: [0.5],
            pdf: (k, params) => StatisticalDistributions.bernoulliPDF(k, ...params),
            cdf: (x, params) => StatisticalDistributions.bernoulliCDF(x, ...params),
            inverse: (p, params) => StatisticalDistributions.bernoulliInverse(p, ...params),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                return [Math.max(0.01, Math.min(0.99, mean))];
            },
            useCases: ['Single trial success/failure', 'Binary outcomes']
        },
        'poisson': {
            name: 'Poisson Distribution',
            params: ['lambda'],
            paramNames: ['λ (rate)'],
            defaultParams: [1],
            pdf: (k, params) => StatisticalDistributions.poissonPDF(k, ...params),
            cdf: (x, params) => StatisticalDistributions.poissonCDF(x, ...params),
            inverse: (p, params) => StatisticalDistributions.poissonInverse(p, ...params),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                return [Math.max(0.01, mean)];
            },
            useCases: ['Rare events count', 'Arrival rates', 'Defects per unit']
        },
        'geometric': {
            name: 'Geometric Distribution',
            params: ['p'],
            paramNames: ['p (success probability)'],
            defaultParams: [0.5],
            pdf: (k, params) => StatisticalDistributions.geometricPDF(k, ...params),
            cdf: (x, params) => StatisticalDistributions.geometricCDF(x, ...params),
            inverse: (p, params) => StatisticalDistributions.geometricInverse(p, ...params),
            estimateParams: (data) => {
                const mean = data.reduce((a, b) => a + b) / data.length;
                return [Math.max(0.01, Math.min(0.99, 1 / mean))];
            },
            useCases: ['Trials until first success', 'Failure analysis']
        },
        'uniform': {
            name: 'Uniform Distribution',
            params: ['min', 'max'],
            paramNames: ['min (lower bound)', 'max (upper bound)'],
            defaultParams: [0, 1],
            pdf: (x, params) => StatisticalDistributions.uniformPDF(x, ...params),
            cdf: (x, params) => StatisticalDistributions.uniformCDF(x, ...params),
            inverse: (p, params) => StatisticalDistributions.uniformInverse(p, ...params),
            estimateParams: (data) => {
                return [Math.min(...data), Math.max(...data)];
            },
            useCases: ['Equal probability intervals', 'Random number generation']
        }
    };

    static getDistribution(name) {
        return this.distributions[name] || null;
    }

    static getAllDistributions() {
        return Object.keys(this.distributions);
    }
}

export class EnhancedStatisticalWorkbook {
    constructor(options = {}) {
        this.width = options.width || 1200;
        this.height = options.height || 1600;
        this.theme = options.theme || "excel";

        // Spreadsheet styling
        this.cellWidth = 180;
        this.cellHeight = 25;
        this.headerHeight = 30;
        this.rowLabelWidth = 50;
        this.fontSize = 11;

        // Data storage
        this.rawSamples = [];
        this.sampleName = "";
        this.variableName = "";
        this.unitName = "";
        this.scenarioDescription = "";

        // Distribution analysis
        this.selectedDistribution = 'normal';
        this.distributionParams = null;
        this.distributionAnalysis = {};
        this.goodnessOfFit = {};
        this.confidenceIntervals = {};
        this.hypothesisTests = {};

        // Comparative analysis
        this.comparisonResults = {};

        // Calculated statistics
        this.statistics = {};
        this.calculationHistory = [];
        this.currentWorkbook = null;

        // Target analysis
        this.targetValue = null;
        this.targetAnalysisType = null;
        this.targetAnalysis = {};

        // Parameter CI
        this.parameterConfidenceIntervals = {};

        // Theme colors
        this.setThemeColors();
    }

    setThemeColors() {
        const themes = {
            excel: {
                background: '#ffffff',
                gridColor: '#c0c0c0',
                headerBg: '#4472c4',
                headerText: '#ffffff',
                sectionBg: '#d9e2f3',
                sectionText: '#000000',
                cellBg: '#ffffff',
                cellText: '#000000',
                resultBg: '#e2efda',
                resultText: '#000000',
                formulaBg: '#fff2cc',
                formulaText: '#7f6000',
                borderColor: '#808080'
            }
        };
        this.colors = themes[this.theme] || themes.excel;
    }

    // Data Import Methods
    loadFromCSV(filePath) {
        const csvData = fs.readFileSync(filePath, 'utf8');
        const parsed = Papa.parse(csvData, { header: false, skipEmptyLines: true });
        this.rawSamples = parsed.data.flat().map(Number).filter(n => !isNaN(n));
        console.log(`Loaded ${this.rawSamples.length} samples from CSV: ${filePath}`);
    }

    loadFromJSON(filePath) {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.rawSamples = jsonData.samples || [];
        console.log(`Loaded ${this.rawSamples.length} samples from JSON: ${filePath}`);
    }

    // Main analysis method
    analyzeDistribution(config) {
        this.sampleName = config.sampleName || "Sample Data";
        this.variableName = config.variableName || "Value";
        this.unitName = config.unitName || "units";
        this.scenarioDescription = config.scenarioDescription || "";
        this.rawSamples = [...config.samples];
        this.selectedDistribution = config.distribution || 'normal';
        this.distributionParams = config.distributionParams || null;
        this.targetValue = config.targetValue || null;
        this.targetAnalysisType = config.targetAnalysisType || null;

        // Calculate basic statistics
        this.calculateStatistics();

        // Fit distribution
        this.fitDistribution();

        // Calculate confidence intervals
        this.calculateDistributionConfidenceIntervals();

        // Parameter confidence intervals
        this.calculateParameterConfidenceIntervals();

        // Perform goodness of fit tests
        this.performGoodnessOfFitTests();

        // Hypothesis testing if specified
        if (config.hypothesisTest) {
            this.performHypothesisTest(config.hypothesisTest);
        }

        // Compare with other distributions if requested
        if (config.compareDistributions) {
            this.compareDistributions(config.compareDistributions);
        }

        // Target analysis if target value provided
        if (this.targetValue !== null) {
            this.calculateDistributionSpecificTargetAnalysis();
        }

        // Generate workbook
        this.generateWorkbook();

        return this.currentWorkbook;
    }

    calculateStatistics() {
        const n = this.rawSamples.length;
        const sum = this.rawSamples.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        const sortedSamples = [...this.rawSamples].sort((a, b) => a - b);

        const variance = this.rawSamples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
        const standardDeviation = Math.sqrt(variance);

        // Percentiles
        const getPercentile = (p) => {
            const index = (p / 100) * (n - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;

            if (upper >= n) return sortedSamples[n - 1];
            return sortedSamples[lower] * (1 - weight) + sortedSamples[upper] * weight;
        };

        this.statistics = {
            n,
            sum,
            mean,
            variance,
            standardDeviation,
            min: Math.min(...this.rawSamples),
            max: Math.max(...this.rawSamples),
            range: Math.max(...this.rawSamples) - Math.min(...this.rawSamples),
            median: getPercentile(50),
            q1: getPercentile(25),
            q3: getPercentile(75),
            iqr: getPercentile(75) - getPercentile(25),
            skewness: this.calculateSkewness(),
            kurtosis: this.calculateKurtosis(),
            percentiles: {
                5: getPercentile(5),
                10: getPercentile(10),
                25: getPercentile(25),
                50: getPercentile(50),
                75: getPercentile(75),
                90: getPercentile(90),
                95: getPercentile(95)
            }
        };
    }

    calculateSkewness() {
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const std = this.statistics.standardDeviation;

        const sumCubed = this.rawSamples.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sumCubed;
    }

    calculateKurtosis() {
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const std = this.statistics.standardDeviation;

        const sumFourth = this.rawSamples.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0);
        return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sumFourth - 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3));
    }

    fitDistribution() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        if (!dist) {
            throw new Error(`Unknown distribution: ${this.selectedDistribution}`);
        }

        // Estimate parameters if not provided
        if (!this.distributionParams && dist.estimateParams) {
            this.distributionParams = dist.estimateParams(this.rawSamples);
        } else if (!this.distributionParams) {
            this.distributionParams = dist.defaultParams;
        }

        // Calculate distribution statistics
        const distributionStats = {
            name: dist.name,
            parameters: {},
            theoreticalMoments: this.calculateTheoreticalMoments()
        };

        // Map parameters to names
        dist.params.forEach((param, index) => {
            distributionStats.parameters[param] = this.distributionParams[index];
        });

        this.distributionAnalysis = {
            distribution: this.selectedDistribution,
            ...distributionStats,
            logLikelihood: this.calculateLogLikelihood(),
            aic: this.calculateAIC(),
            bic: this.calculateBIC()
        };
    }

    calculateTheoreticalMoments() {
        // This would be distribution-specific
        // For now, return basic structure
        return {
            mean: null,
            variance: null,
            skewness: null,
            kurtosis: null
        };
    }

    calculateLogLikelihood() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        let logLikelihood = 0;

        this.rawSamples.forEach(x => {
            const pdf = dist.pdf(x, this.distributionParams);
            if (pdf > 0) {
                logLikelihood += Math.log(pdf);
            }
        });

        return logLikelihood;
    }

    calculateAIC() {
        const k = this.distributionParams.length;
        const logL = this.distributionAnalysis.logLikelihood;
        return 2 * k - 2 * logL;
    }

    calculateBIC() {
        const k = this.distributionParams.length;
        const n = this.statistics.n;
        const logL = this.distributionAnalysis.logLikelihood;
        return k * Math.log(n) - 2 * logL;
    }

    calculateDistributionConfidenceIntervals() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        if (!dist.inverse) return;

        const confidenceLevels = [0.90, 0.95, 0.99];
        this.confidenceIntervals = {};

        confidenceLevels.forEach(level => {
            const alpha = 1 - level;
            const lowerP = alpha / 2;
            const upperP = 1 - alpha / 2;

            const lowerBound = dist.inverse(lowerP, this.distributionParams);
            const upperBound = dist.inverse(upperP, this.distributionParams);

            this.confidenceIntervals[level] = {
                level,
                lowerBound,
                upperBound,
                width: upperBound - lowerBound
            };
        });
    }

    performGoodnessOfFitTests() {
        this.goodnessOfFit = {
            kolmogorovSmirnov: this.kolmogorovSmirnovTest(),
            andersonDarling: this.andersonDarlingTest(),
            chisquareTest: this.chiSquareGoodnessOfFit(),
            shapiroWilk: this.shapiroWilkTest()
        };
    }

    shapiroWilkTest() {
        // Simple implementation of Shapiro-Wilk test for normality
        // Note: This assumes the selected distribution is 'normal'; otherwise, skip or adapt
        if (this.selectedDistribution !== 'normal') {
            return { note: 'Shapiro-Wilk implemented only for normal distribution' };
        }

        const n = this.rawSamples.length;
        if (n < 3 || n > 5000) return { error: 'Sample size must be between 3 and 5000' };

        const sorted = [...this.rawSamples].sort((a, b) => a - b);
        const mean = this.statistics.mean;
        const ss = this.rawSamples.reduce((acc, x) => acc + (x - mean) ** 2, 0);

        // Coefficients for W (approximate; for exact, use tables)
        const a = new Array(n);
        const m = new Array(n);
        for (let i = 0; i < n; i++) {
            m[i] = StatisticalDistributions.normalInverse((i + 1 - 0.375) / (n + 0.25));
        }
        const mm = m.reduce((acc, val) => acc + val ** 2, 0);
        for (let i = 0; i < n; i++) {
            a[i] = m[i] / Math.sqrt(mm);
        }

        let b = 0;
        for (let i = 0; i < n; i++) {
            b += a[i] * sorted[i];
        }

        const w = (b ** 2) / ss;

        // Approximate p-value (for n <= 50)
        const mu = 0.0038915 * Math.log(n) ** 3 - 0.083751 * Math.log(n) ** 2 - 0.31082 * Math.log(n) - 1.5861;
        const sigma = Math.exp(0.0030302 * Math.log(n) ** 2 - 0.082676 * Math.log(n) - 0.4803);
        const z = (Math.log(1 - w) - mu) / sigma;
        const pValue = 1 - StatisticalDistributions.normalCDF(z);

        return {
            testStatistic: w,
            pValue,
            reject: {
                '0.05': pValue < 0.05,
                '0.01': pValue < 0.01,
                '0.001': pValue < 0.001
            }
        };
    }

    kolmogorovSmirnovTest() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        const sortedData = [...this.rawSamples].sort((a, b) => a - b);
        const n = sortedData.length;
        let maxDiff = 0;

        for (let i = 0; i < n; i++) {
            const empiricalCDF = (i + 1) / n;
            const theoreticalCDF = dist.cdf(sortedData[i], this.distributionParams);
            const diff = Math.abs(empiricalCDF - theoreticalCDF);
            maxDiff = Math.max(maxDiff, diff);
        }

        // Critical values for common significance levels
        const criticalValues = {
            0.05: 1.36 / Math.sqrt(n),
            0.01: 1.63 / Math.sqrt(n),
            0.001: 1.95 / Math.sqrt(n)
        };

        return {
            testStatistic: maxDiff,
            criticalValues,
            pValue: this.calculateKSPValue(maxDiff, n),
            reject: {
                '0.05': maxDiff > criticalValues[0.05],
                '0.01': maxDiff > criticalValues[0.01],
                '0.001': maxDiff > criticalValues[0.001]
            }
        };
    }

    calculateKSPValue(d, n) {
        // Approximation for KS p-value
        const lambda = (Math.sqrt(n) + 0.12 + 0.11/Math.sqrt(n)) * d;
        let sum = 0;
        for (let i = 1; i <= 100; i++) {
            sum += Math.pow(-1, i-1) * Math.exp(-2 * i * i * lambda * lambda);
        }
        return 2 * sum;
    }

    andersonDarlingTest() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        const sortedData = [...this.rawSamples].sort((a, b) => a - b);
        const n = sortedData.length;
        let sum = 0;

        for (let i = 0; i < n; i++) {
            const cdfValue = dist.cdf(sortedData[i], this.distributionParams);
            const cdfComplement = 1 - dist.cdf(sortedData[n - i - 1], this.distributionParams);

            if (cdfValue > 0 && cdfValue < 1 && cdfComplement > 0 && cdfComplement < 1) {
                sum += (2 * i + 1) * (Math.log(cdfValue) + Math.log(cdfComplement));
            }
        }

        const testStatistic = -n - (1/n) * sum;

        // Critical values vary by distribution
        const criticalValues = {
            0.05: 2.492,
            0.01: 3.857,
            0.001: 6.000
        };

        return {
            testStatistic,
            criticalValues,
            reject: {
                '0.05': testStatistic > criticalValues[0.05],
                '0.01': testStatistic > criticalValues[0.01],
                '0.001': testStatistic > criticalValues[0.001]
            }
        };
    }

    chiSquareGoodnessOfFit() {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        const n = this.rawSamples.length;
        const k = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(n)))); // Number of bins

        const min = Math.min(...this.rawSamples);
        const max = Math.max(...this.rawSamples);
        const binWidth = (max - min) / k;

        const observed = new Array(k).fill(0);
        const expected = new Array(k).fill(0);

        // Count observed frequencies
        this.rawSamples.forEach(x => {
            const bin = Math.min(k - 1, Math.floor((x - min) / binWidth));
            observed[bin]++;
        });

        // Calculate expected frequencies
        for (let i = 0; i < k; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            const probStart = dist.cdf(binStart, this.distributionParams);
            const probEnd = dist.cdf(binEnd, this.distributionParams);
            expected[i] = n * (probEnd - probStart);
        }

        // Calculate chi-square statistic
        let chiSquare = 0;
        for (let i = 0; i < k; i++) {
            if (expected[i] > 0) {
                chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
            }
        }

        const df = k - 1 - this.distributionParams.length;
        const pValue = 1 - StatisticalDistributions.chiSquareCDF(chiSquare, df);

        return {
            testStatistic: chiSquare,
            degreesOfFreedom: df,
            pValue,
            observed,
            expected,
            bins: k,
            reject: {
                '0.05': pValue < 0.05,
                '0.01': pValue < 0.01,
                '0.001': pValue < 0.001
            }
        };
    }

    performHypothesisTest(testConfig) {
        const testType = testConfig.type;

        switch (testType) {
            case 'oneSample':
                this.hypothesisTests.oneSample = this.oneSampleTest(testConfig);
                break;
            case 'twoSample':
                this.hypothesisTests.twoSample = this.twoSampleTest(testConfig);
                break;
            case 'paired':
                this.hypothesisTests.paired = this.pairedTest(testConfig);
                break;
            case 'proportion':
                this.hypothesisTests.proportion = this.proportionTest(testConfig);
                break;
            case 'variance':
                this.hypothesisTests.variance = this.varianceTest(testConfig);
                break;
            case 'gamma':
                this.hypothesisTests.gamma = this.performGammaHypothesisTest(testConfig);
                break;
            case 'chisquare':
                this.hypothesisTests.chisquare = this.performChiSquareHypothesisTest(testConfig);
                break;
            case 'f':
                this.hypothesisTests.f = this.performFHypothesisTest(testConfig);
                break;
            case 'exponential':
                this.hypothesisTests.exponential = this.performExponentialHypothesisTest(testConfig);
                break;
            case 'normal':
                this.hypothesisTests.normal = this.performNormalHypothesisTest(testConfig);
                break;
            case 't':
                this.hypothesisTests.t = this.performTHypothesisTest(testConfig);
                break;
            case 'beta':
                this.hypothesisTests.beta = this.performBetaHypothesisTest(testConfig);
                break;
            case 'binomial':
                this.hypothesisTests.binomial = this.performBinomialHypothesisTest(testConfig);
                break;
            case 'bernoulli':
                this.hypothesisTests.bernoulli = this.performBernoulliHypothesisTest(testConfig);
                break;
            case 'poisson':
                this.hypothesisTests.poisson = this.performPoissonHypothesisTest(testConfig);
                break;
            case 'geometric':
                this.hypothesisTests.geometric = this.performGeometricHypothesisTest(testConfig);
                break;
            case 'uniform':
                this.hypothesisTests.uniform = this.performUniformHypothesisTest(testConfig);
                break;
            default:
                throw new Error(`Unknown test type: ${testType}`);
        }
    }

    oneSampleTest(config) {
        const { nullValue, alternative = 'two-sided', alpha = 0.05 } = config;
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const std = this.statistics.standardDeviation;

        const standardError = std / Math.sqrt(n);
        const testStatistic = (mean - nullValue) / standardError;

        // Use t-distribution for small samples or unknown population variance
        let pValue;
        let criticalValue;

        if (n >= 30) {
            // Use normal distribution
            if (alternative === 'two-sided') {
                pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
                criticalValue = StatisticalDistributions.normalInverse(1 - alpha/2);
            } else if (alternative === 'greater') {
                pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
                criticalValue = StatisticalDistributions.normalInverse(1 - alpha);
            } else {
                pValue = StatisticalDistributions.normalCDF(testStatistic);
                criticalValue = StatisticalDistributions.normalInverse(alpha);
            }
        } else {
            // Use t-distribution
            const df = n - 1;
            if (alternative === 'two-sided') {
                pValue = 2 * (1 - StatisticalDistributions.tCDF(Math.abs(testStatistic), df));
                criticalValue = StatisticalDistributions.tInverse(1 - alpha/2, df);
            } else if (alternative === 'greater') {
                pValue = 1 - StatisticalDistributions.tCDF(testStatistic, df);
                criticalValue = StatisticalDistributions.tInverse(1 - alpha, df);
            } else {
                pValue = StatisticalDistributions.tCDF(testStatistic, df);
                criticalValue = StatisticalDistributions.tInverse(alpha, df);
            }
        }

        return {
            testType: 'One Sample Test',
            nullHypothesis: `μ = ${nullValue}`,
            alternative,
            testStatistic,
            pValue,
            criticalValue,
            standardError,
            confidenceInterval: this.calculateMeanConfidenceInterval(1 - alpha),
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    twoSampleTest(config) {
        const { sample2, equalVariance = true, alternative = 'two-sided', alpha = 0.05 } = config;

        // Calculate statistics for second sample
        const n1 = this.statistics.n;
        const mean1 = this.statistics.mean;
        const var1 = this.statistics.variance;

        const n2 = sample2.length;
        const mean2 = sample2.reduce((a, b) => a + b) / n2;
        const var2 = sample2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (n2 - 1);

        let testStatistic, df, standardError;

        if (equalVariance) {
            // Pooled variance t-test
            const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
            standardError = Math.sqrt(pooledVar * (1/n1 + 1/n2));
            testStatistic = (mean1 - mean2) / standardError;
            df = n1 + n2 - 2;
        } else {
            // Welch's t-test
            standardError = Math.sqrt(var1/n1 + var2/n2);
            testStatistic = (mean1 - mean2) / standardError;
            df = Math.pow(var1/n1 + var2/n2, 2) / (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
        }

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.tCDF(Math.abs(testStatistic), df));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.tCDF(testStatistic, df);
        } else {
            pValue = StatisticalDistributions.tCDF(testStatistic, df);
        }

        return {
            testType: 'Two Sample Test',
            nullHypothesis: 'μ1 = μ2',
            alternative,
            testStatistic,
            pValue,
            degreesOfFreedom: df,
            standardError,
            sample1Stats: { n: n1, mean: mean1, variance: var1 },
            sample2Stats: { n: n2, mean: mean2, variance: var2 },
            equalVariance,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    pairedTest(config) {
        const { sample2, alternative = 'two-sided', alpha = 0.05 } = config;

        if (this.rawSamples.length !== sample2.length) {
            throw new Error('Paired samples must have equal length');
        }

        const differences = this.rawSamples.map((x, i) => x - sample2[i]);
        const n = differences.length;
        const meanDiff = differences.reduce((a, b) => a + b) / n;
        const varDiff = differences.reduce((acc, val) => acc + Math.pow(val - meanDiff, 2), 0) / (n - 1);
        const stdDiff = Math.sqrt(varDiff);

        const standardError = stdDiff / Math.sqrt(n);
        const testStatistic = meanDiff / standardError;
        const df = n - 1;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.tCDF(Math.abs(testStatistic), df));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.tCDF(testStatistic, df);
        } else {
            pValue = StatisticalDistributions.tCDF(testStatistic, df);
        }

        return {
            testType: 'Paired Sample Test',
            nullHypothesis: 'μd = 0',
            alternative,
            testStatistic,
            pValue,
            degreesOfFreedom: df,
            meanDifference: meanDiff,
            standardError,
            differences: differences.slice(0, 10), // Show first 10 differences
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    proportionTest(config) {
        const { nullProportion, alternative = 'two-sided', alpha = 0.05 } = config;
        const n = this.rawSamples.length;
        const successes = this.rawSamples.filter(x => x === 1).length;
        const sampleProportion = successes / n;

        const standardError = Math.sqrt(nullProportion * (1 - nullProportion) / n);
        const testStatistic = (sampleProportion - nullProportion) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic);
        }

        return {
            testType: 'Proportion Test',
            nullHypothesis: `p = ${nullProportion}`,
            alternative,
            testStatistic,
            pValue,
            sampleProportion,
            standardError,
            successes,
            sampleSize: n,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    varianceTest(config) {
        const { nullVariance, alternative = 'two-sided', alpha = 0.05 } = config;
        const n = this.statistics.n;
        const sampleVariance = this.statistics.variance;

        const testStatistic = (n - 1) * sampleVariance / nullVariance;
        const df = n - 1;

        let pValue;
        if (alternative === 'two-sided') {
            const lower = StatisticalDistributions.chiSquareCDF(testStatistic, df);
            const upper = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
            pValue = 2 * Math.min(lower, upper);
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
        } else {
            pValue = StatisticalDistributions.chiSquareCDF(testStatistic, df);
        }

        return {
            testType: 'Variance Test',
            nullHypothesis: `σ² = ${nullVariance}`,
            alternative,
            testStatistic,
            pValue,
            degreesOfFreedom: df,
            sampleVariance,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    calculateMeanConfidenceInterval(confidence = 0.95) {
        const alpha = 1 - confidence;
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const std = this.statistics.standardDeviation;
        const standardError = std / Math.sqrt(n);

        let criticalValue;
        if (n >= 30) {
            criticalValue = StatisticalDistributions.normalInverse(1 - alpha/2);
        } else {
            criticalValue = StatisticalDistributions.tInverse(1 - alpha/2, n - 1);
        }

        const marginOfError = criticalValue * standardError;

        return {
            confidence,
            lowerBound: mean - marginOfError,
            upperBound: mean + marginOfError,
            marginOfError,
            standardError
        };
    }

    compareDistributions(distributionsList) {
        const results = {};

        distributionsList.forEach(distName => {
            const dist = DistributionRegistry.getDistribution(distName);
            if (!dist || !dist.estimateParams) return;

            const params = dist.estimateParams(this.rawSamples);
            const logLikelihood = this.calculateLogLikelihoodForDistribution(distName, params);
            const k = params.length;
            const n = this.statistics.n;

            const aic = 2 * k - 2 * logLikelihood;
            const bic = k * Math.log(n) - 2 * logLikelihood;

            // Perform KS test
            const ksTest = this.performKSTestForDistribution(distName, params);

            results[distName] = {
                name: dist.name,
                parameters: params,
                logLikelihood,
                aic,
                bic,
                ksTest,
                rank: 0 // Will be calculated after all distributions
            };
        });

        // Rank distributions by AIC
        const sortedByAIC = Object.entries(results).sort((a, b) => a[1].aic - b[1].aic);
        sortedByAIC.forEach(([name, result], index) => {
            results[name].rank = index + 1;
        });

        this.comparisonResults = {
            distributions: results,
            bestFit: sortedByAIC[0][0],
            summary: this.generateComparisonSummary(results)
        };
    }

    calculateLogLikelihoodForDistribution(distName, params) {
        const dist = DistributionRegistry.getDistribution(distName);
        let logLikelihood = 0;

        this.rawSamples.forEach(x => {
            const pdf = dist.pdf(x, params);
            if (pdf > 0) {
                logLikelihood += Math.log(pdf);
            }
        });

        return logLikelihood;
    }

    performKSTestForDistribution(distName, params) {
        const dist = DistributionRegistry.getDistribution(distName);
        const sortedData = [...this.rawSamples].sort((a, b) => a - b);
        const n = sortedData.length;
        let maxDiff = 0;

        for (let i = 0; i < n; i++) {
            const empiricalCDF = (i + 1) / n;
            const theoreticalCDF = dist.cdf(sortedData[i], params);
            const diff = Math.abs(empiricalCDF - theoreticalCDF);
            maxDiff = Math.max(maxDiff, diff);
        }

        const criticalValue = 1.36 / Math.sqrt(n);
        const pValue = this.calculateKSPValue(maxDiff, n);

        return {
            testStatistic: maxDiff,
            criticalValue,
            pValue,
            reject: maxDiff > criticalValue
        };
    }

    generateComparisonSummary(results) {
        const sortedResults = Object.entries(results).sort((a, b) => a[1].aic - b[1].aic);

        return {
            bestFit: sortedResults[0][0],
            summary: `Based on AIC, ${DistributionRegistry.getDistribution(sortedResults[0][0]).name} provides the best fit to the data.`,
            recommendations: this.generateRecommendations(sortedResults)
        };
    }

    generateRecommendations(sortedResults) {
        const recommendations = [];
        const best = sortedResults[0];

        recommendations.push(`The ${DistributionRegistry.getDistribution(best[0]).name} is recommended as the primary model.`);

        if (sortedResults.length > 1) {
            const second = sortedResults[1];
            const aicDiff = second[1].aic - best[1].aic;
            if (aicDiff < 2) {
                recommendations.push(`The ${DistributionRegistry.getDistribution(second[0]).name} provides a similarly good fit (ΔAIC = ${aicDiff.toFixed(2)}).`);
            }
        }
        return recommendations;
    }

    // ANOVA Analysis
    performANOVA(groups) {
        const k = groups.length; // number of groups
        const N = groups.reduce((sum, group) => sum + group.length, 0); // total sample size

        // Calculate group means and overall mean
        const groupMeans = groups.map(group => group.reduce((sum, val) => sum + val, 0) / group.length);
        const overallMean = groups.flat().reduce((sum, val) => sum + val, 0) / N;

        // Calculate Sum of Squares Between (SSB)
        let SSB = 0;
        for (let i = 0; i < k; i++) {
            SSB += groups[i].length * Math.pow(groupMeans[i] - overallMean, 2);
        }

        // Calculate Sum of Squares Within (SSW)
        let SSW = 0;
        for (let i = 0; i < k; i++) {
            for (let j = 0; j < groups[i].length; j++) {
                SSW += Math.pow(groups[i][j] - groupMeans[i], 2);
            }
        }

        // Calculate Total Sum of Squares (SST)
        const SST = SSB + SSW;

        // Degrees of freedom
        const dfBetween = k - 1;
        const dfWithin = N - k;
        const dfTotal = N - 1;

        // Mean Squares
        const MSB = SSB / dfBetween;
        const MSW = SSW / dfWithin;

        // F-statistic
        const fStatistic = MSB / MSW;
        const pValue = 1 - StatisticalDistributions.fCDF(fStatistic, dfBetween, dfWithin);

        return {
            testType: 'One-Way ANOVA',
            groups: groups.length,
            totalSampleSize: N,
            groupSizes: groups.map(g => g.length),
            groupMeans,
            overallMean,
            sumOfSquares: {
                between: SSB,
                within: SSW,
                total: SST
            },
            degreesOfFreedom: {
                between: dfBetween,
                within: dfWithin,
                total: dfTotal
            },
            meanSquares: {
                between: MSB,
                within: MSW
            },
            fStatistic,
            pValue,
            reject: pValue < 0.05,
            conclusion: pValue < 0.05 ? 'Reject null hypothesis - groups have different means' : 'Fail to reject null hypothesis - no evidence of different group means'
        };
    }

    // Survival Analysis (Basic Kaplan-Meier)
    performSurvivalAnalysis(times, events) {
        if (times.length !== events.length) {
            throw new Error('Times and events arrays must have the same length');
        }

        // Combine and sort by time
        const data = times.map((time, i) => ({ time, event: events[i] }))
                          .sort((a, b) => a.time - b.time);

        const results = [];
        let nAtRisk = data.length;
        let survivalProbability = 1.0;

        for (let i = 0; i < data.length; i++) {
            const currentTime = data[i].time;
            let nEvents = 0;
            let j = i;

            // Count events at this time point
            while (j < data.length && data[j].time === currentTime) {
                if (data[j].event === 1) nEvents++;
                j++;
            }

            if (nEvents > 0) {
                survivalProbability *= (nAtRisk - nEvents) / nAtRisk;
            }

            results.push({
                time: currentTime,
                nAtRisk,
                nEvents,
                survivalProbability,
                standardError: Math.sqrt(survivalProbability * (1 - survivalProbability) / nAtRisk)
            });

            nAtRisk -= (j - i);
            i = j - 1; // Skip to next unique time
        }

        return {
            testType: 'Kaplan-Meier Survival Analysis',
            survivalTable: results,
            medianSurvivalTime: this.calculateMedianSurvival(results),
            summary: this.generateSurvivalSummary(results)
        };
    }

    calculateMedianSurvival(survivalTable) {
        for (let i = 0; i < survivalTable.length; i++) {
            if (survivalTable[i].survivalProbability <= 0.5) {
                return survivalTable[i].time;
            }
        }
        return null; // Median not reached
    }

    generateSurvivalSummary(survivalTable) {
        const finalSurvival = survivalTable[survivalTable.length - 1].survivalProbability;
        return {
            finalSurvivalRate: finalSurvival,
            totalEvents: survivalTable.reduce((sum, row) => sum + row.nEvents, 0),
            followUpTime: survivalTable[survivalTable.length - 1].time
        };
    }

    // Parameter Confidence Intervals
    calculateParameterConfidenceIntervals() {
        const confidenceLevels = [0.90, 0.95, 0.99];
        this.parameterConfidenceIntervals = {};

        confidenceLevels.forEach(level => {
            this.parameterConfidenceIntervals[level] = this.calculateParameterCIForLevel(level);
        });
    }

    calculateParameterCIForLevel(confidence) {
        const alpha = 1 - confidence;
        const n = this.statistics.n;

        switch(this.selectedDistribution) {
            case 'normal':
                return this.calculateNormalParameterCI(confidence, alpha, n);
            case 't':
                return this.calculateTParameterCI(confidence, alpha, n);
            case 'exponential':
                return this.calculateExponentialParameterCI(confidence, alpha, n);
            case 'gamma':
                return this.calculateGammaParameterCI(confidence, alpha, n);
            case 'beta':
                return this.calculateBetaParameterCI(confidence, alpha, n);
            case 'chisquare':
                return this.calculateChiSquareParameterCI(confidence, alpha, n);
            case 'f':
                return this.calculateFParameterCI(confidence, alpha, n);
            case 'binomial':
                return this.calculateBinomialParameterCI(confidence, alpha, n);
            case 'bernoulli':
                return this.calculateBernoulliParameterCI(confidence, alpha, n);
            case 'poisson':
                return this.calculatePoissonParameterCI(confidence, alpha, n);
            case 'geometric':
                return this.calculateGeometricParameterCI(confidence, alpha, n);
            case 'uniform':
                return this.calculateUniformParameterCI(confidence, alpha, n);
            default:
                return this.calculateBootstrapParameterCI(confidence, alpha, n);
        }
    }

    calculateNormalParameterCI(confidence, alpha, n) {
        const mean = this.statistics.mean;
        const std = this.statistics.standardDeviation;
        const tCritical = StatisticalDistributions.tInverse(1 - alpha/2, n - 1);

        const meanSE = std / Math.sqrt(n);
        const varSE = std * Math.sqrt(2 / (n - 1)); // Approximate

        return {
            parameters: {
                mean: {
                    estimate: mean,
                    lowerBound: mean - tCritical * meanSE,
                    upperBound: mean + tCritical * meanSE,
                    standardError: meanSE,
                    interpretation: 'Confidence interval for the population mean'
                },
                standardDeviation: {
                    estimate: std,
                    lowerBound: std * Math.sqrt((n - 1) / StatisticalDistributions.chiSquareInverse(1 - alpha/2, n - 1)),
                    upperBound: std * Math.sqrt((n - 1) / StatisticalDistributions.chiSquareInverse(alpha/2, n - 1)),
                    standardError: varSE,
                    interpretation: 'Confidence interval for the population standard deviation'
                }
            }
        };
    }

    calculateExponentialParameterCI(confidence, alpha, n) {
        const lambda = this.distributionParams[0];
        const mean = this.statistics.mean;

        // For exponential, MLE of λ = 1/sample_mean
        // CI for λ using chi-square distribution
        const lowerBound = StatisticalDistributions.chiSquareInverse(alpha/2, 2 * n) / (2 * n * mean);
        const upperBound = StatisticalDistributions.chiSquareInverse(1 - alpha/2, 2 * n) / (2 * n * mean);

        return {
            parameters: {
                lambda: {
                    estimate: lambda,
                    lowerBound,
                    upperBound,
                    standardError: lambda / Math.sqrt(n),
                    interpretation: `Rate parameter: ${lambda.toFixed(4)} events per unit time`
                },
                meanTime: {
                    estimate: 1/lambda,
                    lowerBound: 1/upperBound,
                    upperBound: 1/lowerBound,
                    standardError: (1/lambda) / Math.sqrt(n),
                    interpretation: `Average time between events: ${(1/lambda).toFixed(4)} time units`
                }
            }
        };
    }

    calculateGammaParameterCI(confidence, alpha, n) {
        const [shape, scale] = this.distributionParams;

        // Approximate confidence intervals using asymptotic theory
        const shapeSE = shape / Math.sqrt(n);
        const scaleSE = scale / Math.sqrt(n);
        const zCritical = StatisticalDistributions.normalInverse(1 - alpha/2, 0, 1);

        return {
            parameters: {
                shape: {
                    estimate: shape,
                    lowerBound: Math.max(0.01, shape - zCritical * shapeSE),
                    upperBound: shape + zCritical * shapeSE,
                    standardError: shapeSE,
                    interpretation: `Shape parameter α = ${shape.toFixed(3)} determines distribution shape`
                },
                scale: {
                    estimate: scale,
                    lowerBound: Math.max(0.01, scale - zCritical * scaleSE),
                    upperBound: scale + zCritical * scaleSE,
                    standardError: scaleSE,
                    interpretation: `Scale parameter β = ${scale.toFixed(3)} stretches the distribution`
                }
            }
        };
    }

    calculateBetaParameterCI(confidence, alpha, n) {
        const [alphaParam, betaParam] = this.distributionParams;

        // Use delta method for approximate confidence intervals
        const alphaSE = Math.sqrt(alphaParam * (alphaParam + betaParam + n) / (n * (alphaParam + betaParam)));
        const betaSE = Math.sqrt(betaParam * (alphaParam + betaParam + n) / (n * (alphaParam + betaParam)));
        const zCritical = StatisticalDistributions.normalInverse(1 - alpha/2, 0, 1);

        return {
            parameters: {
                alpha: {
                    estimate: alphaParam,
                    lowerBound: Math.max(0.01, alphaParam - zCritical * alphaSE),
                    upperBound: alphaParam + zCritical * alphaSE,
                    standardError: alphaSE,
                    interpretation: `Shape parameter α = ${alphaParam.toFixed(3)}`
                },
                beta: {
                    estimate: betaParam,
                    lowerBound: Math.max(0.01, betaParam - zCritical * betaSE),
                    upperBound: betaParam + zCritical * betaSE,
                    standardError: betaSE,
                    interpretation: `Shape parameter β = ${betaParam.toFixed(3)}`
                }
            }
        };
    }

    calculateTParameterCI(confidence, alpha, n) {
        const df = this.distributionParams[0];

        // Approximate CI for degrees of freedom parameter
        const dfSE = Math.sqrt(2 * df); // Approximate standard error
        const zCritical = StatisticalDistributions.normalInverse(1 - alpha/2, 0, 1);

        return {
            parameters: {
                degreesOfFreedom: {
                    estimate: df,
                    lowerBound: Math.max(1, df - zCritical * dfSE),
                    upperBound: df + zCritical * dfSE,
                    standardError: dfSE,
                    interpretation: `Degrees of freedom = ${df}, affects tail behavior`
                }
            }
        };
    }

    calculateChiSquareParameterCI(confidence, alpha, n) {
        const df = this.distributionParams[0];

        // For chi-square, mean = df, so we can estimate df from sample mean
        // CI based on gamma distribution properties
        const dfSE = Math.sqrt(2 * df / n);
        const zCritical = StatisticalDistributions.normalInverse(1 - alpha/2, 0, 1);

        return {
            parameters: {
                degreesOfFreedom: {
                    estimate: df,
                    lowerBound: Math.max(1, df - zCritical * dfSE),
                    upperBound: df + zCritical * dfSE,
                    standardError: dfSE,
                    interpretation: `df = ${df.toFixed(1)}, determines distribution shape and spread`
                }
            }
        };
    }

    calculateFParameterCI(confidence, alpha, n) {
        const [df1, df2] = this.distributionParams;

        // F-distribution parameters are typically fixed by design
        // Provide informational CI based on theoretical properties
        return {
            parameters: {
                numeratorDF: {
                    estimate: df1,
                    lowerBound: df1,
                    upperBound: df1,
                    standardError: 0,
                    interpretation: `Numerator df = ${df1}, typically determined by study design`
                },
                denominatorDF: {
                    estimate: df2,
                    lowerBound: df2,
                    upperBound: df2,
                    standardError: 0,
                    interpretation: `Denominator df = ${df2}, typically determined by study design`
                }
            }
        };
    }

    calculateBinomialParameterCI(confidence, alpha, n) {
        return this.calculateBootstrapParameterCI(confidence, alpha, n);
    }

    calculateBernoulliParameterCI(confidence, alpha, n) {
        return this.calculateBootstrapParameterCI(confidence, alpha, n);
    }

    calculatePoissonParameterCI(confidence, alpha, n) {
        return this.calculateBootstrapParameterCI(confidence, alpha, n);
    }

    calculateGeometricParameterCI(confidence, alpha, n) {
        return this.calculateBootstrapParameterCI(confidence, alpha, n);
    }

    calculateUniformParameterCI(confidence, alpha, n) {
        return this.calculateBootstrapParameterCI(confidence, alpha, n);
    }

    calculateBootstrapParameterCI(confidence, alpha, n, bootstrapSamples = 1000) {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        if (!dist.estimateParams) return null;

        const bootstrapEstimates = [];

        // Generate bootstrap samples
        for (let i = 0; i < bootstrapSamples; i++) {
            const bootstrapSample = this.generateBootstrapSample();
            const bootstrapParams = dist.estimateParams(bootstrapSample);
            bootstrapEstimates.push(bootstrapParams);
        }

        // Calculate percentile confidence intervals for each parameter
        const parameterCIs = {};

        dist.params.forEach((paramName, paramIndex) => {
            const paramValues = bootstrapEstimates.map(params => params[paramIndex]).sort((a, b) => a - b);
            const lowerIndex = Math.floor((alpha / 2) * bootstrapSamples);
            const upperIndex = Math.ceil((1 - alpha / 2) * bootstrapSamples) - 1;

            parameterCIs[paramName] = {
                estimate: this.distributionParams[paramIndex],
                lowerBound: paramValues[lowerIndex],
                upperBound: paramValues[upperIndex],
                standardError: this.calculateBootstrapSE(paramValues),
                interpretation: this.getParameterInterpretation(paramName, this.distributionParams[paramIndex])
            };
        });

        return {
            parameters: parameterCIs,
            bootstrapSamples: bootstrapSamples,
            method: 'Bootstrap Percentile Method'
        };
    }

    generateBootstrapSample() {
        const n = this.rawSamples.length;
        const bootstrapSample = [];

        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * n);
            bootstrapSample.push(this.rawSamples[randomIndex]);
        }

        return bootstrapSample;
    }

    calculateBootstrapSE(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
        return Math.sqrt(variance);
    }

    // Distribution-Specific Target Analysis
    calculateDistributionSpecificTargetAnalysis() {
        if (this.targetValue === null) return;

        switch(this.selectedDistribution) {
            case 'normal':
                this.targetAnalysis = this.calculateNormalTargetAnalysis();
                break;
            case 't':
                this.targetAnalysis = this.calculateTTargetAnalysis();
                break;
            case 'exponential':
                this.targetAnalysis = this.calculateExponentialTargetAnalysis();
                break;
            case 'gamma':
                this.targetAnalysis = this.calculateGammaTargetAnalysis();
                break;
            case 'beta':
                this.targetAnalysis = this.calculateBetaTargetAnalysis();
                break;
            case 'chisquare':
                this.targetAnalysis = this.calculateChiSquareTargetAnalysis();
                break;
            case 'f':
                this.targetAnalysis = this.calculateFTargetAnalysis();
                break;
            case 'binomial':
                this.targetAnalysis = this.calculateBinomialTargetAnalysis();
                break;
            case 'bernoulli':
                this.targetAnalysis = this.calculateBernoulliTargetAnalysis();
                break;
            case 'poisson':
                this.targetAnalysis = this.calculatePoissonTargetAnalysis();
                break;
            case 'geometric':
                this.targetAnalysis = this.calculateGeometricTargetAnalysis();
                break;
            case 'uniform':
                this.targetAnalysis = this.calculateUniformTargetAnalysis();
                break;
            default:
                this.targetAnalysis = this.calculateGenericTargetAnalysis();
        }
    }

    calculateNormalTargetAnalysis() {
        const [mean, std] = this.distributionParams;
        const target = this.targetValue;

        const zScore = (target - mean) / std;
        const probLessThan = StatisticalDistributions.normalCDF(target, mean, std);
        const probGreaterThan = 1 - probLessThan;

        const effectSize = Math.abs(zScore);

        return {
            targetValue: target,
            targetType: 'Value',
            zScore: zScore,
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(X ≤ ${target}) = ${probLessThan.toFixed(4)}`
            },
            effectSize: effectSize,
            practicalSignificance: this.assessNormalPracticalSignificance(effectSize),
            recommendation: this.generateNormalRecommendation(effectSize, zScore),
            distributionContext: {
                mean: mean,
                standardDeviation: std,
                standardizedValue: zScore
            }
        };
    }

    assessNormalPracticalSignificance(effectSize) {
        if (effectSize < 0.2) return 'Negligible difference from mean';
        if (effectSize < 0.5) return 'Small difference from mean';
        if (effectSize < 0.8) return 'Medium difference from mean';
        return 'Large difference from mean';
    }

    generateNormalRecommendation(effectSize, zScore) {
        if (effectSize < 0.2) {
            return "Target value is very close to the mean. No significant deviation.";
        } else if (effectSize < 0.8) {
            return "Target value shows moderate deviation. Review if within acceptable range.";
        } else {
            return "Target value is far from the mean. Investigate potential outliers or shifts.";
        }
    }

    calculateTTargetAnalysis() {
        const df = this.distributionParams[0];
        const target = this.targetValue;

        const probLessThan = StatisticalDistributions.tCDF(target, df);
        const probGreaterThan = 1 - probLessThan;

        // Effect size compared to standard normal
        const normalEquivalent = StatisticalDistributions.normalInverse(probLessThan);
        const effectSize = Math.abs(normalEquivalent);

        return {
            targetValue: target,
            targetType: 'T-Value',
            degreesOfFreedom: df,
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(T ≤ ${target}) = ${probLessThan.toFixed(4)} with df=${df}`
            },
            effectSize: effectSize,
            practicalSignificance: this.assessTPracticalSignificance(effectSize, df),
            recommendation: this.generateTRecommendation(effectSize, target, df),
            distributionContext: {
                degreesOfFreedom: df,
                normalEquivalent: normalEquivalent,
                tailBehavior: df > 30 ? 'Similar to normal' : 'Heavy tails'
            }
        };
    }

    assessTPracticalSignificance(effectSize, df) {
        if (df < 10) return effectSize > 2.5 ? 'Large (small df)' : 'Small to medium (small df)';
        return effectSize > 1.96 ? 'Significant at 5% level' : 'Not significant at 5% level';
    }

    generateTRecommendation(effectSize, target, df) {
        return `With df=${df}, the target t-value of ${target} corresponds to a p-value of ${(1 - StatisticalDistributions.tCDF(Math.abs(target), df))*2}.toFixed(4) for two-tailed test.`;
    }

    calculateExponentialTargetAnalysis() {
        const lambda = this.distributionParams[0];
        const target = this.targetValue;
        const sampleMean = this.statistics.mean;

        // For exponential, analyze target rate or target time
        const isRateTarget = this.targetAnalysisType === 'rate';
        const actualTarget = isRateTarget ? target : 1/target;

        // Probability calculations
        const probGreaterThan = target > 0 ? Math.exp(-lambda * target) : 1;
        const probLessThan = 1 - probGreaterThan;

        // Effect size for exponential
        const effectSize = Math.abs(Math.log(sampleMean / (1/lambda)));

        return {
            targetValue: target,
            targetType: isRateTarget ? 'Rate Parameter' : 'Time Value',
            sampleEstimate: isRateTarget ? lambda : sampleMean,
            probabilities: {
                greaterThan: probGreaterThan,
                lessThan: probLessThan,
                interpretation: `P(X > ${target}) = ${probGreaterThan.toFixed(4)}`
            },
            effectSize: effectSize,
            practicalSignificance: this.assessExponentialPracticalSignificance(effectSize),
            recommendation: this.generateExponentialRecommendation(effectSize, probGreaterThan),
            distributionContext: {
                expectedValue: 1/lambda,
                variance: 1/(lambda * lambda),
                medianValue: Math.log(2)/lambda
            }
        };
    }

    assessExponentialPracticalSignificance(effectSize) {
        if (effectSize < 0.2) return 'Negligible';
        if (effectSize < 0.5) return 'Small';
        if (effectSize < 0.8) return 'Medium';
        return 'Large';
    }

    generateExponentialRecommendation(effectSize, probability) {
        if (effectSize < 0.2) {
            return "The data is consistent with the exponential model. No action needed.";
        } else if (effectSize < 0.8) {
            return "Moderate evidence suggests reviewing the exponential assumption or parameter values.";
        } else {
            return "Strong evidence against the current exponential model. Consider alternative distributions or parameter adjustment.";
        }
    }

    calculateGammaTargetAnalysis() {
        const [shape, scale] = this.distributionParams;
        const target = this.targetValue;

        const dist = DistributionRegistry.getDistribution('gamma');
        const probLessThan = dist.cdf(target, this.distributionParams);
        const probGreaterThan = 1 - probLessThan;

        const expectedValue = shape * scale;
        const effectSize = Math.abs(target - expectedValue) / Math.sqrt(shape * scale * scale);

        return {
            targetValue: target,
            targetType: 'Value',
            expectedValue: expectedValue,
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(X ≤ ${target}) = ${probLessThan.toFixed(4)}`
            },
            effectSize: effectSize,
            practicalSignificance: this.assessGammaPracticalSignificance(effectSize),
            recommendation: this.generateGammaRecommendation(effectSize, probLessThan),
            distributionContext: {
                expectedValue: expectedValue,
                variance: shape * scale * scale,
                mode: shape > 1 ? (shape - 1) * scale : 0
            }
        };
    }

    assessGammaPracticalSignificance(effectSize) {
        if (effectSize < 0.2) return 'Negligible deviation';
        if (effectSize < 0.5) return 'Small deviation';
        if (effectSize < 0.8) return 'Medium deviation';
        return 'Large deviation';
    }

    generateGammaRecommendation(effectSize, probLessThan) {
        if (effectSize < 0.2) {
            return "Target is close to expected value under gamma model.";
        } else {
            return "Significant deviation; consider if gamma model is appropriate.";
        }
    }

    calculateBetaTargetAnalysis() {
        const [alpha, beta] = this.distributionParams;
        const target = this.targetValue;

        if (target < 0 || target > 1) {
            return {
                error: 'Target value must be between 0 and 1 for Beta distribution'
            };
        }

        const probLessThan = StatisticalDistributions.betaCDF(target, alpha, beta);
        const probGreaterThan = 1 - probLessThan;

        const mean = alpha / (alpha + beta);
        const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
        const effectSize = Math.abs(target - mean) / Math.sqrt(variance);

        return {
            targetValue: target,
            targetType: 'Proportion/Probability',
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(X ≤ ${target}) = ${probLessThan.toFixed(4)}`
            },
            effectSize: effectSize,
            practicalSignificance: this.assessBetaPracticalSignificance(effectSize),
            recommendation: this.generateBetaRecommendation(effectSize, target, mean),
            distributionContext: {
                expectedValue: mean,
                mode: alpha > 1 && beta > 1 ? (alpha - 1)/(alpha + beta - 2) : null,
                variance: variance
            }
        };
    }

    assessBetaPracticalSignificance(effectSize) {
        if (effectSize < 0.2) return 'Negligible';
        if (effectSize < 0.5) return 'Small';
        if (effectSize < 0.8) return 'Medium';
        return 'Large';
    }

    generateBetaRecommendation(effectSize, target, mean) {
        if (effectSize < 0.2) {
            return "Target proportion is close to expected value.";
        } else {
            return `Target ${target.toFixed(3)} deviates from mean ${mean.toFixed(3)}; review data.`;
        }
    }

    calculateChiSquareTargetAnalysis() {
        const df = this.distributionParams[0];
        const target = this.targetValue;

        const probLessThan = StatisticalDistributions.chiSquareCDF(target, df);
        const probGreaterThan = 1 - probLessThan;

        const expectedValue = df;
        const effectSize = Math.abs(target - expectedValue) / Math.sqrt(2 * df);

        return {
            targetValue: target,
            targetType: 'Chi-Square Value',
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(χ² ≤ ${target}) = ${probLessThan.toFixed(4)} with df=${df}`
            },
            effectSize: effectSize,
            practicalSignificance: effectSize > 1.96 ? 'Significant' : 'Not significant',
            recommendation: `For df=${df}, value ${target} is ${effectSize > 1.96 ? 'significant' : 'not significant'} at 5% level.`,
            distributionContext: {
                expectedValue: df,
                variance: 2 * df,
                mode: df > 2 ? df - 2 : 0
            }
        };
    }

    calculateFTargetAnalysis() {
        const [df1, df2] = this.distributionParams;
        const target = this.targetValue;

        if (target < 0) {
            return {
                error: 'Target value must be positive for F distribution'
            };
        }

        const probLessThan = StatisticalDistributions.fCDF(target, df1, df2);
        const probGreaterThan = 1 - probLessThan;

        // Critical values for common significance levels
        const criticalValues = {
            '0.10': StatisticalDistributions.fInverse(0.90, df1, df2),
            '0.05': StatisticalDistributions.fInverse(0.95, df1, df2),
            '0.01': StatisticalDistributions.fInverse(0.99, df1, df2)
        };

        return {
            targetValue: target,
            targetType: 'F-Statistic',
            degreesOfFreedom: { df1, df2 },
            probabilities: {
                lessThan: probLessThan,
                greaterThan: probGreaterThan,
                interpretation: `P(F ≤ ${target}) = ${probLessThan.toFixed(4)} with df1=${df1}, df2=${df2}`
            },
            criticalValues: criticalValues,
            statisticalSignificance: {
                '0.10': target > criticalValues['0.10'],
                '0.05': target > criticalValues['0.05'],
                '0.01': target > criticalValues['0.01']
            },
            recommendation: this.generateFRecommendation(target, criticalValues),
            distributionContext: {
                numeratorDF: df1,
                denominatorDF: df2,
                expectedValue: df2 > 2 ? df2 / (df2 - 2) : 'Undefined'
            }
        };
    }

    generateFRecommendation(target, criticalValues) {
        if (target > criticalValues['0.01']) {
            return "Highly significant difference in variances (p < 0.01)";
        } else if (target > criticalValues['0.05']) {
            return "Significant difference in variances (p < 0.05)";
        } else {
            return "No significant difference in variances (p > 0.05)";
        }
    }

    calculateGenericTargetAnalysis() {
        return {
            note: 'Generic target analysis not implemented for this distribution'
        };
    }

    calculateBinomialTargetAnalysis() {
        return this.calculateGenericTargetAnalysis();
    }

    calculateBernoulliTargetAnalysis() {
        return this.calculateGenericTargetAnalysis();
    }

    calculatePoissonTargetAnalysis() {
        return this.calculateGenericTargetAnalysis();
    }

    calculateGeometricTargetAnalysis() {
        return this.calculateGenericTargetAnalysis();
    }

    calculateUniformTargetAnalysis() {
        return this.calculateGenericTargetAnalysis();
    }

    // Enhanced Distribution-Specific Hypothesis Testing
    performGammaHypothesisTest(testConfig) {
        const { nullShape, nullScale, testParameter = 'shape', alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const [observedShape, observedScale] = this.distributionParams;
        const n = this.statistics.n;

        if (testParameter === 'shape') {
            // Test for shape parameter using likelihood ratio test
            const logL1 = this.calculateLogLikelihood(); // Full model
            const logL0 = this.calculateLogLikelihoodUnderNull([nullShape, observedScale]); // Null model

            const lrStatistic = 2 * (logL1 - logL0);
            const pValue = 1 - StatisticalDistributions.chiSquareCDF(lrStatistic, 1);

            return {
                testType: 'Gamma Shape Parameter Test (Likelihood Ratio)',
                nullHypothesis: `α = ${nullShape}`,
                alternative: alternative,
                testStatistic: lrStatistic,
                pValue: pValue,
                degreesOfFreedom: 1,
                observedShape: observedShape,
                nullShape: nullShape,
                reject: pValue < alpha,
                conclusion: pValue < alpha ? 
                    `Reject H₀: Evidence suggests shape parameter ≠ ${nullShape}` : 
                    `Data consistent with shape parameter = ${nullShape}`,
                method: 'Likelihood Ratio Test'
            };
        } else if (testParameter === 'scale') {
            // Similar test for scale parameter
            const logL1 = this.calculateLogLikelihood();
            const logL0 = this.calculateLogLikelihoodUnderNull([observedShape, nullScale]);

            const lrStatistic = 2 * (logL1 - logL0);
            const pValue = 1 - StatisticalDistributions.chiSquareCDF(lrStatistic, 1);

            return {
                testType: 'Gamma Scale Parameter Test (Likelihood Ratio)',
                nullHypothesis: `β = ${nullScale}`,
                alternative: alternative,
                testStatistic: lrStatistic,
                pValue: pValue,
                degreesOfFreedom: 1,
                observedScale: observedScale,
                nullScale: nullScale,
                reject: pValue < alpha,
                conclusion: pValue < alpha ? 
                    `Reject H₀: Evidence suggests scale parameter ≠ ${nullScale}` : 
                    `Data consistent with scale parameter = ${nullScale}`,
                method: 'Likelihood Ratio Test'
            };
        }
    }

    calculateLogLikelihoodUnderNull(nullParams) {
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);
        let logLikelihood = 0;

        this.rawSamples.forEach(x => {
            const pdf = dist.pdf(x, nullParams);
            if (pdf > 0) {
                logLikelihood += Math.log(pdf);
            }
        });

        return logLikelihood;
    }

    performChiSquareHypothesisTest(testConfig) {
        const { nullDF, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const observedDF = this.distributionParams[0];
        const n = this.statistics.n;

        // For chi-square, we can test if the degrees of freedom parameter matches expected value
        // Using the sample mean (which equals df for chi-square) and its sampling distribution
        const sampleMean = this.statistics.mean;
        const expectedMean = nullDF;
        const standardError = Math.sqrt(2 * nullDF / n); // Approximate SE for chi-square mean

        // Z-test approximation for large samples
        const zStatistic = (sampleMean - expectedMean) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(zStatistic), 0, 1));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(zStatistic, 0, 1);
        } else {
            pValue = StatisticalDistributions.normalCDF(zStatistic, 0, 1);
        }

        return {
            testType: 'Chi-Square Degrees of Freedom Test',
            nullHypothesis: `df = ${nullDF}`,
            alternative: alternative,
            testStatistic: zStatistic,
            pValue: pValue,
            sampleMean: sampleMean,
            expectedMean: expectedMean,
            standardError: standardError,
            observedDF: observedDF,
            nullDF: nullDF,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 
                `Reject H₀: Evidence suggests degrees of freedom ≠ ${nullDF}` : 
                `Fail to reject H₀: Data consistent with df = ${nullDF}`,
            method: 'Large Sample Z-Test Approximation'
        };
    }

    performFHypothesisTest(testConfig) {
        const { sample2, nullRatio = 1, alternative = 'two-sided', alpha = 0.05 } = testConfig;

        if (!sample2 || sample2.length === 0) {
            throw new Error('F-test requires a second sample for variance comparison');
        }

        // Calculate sample variances
        const var1 = this.statistics.variance;
        const n1 = this.statistics.n;

        const mean2 = sample2.reduce((a, b) => a + b) / sample2.length;
        const var2 = sample2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
        const n2 = sample2.length;

        // F-test statistic
        const fStatistic = (var1 / var2) / nullRatio;
        const df1 = n1 - 1;
        const df2 = n2 - 1;

        let pValue;
        if (alternative === 'two-sided') {
            const cdf = StatisticalDistributions.fCDF(fStatistic, df1, df2);
            pValue = 2 * Math.min(cdf, 1 - cdf);
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.fCDF(fStatistic, df1, df2);
        } else {
            pValue = StatisticalDistributions.fCDF(fStatistic, df1, df2);
        }

        return {
            testType: 'F-Test for Ratio of Variances',
            nullHypothesis: `σ₁²/σ₂² = ${nullRatio}`,
            alternative: alternative,
            testStatistic: fStatistic,
            pValue: pValue,
            df1: df1,
            df2: df2,
            variance1: var1,
            variance2: var2,
            sampleSize1: n1,
            sampleSize2: n2,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 
                'Reject H₀: Evidence suggests variances ratio ≠ ' + nullRatio : 
                'Fail to reject H₀: No evidence against variances ratio = ' + nullRatio,
            method: 'F-Test'
        };
    }

    performDistributionSpecificHypothesisTests(testConfig) {
        return this.performHypothesisTest(testConfig); // Redirect to main method
    }

    performExponentialHypothesisTest(testConfig) {
        const { nullRate, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const n = this.statistics.n;
        const sampleMean = this.statistics.mean;
        const observedRate = 1 / sampleMean;

        // Test statistic: 2nλ₀X̄ ~ χ²(2n) under null hypothesis
        const testStatistic = 2 * n * nullRate * sampleMean;
        const df = 2 * n;

        let pValue;
        if (alternative === 'two-sided') {
            const lower = StatisticalDistributions.chiSquareCDF(testStatistic, df);
            const upper = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
            pValue = 2 * Math.min(lower, upper);
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
        } else {
            pValue = StatisticalDistributions.chiSquareCDF(testStatistic, df);
        }

        return {
            testType: 'Exponential Rate Test',
            nullHypothesis: `λ = ${nullRate}`,
            alternative: alternative,
            testStatistic: testStatistic,
            degreesOfFreedom: df,
            pValue: pValue,
            observedRate: observedRate,
            expectedMeanTime: 1/nullRate,
            observedMeanTime: sampleMean,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 
                `Reject H₀: Evidence suggests rate ≠ ${nullRate}` : 
                `Fail to reject H₀: Data consistent with rate = ${nullRate}`,
            confidenceInterval: this.calculateExponentialRateCI(1 - alpha)
        };
    }

    calculateExponentialRateCI(confidence) {
        const alpha = 1 - confidence;
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const lowerBound = StatisticalDistributions.chiSquareInverse(alpha/2, 2 * n) / (2 * n * mean);
        const upperBound = StatisticalDistributions.chiSquareInverse(1 - alpha/2, 2 * n) / (2 * n * mean);

        return {
            confidence,
            lowerBound: lowerBound,
            upperBound: upperBound
        };
    }

    performNormalHypothesisTest(testConfig) {
        const { nullMean = 0, nullStd = null, testParameter = 'mean', alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const [observedMean, observedStd] = this.distributionParams;
        const n = this.statistics.n;

        if (testParameter === 'mean') {
            // One-sample t-test for mean
            const standardError = observedStd / Math.sqrt(n);
            const testStatistic = (observedMean - nullMean) / standardError;
            const df = n - 1;

            let pValue;
            if (alternative === 'two-sided') {
                pValue = 2 * (1 - StatisticalDistributions.tCDF(Math.abs(testStatistic), df));
            } else if (alternative === 'greater') {
                pValue = 1 - StatisticalDistributions.tCDF(testStatistic, df);
            } else {
                pValue = StatisticalDistributions.tCDF(testStatistic, df);
            }

            return {
                testType: 'Normal Mean Test (One-Sample t-test)',
                nullHypothesis: `μ = ${nullMean}`,
                alternative: alternative,
                testStatistic: testStatistic,
                pValue: pValue,
                degreesOfFreedom: df,
                observedMean: observedMean,
                nullMean: nullMean,
                standardError: standardError,
                reject: pValue < alpha,
                conclusion: pValue < alpha ?
                    `Reject H₀: Evidence suggests mean ≠ ${nullMean}` :
                    `Fail to reject H₀: Data consistent with mean = ${nullMean}`,
                method: 'One-Sample t-test'
            };
        } else if (testParameter === 'variance' && nullStd !== null) {
            // Chi-square test for variance
            const nullVariance = nullStd * nullStd;
            const observedVariance = observedStd * observedStd;
            const testStatistic = (n - 1) * observedVariance / nullVariance;
            const df = n - 1;

            let pValue;
            if (alternative === 'two-sided') {
                const lower = StatisticalDistributions.chiSquareCDF(testStatistic, df);
                const upper = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
                pValue = 2 * Math.min(lower, upper);
            } else if (alternative === 'greater') {
                pValue = 1 - StatisticalDistributions.chiSquareCDF(testStatistic, df);
            } else {
                pValue = StatisticalDistributions.chiSquareCDF(testStatistic, df);
            }

            return {
                testType: 'Normal Variance Test (Chi-square)',
                nullHypothesis: `σ² = ${nullVariance}`,
                alternative: alternative,
                testStatistic: testStatistic,
                pValue: pValue,
                degreesOfFreedom: df,
                observedVariance: observedVariance,
                nullVariance: nullVariance,
                reject: pValue < alpha,
                conclusion: pValue < alpha ?
                    `Reject H₀: Evidence suggests variance ≠ ${nullVariance}` :
                    `Fail to reject H₀: Data consistent with variance = ${nullVariance}`,
                method: 'Chi-square test for variance'
            };
        }
    }

    performTHypothesisTest(testConfig) {
        const { nullDF, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const observedDF = this.distributionParams[0];
        const n = this.statistics.n;

        // Test if degrees of freedom matches expected value
        // Using sample-based approximation
        const sampleMean = this.statistics.mean;
        const sampleVar = this.statistics.variance;

        // For t-distribution, theoretical variance = df/(df-2) for df > 2
        if (observedDF <= 2) {
            return {
                error: 'Hypothesis testing for t-distribution requires df > 2'
            };
        }

        const theoreticalVar = observedDF / (observedDF - 2);
        const standardError = Math.sqrt(2 * theoreticalVar / n);
        const testStatistic = (sampleVar - theoreticalVar) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic), 0, 1));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic, 0, 1);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic, 0, 1);
        }

        return {
            testType: 'T-Distribution Degrees of Freedom Test',
            nullHypothesis: `df = ${nullDF}`,
            alternative: alternative,
            testStatistic: testStatistic,
            pValue: pValue,
            observedDF: observedDF,
            nullDF: nullDF,
            theoreticalVariance: theoreticalVar,
            sampleVariance: sampleVar,
            reject: pValue < alpha,
            conclusion: pValue < alpha ?
                `Reject H₀: Evidence suggests df ≠ ${nullDF}` :
                `Fail to reject H₀: Data consistent with df = ${nullDF}`,
            method: 'Large Sample Approximation'
        };
    }

    performBetaHypothesisTest(testConfig) {
        const { nullAlpha, nullBeta, testParameter = 'both', alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const [observedAlpha, observedBeta] = this.distributionParams;
        const n = this.statistics.n;

        // Likelihood ratio test for beta parameters
        const logL1 = this.calculateLogLikelihood(); // Full model
        let logL0;
        let df = 1;

        if (testParameter === 'alpha') {
            logL0 = this.calculateLogLikelihoodUnderNull([nullAlpha, observedBeta]);
        } else if (testParameter === 'beta') {
            logL0 = this.calculateLogLikelihoodUnderNull([observedAlpha, nullBeta]);
        } else {
            logL0 = this.calculateLogLikelihoodUnderNull([nullAlpha, nullBeta]);
            df = 2;
        }

        const lrStatistic = 2 * (logL1 - logL0);
        const pValue = 1 - StatisticalDistributions.chiSquareCDF(lrStatistic, df);

        return {
            testType: 'Beta Distribution Parameter Test (Likelihood Ratio)',
            nullHypothesis: testParameter === 'both' ? 
                `α = ${nullAlpha}, β = ${nullBeta}` : 
                testParameter === 'alpha' ? `α = ${nullAlpha}` : `β = ${nullBeta}`,
            alternative: alternative,
            testStatistic: lrStatistic,
            pValue: pValue,
            degreesOfFreedom: df,
            observedParameters: { alpha: observedAlpha, beta: observedBeta },
            nullParameters: { alpha: nullAlpha, beta: nullBeta },
            reject: pValue < alpha,
            conclusion: pValue < alpha ?
                'Reject H₀: Evidence against null parameter values' :
                'Fail to reject H₀: Data consistent with null parameter values',
            method: 'Likelihood Ratio Test'
        };
    }

    performBinomialHypothesisTest(testConfig) {
        const { nullP, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const [nTrials, observedP] = this.distributionParams;
        const N = this.statistics.n; // Number of binomial samples

        const totalSuccesses = this.rawSamples.reduce((a, b) => a + b, 0);
        const totalTrials = N * nTrials;
        const sampleP = totalSuccesses / totalTrials;

        const standardError = Math.sqrt(nullP * (1 - nullP) / totalTrials);
        const testStatistic = (sampleP - nullP) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic);
        }

        return {
            testType: 'Binomial Proportion Test',
            nullHypothesis: `p = ${nullP}`,
            alternative,
            testStatistic,
            pValue,
            sampleProportion: sampleP,
            standardError,
            totalSuccesses,
            totalTrials,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    performBernoulliHypothesisTest(testConfig) {
        const { nullP, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const observedP = this.distributionParams[0];
        const n = this.statistics.n;

        const successes = this.rawSamples.reduce((a, b) => a + b, 0);
        const sampleP = successes / n;

        const standardError = Math.sqrt(nullP * (1 - nullP) / n);
        const testStatistic = (sampleP - nullP) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic);
        }

        return {
            testType: 'Bernoulli Proportion Test',
            nullHypothesis: `p = ${nullP}`,
            alternative,
            testStatistic,
            pValue,
            sampleProportion: sampleP,
            standardError,
            successes,
            sampleSize: n,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    performPoissonHypothesisTest(testConfig) {
        const { nullLambda, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const observedLambda = this.distributionParams[0];
        const n = this.statistics.n;
        const sampleMean = this.statistics.mean;

        const standardError = Math.sqrt(nullLambda / n);
        const testStatistic = (sampleMean - nullLambda) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic);
        }

        return {
            testType: 'Poisson Rate Test',
            nullHypothesis: `λ = ${nullLambda}`,
            alternative,
            testStatistic,
            pValue,
            observedLambda,
            sampleMean,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    performGeometricHypothesisTest(testConfig) {
        const { nullP, alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const observedP = this.distributionParams[0];
        const n = this.statistics.n;
        const sampleMean = this.statistics.mean;

        const nullMean = 1 / nullP;
        const standardError = Math.sqrt(nullMean * nullMean / n);
        const testStatistic = (sampleMean - nullMean) / standardError;

        let pValue;
        if (alternative === 'two-sided') {
            pValue = 2 * (1 - StatisticalDistributions.normalCDF(Math.abs(testStatistic)));
        } else if (alternative === 'greater') {
            pValue = 1 - StatisticalDistributions.normalCDF(testStatistic);
        } else {
            pValue = StatisticalDistributions.normalCDF(testStatistic);
        }

        return {
            testType: 'Geometric Probability Test',
            nullHypothesis: `p = ${nullP}`,
            alternative,
            testStatistic,
            pValue,
            observedP,
            sampleMean,
            reject: pValue < alpha,
            conclusion: pValue < alpha ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
        };
    }

    performUniformHypothesisTest(testConfig) {
        const { nullMin, nullMax, testParameter = 'bounds', alternative = 'two-sided', alpha = 0.05 } = testConfig;
        const [observedMin, observedMax] = this.distributionParams;
        const n = this.statistics.n;

        return {
            testType: 'Uniform Bounds Test',
            nullHypothesis: `min = ${nullMin}, max = ${nullMax}`,
            alternative,
            observedMin,
            observedMax,
            reject: false, // Placeholder
            conclusion: 'Uniform hypothesis testing not fully implemented'
        };
    }

// Detailed Calculation Walkthroughs
    generateDistributionCalculationWalkthrough() {
        switch(this.selectedDistribution) {
            case 'normal':
                return this.generateNormalCalculationWalkthrough();
            case 't':
                return this.generateTCalculationWalkthrough();
            case 'exponential':
                return this.generateExponentialCalculationWalkthrough();
            case 'gamma':
                return this.generateGammaCalculationWalkthrough();
            case 'beta':
                return this.generateBetaCalculationWalkthrough();
            case 'chisquare':
                return this.generateChiSquareCalculationWalkthrough();
            case 'f':
                return this.generateFCalculationWalkthrough();
            case 'binomial':
                return this.generateBinomialCalculationWalkthrough();
            case 'bernoulli':
                return this.generateBernoulliCalculationWalkthrough();
            case 'poisson':
                return this.generatePoissonCalculationWalkthrough();
            case 'geometric':
                return this.generateGeometricCalculationWalkthrough();
            case 'uniform':
                return this.generateUniformCalculationWalkthrough();
            default:
                return this.generateGenericCalculationWalkthrough();
        }
    }

    generateNormalCalculationWalkthrough() {
        const [mean, std] = this.distributionParams;
        const n = this.statistics.n;

        return {
            parameterEstimation: {
                title: "Maximum Likelihood Estimation for Normal Distribution",
                steps: [
                    {
                        step: "Step 1: Sample Mean",
                        formula: "x̄ = (1/n) × Σxᵢ",
                        explanation: `x̄ = (1/${n}) × ${this.statistics.sum.toFixed(3)} = ${mean.toFixed(4)}`
                    },
                    {
                        step: "Step 2: Sample Standard Deviation",
                        formula: "s = √[(1/(n-1)) × Σ(xᵢ - x̄)²]",
                        explanation: `s = √[(1/${n-1}) × ${((n-1) * this.statistics.variance).toFixed(3)}] = ${std.toFixed(4)}`
                    },
                    {
                        step: "Step 3: MLE Properties",
                        formula: "μ̂ = x̄, σ̂ = s",
                        explanation: "Sample mean and standard deviation are unbiased estimators"
                    }
                ],
                result: `Normal(μ = ${mean.toFixed(4)}, σ = ${std.toFixed(4)})`
            },
            standardization: {
                title: "Standardization Process",
                formula: "Z = (X - μ)/σ ~ N(0,1)",
                explanation: `Any value x can be standardized: z = (x - ${mean.toFixed(4)})/${std.toFixed(4)}`
            },
            confidenceInterval: {
                title: "Confidence Interval for Mean",
                formula: `x̄ ± t_{α/2,${n-1}} × (s/√n)`,
                calculation: this.calculateMeanConfidenceInterval(0.95)
            }
        };
    }

    generateTCalculationWalkthrough() {
        const df = this.distributionParams[0];

        return {
            parameterEstimation: {
                title: "T-Distribution Parameter Estimation",
                steps: [
                    {
                        step: "Step 1: Degrees of Freedom",
                        formula: "df = n - 1 (for one-sample case)",
                        explanation: `df = ${this.statistics.n} - 1 = ${df}`
                    },
                    {
                        step: "Step 2: Distribution Properties",
                        formula: "E[T] = 0 (for df > 1), Var[T] = df/(df-2) (for df > 2)",
                        explanation: df > 2 ? `Variance = ${df}/(${df}-2) = ${(df/(df-2)).toFixed(4)}` : "Variance undefined for df ≤ 2"
                    }
                ],
                result: `t-distribution with df = ${df}`
            },
            comparison: {
                title: "Comparison with Standard Normal",
                explanation: df > 30 ? 
                    "With df > 30, t-distribution closely approximates standard normal" :
                    "With small df, t-distribution has heavier tails than normal"
            },
            criticalValues: this.calculateTCriticalValues(df)
        };
    }

    calculateTCriticalValues(df) {
        return {
            title: "Critical Values for Common Significance Levels",
            values: {
                '0.10': { 
                    oneTailed: StatisticalDistributions.tInverse(0.90, df).toFixed(4),
                    twoTailed: StatisticalDistributions.tInverse(0.95, df).toFixed(4)
                },
                '0.05': { 
                    oneTailed: StatisticalDistributions.tInverse(0.95, df).toFixed(4),
                    twoTailed: StatisticalDistributions.tInverse(0.975, df).toFixed(4)
                },
                '0.01': { 
                    oneTailed: StatisticalDistributions.tInverse(0.99, df).toFixed(4),
                    twoTailed: StatisticalDistributions.tInverse(0.995, df).toFixed(4)
                }
            }
        };
    }

    generateExponentialCalculationWalkthrough() {
        const lambda = this.distributionParams[0];
        const n = this.statistics.n;
        const sampleMean = this.statistics.mean;

        return {
            parameterEstimation: {
                title: "Maximum Likelihood Estimation for Exponential Distribution",
                steps: [
                    {
                        step: "Step 1: Likelihood Function",
                        formula: "L(λ) = λⁿ × exp(-λ × Σxᵢ)",
                        explanation: `For n = ${n} observations, the likelihood function depends on λ and the sum of observations.`
                    },
                    {
                        step: "Step 2: Log-Likelihood Function", 
                        formula: "ℓ(λ) = n×ln(λ) - λ×Σxᵢ",
                        explanation: `Taking natural log: ℓ(λ) = ${n}×ln(λ) - λ×${this.statistics.sum.toFixed(3)}`
                    },
                    {
                        step: "Step 3: Differentiate and Set to Zero",
                        formula: "dℓ/dλ = n/λ - Σxᵢ = 0",
                        explanation: `Setting derivative to zero: ${n}/λ - ${this.statistics.sum.toFixed(3)} = 0`
                    },
                    {
                        step: "Step 4: Solve for λ",
                        formula: "λ̂ = n/Σxᵢ = 1/x̄",
                        explanation: `λ̂ = ${n}/${this.statistics.sum.toFixed(3)} = 1/${sampleMean.toFixed(3)} = ${lambda.toFixed(4)}`
                    }
                ],
                result: `Maximum likelihood estimate: λ̂ = ${lambda.toFixed(4)} events per time unit`
            },
            confidenceInterval: this.generateExponentialCIWalkthrough(),
            interpretation: {
                rateParameter: `λ = ${lambda.toFixed(4)} represents the rate of occurrence`,
                meanTime: `Expected time between events = 1/λ = ${(1/lambda).toFixed(3)} time units`,
                probability: `P(X > t) = exp(-λt) = exp(-${lambda.toFixed(4)}×t)`
            }
        };
    }

    generateExponentialCIWalkthrough() {
        const lambda = this.distributionParams[0];
        const n = this.statistics.n;
        const alpha = 0.05; // 95% CI

        return {
            title: "95% Confidence Interval for Exponential Rate Parameter",
            steps: [
                {
                    step: "Step 1: Sampling Distribution",
                    explanation: `Under exponential distribution, 2nλX̄ ~ χ²(2n)`,
                    formula: `2 × ${n} × λ × ${this.statistics.mean.toFixed(3)} ~ χ²(${2*n})`
                },
                {
                    step: "Step 2: Chi-Square Critical Values",
                    explanation: `For 95% CI with df = ${2*n}:`,
                    formula: `χ²₀.₀₂₅,${2*n} and χ²₀.₉₇₅,${2*n}`
                },
                {
                    step: "Step 3: Confidence Interval Formula",
                    explanation: "Rearranging the inequality for λ:",
                    formula: `[χ²₀.₀₂₅/(2n×x̄), χ²₀.₉₇₅/(2n×x̄)]`
                },
                {
                    step: "Step 4: Calculate Bounds",
                    calculation: this.calculateExponentialCIBounds(alpha),
                    interpretation: "We are 95% confident the true rate parameter lies in this interval"
                }
            ]
        };
    }

    calculateExponentialCIBounds(alpha) {
        const n = this.statistics.n;
        const mean = this.statistics.mean;

        const chiLower = StatisticalDistributions.chiSquareInverse(alpha/2, 2*n);
        const chiUpper = StatisticalDistributions.chiSquareInverse(1 - alpha/2, 2*n);

        const lowerBound = chiLower / (2 * n * mean);
        const upperBound = chiUpper / (2 * n * mean);

        return {
            lowerBound: lowerBound.toFixed(6),
            upperBound: upperBound.toFixed(6),
            interpretation: `95% CI for rate parameter: [${lowerBound.toFixed(6)}, ${upperBound.toFixed(6)}]`
        };
    }

    generateGammaCalculationWalkthrough() {
        const [shape, scale] = this.distributionParams;
        const n = this.statistics.n;
        const mean = this.statistics.mean;
        const variance = this.statistics.variance;

        return {
            parameterEstimation: {
                title: "Method of Moments Estimation for Gamma Distribution",
                steps: [
                    {
                        step: "Step 1: Calculate Sample Moments",
                        formula: "x̄ = Σxᵢ/n, s² = Σ(xᵢ - x̄)²/n",
                        explanation: `Mean = ${mean.toFixed(4)}, Variance = ${variance.toFixed(4)}`
                    },
                    {
                        step: "Step 2: Estimate Shape and Scale",
                        formula: "α̂ = x̄² / s², β̂ = s² / x̄",
                        explanation: `Shape α = (${mean.toFixed(4)}²) / ${variance.toFixed(4)} = ${shape.toFixed(4)}, Scale β = ${variance.toFixed(4)} / ${mean.toFixed(4)} = ${scale.toFixed(4)}`
                    }
                ],
                result: `Gamma(α = ${shape.toFixed(4)}, β = ${scale.toFixed(4)})`
            },
            interpretation: {
                expectedValue: `E[X] = αβ = ${ (shape * scale).toFixed(4) }`,
                variance: `Var[X] = αβ² = ${ (shape * scale * scale).toFixed(4) }`,
                skewness: `Skewness = 2/√α = ${ (2 / Math.sqrt(shape)).toFixed(4) }`
            }
        };
    }

    generateBetaCalculationWalkthrough() {
        const [alpha, beta] = this.distributionParams;
        const n = this.statistics.n;

        return {
            parameterEstimation: {
                title: "Method of Moments for Beta Distribution",
                steps: [
                    {
                        step: "Step 1: Sample Mean and Variance",
                        formula: "x̄ = sample mean, s² = sample variance",
                        explanation: `x̄ = ${this.statistics.mean.toFixed(4)}, s² = ${this.statistics.variance.toFixed(6)}`
                    },
                    {
                        step: "Step 2: Method of Moments Equations",
                        formula: "μ = α/(α+β), σ² = αβ/[(α+β)²(α+β+1)]",
                        explanation: "Solve for α and β using sample moments"
                    },
                    {
                        step: "Step 3: Parameter Solutions",
                        formula: "α = μ × [μ(1-μ)/σ² - 1], β = (1-μ) × [μ(1-μ)/σ² - 1]",
                        explanation: `α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)}`
                    }
                ],
                result: `Beta(α = ${alpha.toFixed(4)}, β = ${beta.toFixed(4)})`
            },
            properties: {
                title: "Distribution Properties",
                mean: alpha / (alpha + beta),
                variance: (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1)),
                mode: alpha > 1 && beta > 1 ? (alpha - 1)/(alpha + beta - 2) : 'Undefined',
                shape: this.describeBetaShape(alpha, beta)
            }
        };
    }

    generateChiSquareCalculationWalkthrough() {
        const df = this.distributionParams[0];
        const mean = this.statistics.mean;

        return {
            parameterEstimation: {
                title: "Estimation for Chi-Square Distribution",
                steps: [
                    {
                        step: "Step 1: Use Sample Mean",
                        formula: "df ≈ mean (since E[χ²] = df)",
                        explanation: `df ≈ ${mean.toFixed(4)}`
                    },
                    {
                        step: "Step 2: Round to Integer",
                        explanation: `Estimated df = ${df}`
                    }
                ],
                result: `Chi-Square(df = ${df})`
            },
            interpretation: {
                expectedValue: `E[X] = df = ${df}`,
                variance: `Var[X] = 2df = ${2 * df}`,
                skewness: `Skewness = √(8/df) = ${Math.sqrt(8 / df).toFixed(4)}`
            }
        };
    }

    generateFCalculationWalkthrough() {
        const [df1, df2] = this.distributionParams;

        return {
            parameterEstimation: {
                title: "F-Distribution Parameter Estimation",
                steps: [
                    {
                        step: "Note: df1 and df2 typically from study design",
                        explanation: "Not estimated from data in this context"
                    }
                ],
                result: `F(df1 = ${df1}, df2 = ${df2})`
            },
            interpretation: {
                expectedValue: df2 > 2 ? `E[X] = df2/(df2-2) = ${(df2 / (df2 - 2)).toFixed(4)}` : 'Undefined',
                variance: df2 > 4 ? `Var[X] = 2*df2²*(df1+df2-2)/(df1*(df2-2)²*(df2-4))` : 'Undefined'
            }
        };
    }

    generateGenericCalculationWalkthrough() {
        return {
            parameterEstimation: {
                title: "Generic Estimation",
                steps: [
                    {
                        step: "Step 1: Use distribution-specific estimator",
                        explanation: "See code for details"
                    }
                ],
                result: `${this.selectedDistribution} with params ${this.distributionParams.join(', ')}`
            }
        };
    }

    generateBinomialCalculationWalkthrough() {
        return this.generateGenericCalculationWalkthrough();
    }

    generateBernoulliCalculationWalkthrough() {
        return this.generateGenericCalculationWalkthrough();
    }

    generatePoissonCalculationWalkthrough() {
        return this.generateGenericCalculationWalkthrough();
    }

    generateGeometricCalculationWalkthrough() {
        return this.generateGenericCalculationWalkthrough();
    }

    generateUniformCalculationWalkthrough() {
        return this.generateGenericCalculationWalkthrough();
    }

    // Enhanced Workbook Template Generation
    generateWorkbook() {
        const data = [];

        data.push(...this.generateHeaderSection());
        data.push(...this.generateSampleDataSection());
        data.push(...this.generateBasicStatisticsSection());
        data.push(...this.generateParameterEstimationSection());
        data.push(...this.generateParameterConfidenceIntervalsSection());
        data.push(...this.generateDistributionAnalysisSection());

        if (this.targetAnalysis && Object.keys(this.targetAnalysis).length > 0) {
            data.push(...this.generateDistributionTargetAnalysisSection());
        }

        if (this.hypothesisTests && Object.keys(this.hypothesisTests).length > 0) {
            data.push(...this.generateHypothesisTestsSection());
        }

        data.push(...this.generateGoodnessOfFitSection());
        data.push(...this.generateDistributionCalculationWalkthroughSection());
        data.push(...this.generateConfidenceIntervalsSection());
        if (Object.keys(this.comparisonResults).length > 0) {
            data.push(...this.generateComparisonSection());
        }
        data.push(...this.generatePracticalRecommendationsSection());

        this.currentWorkbook = data;
    }

    generateDistributionSpecificTemplate() {
        return this.generateWorkbook(); // Alias
    }

    generateParameterEstimationSection() {
        const data = [];
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: `${dist.name.toUpperCase()} PARAMETER ESTIMATION`, type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        // Parameter estimates with interpretations
        dist.params.forEach((param, index) => {
            const paramValue = this.distributionParams[index];
            const paramName = dist.paramNames[index];
            const interpretation = this.getParameterInterpretation(param, paramValue);

            data.push([
                { value: `${paramName}:`, type: 'label' },
                { value: paramValue.toFixed(4), type: 'result' },
                { value: interpretation, type: 'data' },
                { value: '', type: 'data' }
            ]);
        });

        // Add distribution properties
        const properties = this.calculateDistributionProperties();
        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'DISTRIBUTION PROPERTIES', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' }
        ]);

        Object.entries(properties).forEach(([property, value]) => {
            data.push([
                { value: `${property}:`, type: 'label' },
                { value: value.value, type: 'result' },
                { value: value.interpretation || '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        });

        return data;
    }

    generateParameterConfidenceIntervalsSection() {
        if (!this.parameterConfidenceIntervals) return [];

        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'PARAMETER CONFIDENCE INTERVALS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        Object.entries(this.parameterConfidenceIntervals).forEach(([level, intervals]) => {
            const percentage = Math.round(level * 100);

            data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
            data.push([
                { value: `${percentage}% CONFIDENCE INTERVALS`, type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            Object.entries(intervals.parameters).forEach(([paramName, paramCI]) => {
                data.push([
                    { value: `${paramName}:`, type: 'label' },
                    { value: `[${paramCI.lowerBound.toFixed(4)}, ${paramCI.upperBound.toFixed(4)}]`, type: 'result' },
                    { value: paramCI.interpretation || '', type: 'data' },
                    { value: '', type: 'data' }
                ]);
            });
        });

        return data;
    }

    getParameterInterpretation(paramName, paramValue) {
        switch(this.selectedDistribution) {
            case 'normal':
                if (paramName === 'mean') return `Location parameter: ${paramValue.toFixed(4)} ${this.unitName}`;
                if (paramName === 'std') return `Scale parameter: ${paramValue.toFixed(4)} ${this.unitName}`;
                break;
            case 't':
                return `Degrees of freedom: ${paramValue.toFixed(0)}, controls tail behavior`;
            case 'exponential':
                return `Rate: ${paramValue.toFixed(4)} events per time unit`;
            case 'gamma':
                if (paramName === 'shape') {
                    return paramValue > 1 ? 'Distribution is right-skewed' : 'Distribution is highly right-skewed';
                } else {
                    return `Scale stretches distribution by factor ${paramValue.toFixed(2)}`;
                }
            case 'beta':
                if (paramName === 'alpha') {
                    return paramValue > 1 ? 'Favors higher values' : 'Favors lower values';
                } else {
                    return paramValue > 1 ? 'Favors lower values' : 'Favors higher values';
                }
            case 'chisquare':
                return `Degrees of freedom: ${paramValue.toFixed(0)}, determines shape and spread`;
            case 'f':
                if (paramName === 'df1') return `Numerator df: ${paramValue.toFixed(0)}`;
                if (paramName === 'df2') return `Denominator df: ${paramValue.toFixed(0)}`;
                break;
            default:
                return `Parameter value: ${paramValue.toFixed(4)}`;
        }
    }

    calculateDistributionProperties() {
        switch(this.selectedDistribution) {
            case 'normal':
                const [mean, std] = this.distributionParams;
                return {
                    'Expected Value': { value: `${mean.toFixed(4)} ${this.unitName}`, interpretation: 'Center of distribution' },
                    'Standard Deviation': { value: `${std.toFixed(4)} ${this.unitName}`, interpretation: 'Measure of spread' },
                    'Variance': { value: `${(std*std).toFixed(4)} ${this.unitName}²`, interpretation: 'Squared standard deviation' },
                    'Skewness': { value: '0.000', interpretation: 'Perfectly symmetric' },
                    'Kurtosis': { value: '3.000', interpretation: 'Mesokurtic (normal tail behavior)' }
                };
            case 't':
                const df = this.distributionParams[0];
                return {
                    'Degrees of Freedom': { value: df.toString(), interpretation: 'Parameter controlling tail behavior' },
                    'Expected Value': { value: '0.000', interpretation: 'Center at zero' },
                    'Variance': { value: df > 2 ? (df/(df-2)).toFixed(4) : 'Undefined', interpretation: df > 2 ? 'Decreases as df increases' : 'Undefined for df ≤ 2' },
                    'Skewness': { value: '0.000', interpretation: 'Symmetric distribution' },
                    'Tail Behavior': { value: df > 30 ? 'Normal-like' : 'Heavy tails', interpretation: 'Approaches normal as df → ∞' }
                };
            case 'exponential':
                const lambda = this.distributionParams[0];
                return {
                    'Expected Value': { value: `${(1/lambda).toFixed(4)} ${this.unitName}`, interpretation: 'Mean time between events' },
                    'Variance': { value: `${(1/(lambda*lambda)).toFixed(4)} ${this.unitName}²`, interpretation: 'Variability in timing' },
                    'Standard Deviation': { value: `${(1/lambda).toFixed(4)} ${this.unitName}`, interpretation: 'Same as expected value' },
                    'Median': { value: `${(Math.log(2)/lambda).toFixed(4)} ${this.unitName}`, interpretation: '50th percentile' },
                    'Mode': { value: `0 ${this.unitName}`, interpretation: 'Most likely value' },
                    'Skewness': { value: '2.000', interpretation: 'Highly right-skewed' },
                    'Kurtosis': { value: '9.000', interpretation: 'Heavy right tail' }
                };
            case 'gamma':
                const [shape, scale] = this.distributionParams;
                const meanG = shape * scale;
                const varianceG = shape * scale * scale;
                const skewnessG = 2 / Math.sqrt(shape);
                const kurtosisG = 3 + 6/shape;
                const modeG = shape > 1 ? (shape - 1) * scale : 0;

                return {
                    'Expected Value': { value: `${meanG.toFixed(4)} ${this.unitName}`, interpretation: 'Average value' },
                    'Variance': { value: `${varianceG.toFixed(4)} ${this.unitName}²`, interpretation: 'Spread increases with both parameters' },
                    'Standard Deviation': { value: `${Math.sqrt(varianceG).toFixed(4)} ${this.unitName}`, interpretation: 'Square root of variance' },
                    'Mode': { value: shape > 1 ? `${modeG.toFixed(4)} ${this.unitName}` : `0 ${this.unitName}`, interpretation: shape > 1 ? 'Most likely value' : 'Distribution starts at zero' },
                    'Median': { value: 'No closed form', interpretation: 'Approximately ' + (meanG * 0.9).toFixed(2) + ' ' + this.unitName },
                    'Skewness': { value: skewnessG.toFixed(4), interpretation: skewnessG > 1 ? 'Highly right-skewed' : 'Moderately right-skewed' },
                    'Kurtosis': { value: kurtosisG.toFixed(4), interpretation: 'Tail heaviness depends on shape parameter' }
                };

            case 'beta':
                const [alphaB, betaB] = this.distributionParams;
                const meanB = alphaB / (alphaB + betaB);
                const varianceB = (alphaB * betaB) / (Math.pow(alphaB + betaB, 2) * (alphaB + betaB + 1));
                const modeB = (alphaB > 1 && betaB > 1) ? (alphaB - 1) / (alphaB + betaB - 2) : null;
                const skewnessB = (2 * (betaB - alphaB) * Math.sqrt(alphaB + betaB + 1)) / ((alphaB + betaB + 2) * Math.sqrt(alphaB * betaB));

                return {
                    'Expected Value': { value: meanB.toFixed(4), interpretation: 'Mean proportion/probability' },
                    'Variance': { value: varianceB.toFixed(6), interpretation: 'Variability in proportion' },
                    'Standard Deviation': { value: Math.sqrt(varianceB).toFixed(4), interpretation: 'Standard error of proportion' },
                    'Mode': { value: modeB ? modeB.toFixed(4) : 'N/A', interpretation: modeB ? 'Most likely proportion' : 'No unique mode (uniform or U-shaped)' },
                    'Median': { value: 'No closed form', interpretation: 'Approximately ' + meanB.toFixed(3) },
                    'Skewness': { value: skewnessB.toFixed(4), interpretation: this.interpretBetaSkewness(skewnessB) },
                    'Shape': { value: this.describeBetaShape(alphaB, betaB), interpretation: 'Overall distribution shape' }
                };

            case 'chisquare':
                const dfChi = this.distributionParams[0];
                const meanChi = dfChi;
                const varianceChi = 2 * dfChi;
                const skewnessChi = Math.sqrt(8 / dfChi);
                const kurtosisChi = 3 + 12 / dfChi;

                return {
                    'Expected Value': { value: `${meanChi.toFixed(4)} ${this.unitName}`, interpretation: 'Mean equals degrees of freedom' },
                    'Variance': { value: `${varianceChi.toFixed(4)} ${this.unitName}²`, interpretation: 'Variance is twice the degrees of freedom' },
                    'Standard Deviation': { value: `${Math.sqrt(varianceChi).toFixed(4)} ${this.unitName}`, interpretation: 'Square root of 2df' },
                    'Mode': { value: dfChi > 2 ? `${(dfChi - 2).toFixed(4)} ${this.unitName}` : `0 ${this.unitName}`, interpretation: dfChi > 2 ? 'Peak of distribution' : 'Mode at zero' },
                    'Skewness': { value: skewnessChi.toFixed(4), interpretation: dfChi > 10 ? 'Moderately right-skewed' : 'Highly right-skewed' },
                    'Kurtosis': { value: kurtosisChi.toFixed(4), interpretation: 'Approaches normal as df increases' }
                };

            case 'f':
                const [df1F, df2F] = this.distributionParams;
                const meanF = df2F > 2 ? df2F / (df2F - 2) : 'Undefined';
                const varianceF = df2F > 4 ? (2 * df2F * df2F * (df1F + df2F - 2)) / (df1F * (df2F - 2) * (df2F - 2) * (df2F - 4)) : 'Undefined';
                const modeF = df1F > 2 ? ((df1F - 2) / df1F) * (df2F / (df2F + 2)) : 0;

                return {
                    'Expected Value': { value: typeof meanF === 'number' ? `${meanF.toFixed(4)} ${this.unitName}` : meanF, interpretation: 'Mean exists only for df2 > 2' },
                    'Variance': { value: typeof varianceF === 'number' ? `${varianceF.toFixed(4)} ${this.unitName}²` : varianceF, interpretation: 'Variance exists only for df2 > 4' },
                    'Mode': { value: `${modeF.toFixed(4)} ${this.unitName}`, interpretation: 'Most likely F-statistic value' },
                    'Numerator DF': { value: df1F.toString(), interpretation: 'Degrees of freedom in numerator' },
                    'Denominator DF': { value: df2F.toString(), interpretation: 'Degrees of freedom in denominator' },
                    'Shape': { value: df1F > 5 && df2F > 5 ? 'Bell-shaped' : 'Right-skewed', interpretation: 'Shape depends on both df parameters' }
                };

            default:
                return {
                    'Distribution': { value: this.selectedDistribution, interpretation: 'Selected distribution type' },
                    'Parameters': { value: this.distributionParams.join(', '), interpretation: 'Estimated parameter values' }
                };
        }
    }

    describeBetaShape(alpha, beta) {
        if (alpha < 1 && beta < 1) return 'U-shaped';
        if (alpha === 1 && beta === 1) return 'Uniform';
        if (alpha > 1 && beta > 1) return 'Bell-shaped';
        if (alpha < 1 || beta < 1) return 'J-shaped';
        return 'Unimodal';
    }

    interpretBetaSkewness(skewness) {
        if (Math.abs(skewness) < 0.5) return 'Nearly symmetric';
        if (skewness > 0) return 'Right-skewed (favors lower values)';
        return 'Left-skewed (favors higher values)';
    }

    generateHeaderSection() {
        const data = [];

        data.push([
            { value: 'ENHANCED STATISTICAL DISTRIBUTION ANALYSIS WORKBOOK', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' }
        ]);

        data.push([
            { value: `Analysis Date: ${new Date().toLocaleDateString()}`, type: 'data' },
            { value: `Distribution: ${DistributionRegistry.getDistribution(this.selectedDistribution).name}`, type: 'data' },
            { value: `Sample Size: ${this.statistics.n}`, type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([
            { value: `Sample Name: ${this.sampleName}`, type: 'data' },
            { value: `Variable: ${this.variableName}`, type: 'data' },
            { value: `Units: ${this.unitName}`, type: 'data' },
            { value: '', type: 'data' }
        ]);

        if (this.scenarioDescription) {
            data.push([
                { value: `Description: ${this.scenarioDescription}`, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        return data;
    }

    generateSampleDataSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'SAMPLE DATA (First 20 values)', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        const displayData = this.rawSamples.slice(0, 20);
        for (let i = 0; i < displayData.length; i += 4) {
            const row = [];
            for (let j = 0; j < 4; j++) {
                if (i + j < displayData.length) {
                    row.push({ value: displayData[i + j].toFixed(4), type: 'data' });
                } else {
                    row.push({ value: '', type: 'data' });
                }
            }
            data.push(row);
        }

        if (this.rawSamples.length > 20) {
            data.push([
                { value: `... and ${this.rawSamples.length - 20} more values`, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        return data;
    }

    generateBasicStatisticsSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'DESCRIPTIVE STATISTICS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        const stats = [
            ['Sample Size (n):', this.statistics.n, ''],
            ['Mean:', this.statistics.mean.toFixed(4), this.unitName],
            ['Median:', this.statistics.median.toFixed(4), this.unitName],
            ['Standard Deviation:', this.statistics.standardDeviation.toFixed(4), this.unitName],
            ['Variance:', this.statistics.variance.toFixed(4), this.unitName + '²'],
            ['Minimum:', this.statistics.min.toFixed(4), this.unitName],
            ['Maximum:', this.statistics.max.toFixed(4), this.unitName],
            ['Range:', this.statistics.range.toFixed(4), this.unitName],
            ['Q1 (25th percentile):', this.statistics.q1.toFixed(4), this.unitName],
            ['Q3 (75th percentile):', this.statistics.q3.toFixed(4), this.unitName],
            ['IQR:', this.statistics.iqr.toFixed(4), this.unitName],
            ['Skewness:', this.statistics.skewness.toFixed(4), ''],
            ['Kurtosis:', this.statistics.kurtosis.toFixed(4), '']
        ];

        stats.forEach(([label, value, unit]) => {
            data.push([
                { value: label, type: 'label' },
                { value: value.toString(), type: 'result' },
                { value: unit, type: 'data' },
                { value: '', type: 'data' }
            ]);
        });

        return data;
    }

    generateDistributionAnalysisSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'DISTRIBUTION ANALYSIS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        data.push([
            { value: 'Distribution:', type: 'label' },
            { value: this.distributionAnalysis.distribution, type: 'result' },
            { value: DistributionRegistry.getDistribution(this.selectedDistribution).name, type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([
            { value: 'Log-Likelihood:', type: 'label' },
            { value: this.distributionAnalysis.logLikelihood.toFixed(4), type: 'result' },
            { value: 'Model fit measure', type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([
            { value: 'AIC:', type: 'label' },
            { value: this.distributionAnalysis.aic.toFixed(4), type: 'result' },
            { value: 'Lower is better', type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([
            { value: 'BIC:', type: 'label' },
            { value: this.distributionAnalysis.bic.toFixed(4), type: 'result' },
            { value: 'Lower is better', type: 'data' },
            { value: '', type: 'data' }
        ]);

        return data;
    }

    generateGoodnessOfFitSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'GOODNESS OF FIT TESTS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        // Kolmogorov-Smirnov Test
        if (this.goodnessOfFit.kolmogorovSmirnov) {
            const ks = this.goodnessOfFit.kolmogorovSmirnov;
            data.push([
                { value: 'KOLMOGOROV-SMIRNOV TEST', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            data.push([
                { value: 'Test Statistic:', type: 'label' },
                { value: ks.testStatistic.toFixed(6), type: 'result' },
                { value: 'Maximum difference between CDFs', type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'P-Value:', type: 'label' },
                { value: ks.pValue.toFixed(6), type: 'result' },
                { value: ks.pValue < 0.05 ? 'Reject H0 (poor fit)' : 'Fail to reject H0 (good fit)', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        // Chi-square test
        if (this.goodnessOfFit.chisquareTest) {
            const chi = this.goodnessOfFit.chisquareTest;
            data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
            data.push([
                { value: 'CHI-SQUARE GOODNESS OF FIT', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            data.push([
                { value: 'Test Statistic:', type: 'label' },
                { value: chi.testStatistic.toFixed(4), type: 'result' },
                { value: `df = ${chi.degreesOfFreedom}`, type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'P-Value:', type: 'label' },
                { value: chi.pValue.toFixed(6), type: 'result' },
                { value: chi.pValue < 0.05 ? 'Reject H0 (poor fit)' : 'Fail to reject H0 (good fit)', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        // Shapiro-Wilk test
        if (this.goodnessOfFit.shapiroWilk) {
            const sw = this.goodnessOfFit.shapiroWilk;
            data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
            data.push([
                { value: 'SHAPIRO-WILK TEST (FOR NORMALITY)', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            data.push([
                { value: 'Test Statistic (W):', type: 'label' },
                { value: sw.testStatistic.toFixed(4), type: 'result' },
                { value: 'Closer to 1 indicates normality', type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'P-Value:', type: 'label' },
                { value: sw.pValue.toFixed(6), type: 'result' },
                { value: sw.pValue < 0.05 ? 'Reject H0 (not normal)' : 'Fail to reject H0 (consistent with normal)', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        return data;
    }

    generatePracticalRecommendationsSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'PRACTICAL RECOMMENDATIONS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        const recommendations = this.generatePracticalRecommendations();

        recommendations.forEach((rec, index) => {
            data.push([
                { value: `${index + 1}. ${rec}`, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        });

        return data;
    }

    generatePracticalRecommendations() {
        const recommendations = [];
        const dist = DistributionRegistry.getDistribution(this.selectedDistribution);

        // Distribution-specific recommendations
        switch(this.selectedDistribution) {
            case 'normal':
                recommendations.push("The normal distribution is appropriate for continuous data with symmetric, bell-shaped patterns.");
                recommendations.push("Use for measurement errors, natural phenomena following the Central Limit Theorem.");
                if (Math.abs(this.statistics.skewness) > 0.5) {
                    recommendations.push("Warning: Data shows significant skewness. Consider data transformation or alternative distributions.");
                }
                break;
            case 't':
                recommendations.push("T-distribution is appropriate for small sample hypothesis testing.");
                const df = this.distributionParams[0];
                if (df > 30) {
                    recommendations.push("With df > 30, results are very similar to normal distribution.");
                } else {
                    recommendations.push("Heavy tails account for additional uncertainty with small samples.");
                }
                recommendations.push("Use for confidence intervals when population variance is unknown.");
                break;
            case 'exponential':
                recommendations.push("Exponential distribution is ideal for modeling time between events in Poisson processes.");
                recommendations.push(`Expected wait time: ${(1/this.distributionParams[0]).toFixed(2)} ${this.unitName}`);
                recommendations.push("Use for reliability analysis, survival times, or queueing systems.");
                recommendations.push("Memoryless property: P(X > s+t | X > s) = P(X > t)");
                break;
            case 'gamma':
                recommendations.push("Gamma distribution models waiting times for multiple events.");
                const [shape] = this.distributionParams;
                if (shape < 1) {
                    recommendations.push("Shape < 1 indicates decreasing hazard rate over time.");
                } else if (shape > 1) {
                    recommendations.push("Shape > 1 indicates increasing hazard rate over time.");
                } else {
                    recommendations.push("Shape = 1 reduces to exponential distribution.");
                }
                recommendations.push("Use for modeling aggregate waiting times or continuous positive-valued data.");
                break;
            case 'beta':
                recommendations.push("Beta distribution is ideal for modeling proportions, percentages, or probabilities.");
                recommendations.push("Bounded between 0 and 1, making it perfect for rates and proportions.");
                const [alpha, beta] = this.distributionParams;
                if (alpha < 1 && beta < 1) {
                    recommendations.push("U-shaped: data concentrates at extremes (0 and 1).");
                } else if (alpha === 1 && beta === 1) {
                    recommendations.push("Uniform: all values between 0 and 1 equally likely.");
                } else if (alpha > 1 && beta > 1) {
                    recommendations.push("Bell-shaped: data concentrates around the mean.");
                }
                break;
            case 'chisquare':
                recommendations.push("Chi-square distribution is used for goodness-of-fit tests and variance testing.");
                const dfChi = this.distributionParams[0];
                recommendations.push(`With ${dfChi} degrees of freedom, mean = ${dfChi}, variance = ${2*dfChi}.`);
                if (dfChi > 30) {
                    recommendations.push("Large df: distribution approaches normal shape.");
                } else {
                    recommendations.push("Small df: highly right-skewed distribution.");
                }
                recommendations.push("Use for testing independence in contingency tables or variance tests.");
                break;
            case 'f':
                const [df1, df2] = this.distributionParams;
                recommendations.push("F-distribution is used for comparing variances and ANOVA.");
                recommendations.push(`Numerator df = ${df1}, Denominator df = ${df2}`);
                recommendations.push("Use for testing equality of variances between groups.");
                if (df1 > 5 && df2 > 5) {
                    recommendations.push("Both df > 5: distribution is approximately bell-shaped.");
                } else {
                    recommendations.push("Small df values: distribution is right-skewed.");
                }
                recommendations.push("Critical for ANOVA F-tests and regression analysis.");
                break;
            case 'binomial':
                recommendations.push("Binomial distribution models number of successes in fixed trials.");
                break;
            case 'bernoulli':
                recommendations.push("Bernoulli distribution models single trial success/failure.");
                break;
            case 'poisson':
                recommendations.push("Poisson distribution models count of rare events.");
                break;
            case 'geometric':
                recommendations.push("Geometric distribution models trials until first success.");
                break;
            case 'uniform':
                recommendations.push("Uniform distribution models equal probability over interval.");
                break;
            default:
                recommendations.push(`${dist.name} distribution analysis completed.`);
                recommendations.push("Refer to distribution-specific literature for detailed interpretation.");
        }

        // Goodness of fit recommendations
        const ksTest = this.goodnessOfFit.kolmogorovSmirnov;
        if (ksTest && ksTest.pValue < 0.05) {
            recommendations.push("Goodness of fit tests suggest the distribution may not be appropriate. Consider alternative distributions.");
        } else if (ksTest) {
            recommendations.push("Goodness of fit tests support the chosen distribution.");
        }

        // Sample size recommendations
        if (this.statistics.n < 30) {
            recommendations.push("Small sample size: Results should be interpreted cautiously. Consider collecting more data.");
        } else if (this.statistics.n > 100) {
            recommendations.push("Large sample size provides reliable parameter estimates and test results.");
        } else {
            recommendations.push("Adequate sample size for reliable estimates.");
        }

        // Distribution comparison recommendations
        if (Object.keys(this.comparisonResults).length > 0) {
            const bestFit = this.comparisonResults.bestFit;
            recommendations.push(`Among compared distributions, ${DistributionRegistry.getDistribution(bestFit).name} provides the best fit.`);
        }

        return recommendations;
    }

    generateHypothesisTestsSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'HYPOTHESIS TESTS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        Object.entries(this.hypothesisTests).forEach(([testName, test]) => {
            data.push([
                { value: test.testType.toUpperCase(), type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            data.push([
                { value: 'Null Hypothesis:', type: 'label' },
                { value: test.nullHypothesis, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'Test Statistic:', type: 'label' },
                { value: test.testStatistic.toFixed(4), type: 'result' },
                { value: test.method || '', type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'P-Value:', type: 'label' },
                { value: test.pValue.toFixed(6), type: 'result' },
                { value: test.reject ? 'Reject H₀' : 'Fail to reject H₀', type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'Conclusion:', type: 'label' },
                { value: test.conclusion, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);

            // Add additional test-specific information
            if (test.degreesOfFreedom !== undefined) {
                data.push([
                    { value: 'Degrees of Freedom:', type: 'label' },
                    { value: test.degreesOfFreedom.toString(), type: 'result' },
                    { value: '', type: 'data' },
                    { value: '', type: 'data' }
                ]);
            }

            if (test.confidenceInterval) {
                const ci = test.confidenceInterval;
                data.push([
                    { value: `${Math.round((1-0.05)*100)}% CI:`, type: 'label' },
                    { value: `[${ci.lowerBound.toFixed(4)}, ${ci.upperBound.toFixed(4)}]`, type: 'result' },
                    { value: '', type: 'data' },
                    { value: '', type: 'data' }
                ]);
            }

            // Add spacing between tests
            data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        });

        return data;
    }

    generateComparisonSection() {
        const data = [];

        if (Object.keys(this.comparisonResults).length === 0) return data;

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'DISTRIBUTION COMPARISON', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        // Summary
        data.push([
            { value: 'Best Fit Distribution:', type: 'label' },
            { value: DistributionRegistry.getDistribution(this.comparisonResults.bestFit).name, type: 'result' },
            { value: 'Based on AIC criteria', type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);

        // Comparison table header
        data.push([
            { value: 'Distribution', type: 'header' },
            { value: 'AIC', type: 'header' },
            { value: 'BIC', type: 'header' },
            { value: 'Rank', type: 'header' }
        ]);

        // Sort distributions by rank
        const sortedDistributions = Object.entries(this.comparisonResults.distributions)
            .sort((a, b) => a[1].rank - b[1].rank);

        sortedDistributions.forEach(([distName, result]) => {
            data.push([
                { value: result.name, type: 'data' },
                { value: result.aic.toFixed(2), type: 'result' },
                { value: result.bic.toFixed(2), type: 'result' },
                { value: result.rank.toString(), type: result.rank === 1 ? 'result' : 'data' }
            ]);
        });

        // Recommendations
        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'COMPARISON RECOMMENDATIONS', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' },
            { value: '', type: 'header' }
        ]);

        this.comparisonResults.summary.recommendations.forEach((rec, index) => {
            data.push([
                { value: `${index + 1}. ${rec}`, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        });

        return data;
    }

    generateDistributionTargetAnalysisSection() {
        if (!this.targetAnalysis || Object.keys(this.targetAnalysis).length === 0) return [];

        const data = [];
        const target = this.targetAnalysis;

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'TARGET VALUE ANALYSIS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        data.push([
            { value: 'Target Value:', type: 'label' },
            { value: target.targetValue.toString(), type: 'result' },
            { value: target.targetType || '', type: 'data' },
            { value: '', type: 'data' }
        ]);

        if (target.probabilities) {
            data.push([
                { value: 'P(X ≤ target):', type: 'label' },
                { value: target.probabilities.lessThan.toFixed(4), type: 'result' },
                { value: `${(target.probabilities.lessThan * 100).toFixed(2)}%`, type: 'data' },
                { value: '', type: 'data' }
            ]);

            data.push([
                { value: 'P(X > target):', type: 'label' },
                { value: target.probabilities.greaterThan.toFixed(4), type: 'result' },
                { value: `${(target.probabilities.greaterThan * 100).toFixed(2)}%`, type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        if (target.effectSize !== undefined) {
            data.push([
                { value: 'Effect Size:', type: 'label' },
                { value: target.effectSize.toFixed(4), type: 'result' },
                { value: target.practicalSignificance || '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        if (target.recommendation) {
            data.push([
                { value: 'Recommendation:', type: 'label' },
                { value: target.recommendation, type: 'data' },
                { value: '', type: 'data' },
                { value: '', type: 'data' }
            ]);
        }

        return data;
    }

    generateDistributionCalculationWalkthroughSection() {
        const data = [];
        const walkthrough = this.generateDistributionCalculationWalkthrough();

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'CALCULATION WALKTHROUGH', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        // Parameter Estimation Section
        if (walkthrough.parameterEstimation) {
            const paramEst = walkthrough.parameterEstimation;

            data.push([
                { value: paramEst.title.toUpperCase(), type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            if (paramEst.steps) {
                paramEst.steps.forEach((step, index) => {
                    data.push([
                        { value: step.step, type: 'label' },
                        { value: step.formula || '', type: 'formula' },
                        { value: '', type: 'data' },
                        { value: '', type: 'data' }
                    ]);

                    if (step.explanation) {
                        data.push([
                            { value: '', type: 'data' },
                            { value: step.explanation, type: 'data' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ]);
                    }

                    data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
                });
            }

            if (paramEst.result) {
                data.push([
                    { value: 'Result:', type: 'label' },
                    { value: paramEst.result, type: 'result' },
                    { value: '', type: 'data' },
                    { value: '', type: 'data' }
                ]);
            }
        }

        // Interpretation Section
        if (walkthrough.interpretation) {
            data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
            data.push([
                { value: 'INTERPRETATION', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' },
                { value: '', type: 'header' }
            ]);

            Object.entries(walkthrough.interpretation).forEach(([key, value]) => {
                data.push([
                    { value: `${key}:`, type: 'label' },
                    { value: value, type: 'data' },
                    { value: '', type: 'data' },
                    { value: '', type: 'data' }
                ]);
            });
        }

        return data;
    }

    generateConfidenceIntervalsSection() {
        const data = [];

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'DISTRIBUTION CONFIDENCE INTERVALS', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' },
            { value: '', type: 'section' }
        ]);

        // Add explanation
        data.push([
            { value: 'Confidence intervals for distribution values', type: 'data' },
            { value: '', type: 'data' },
            { value: '', type: 'data' },
            { value: '', type: 'data' }
        ]);

        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);

        Object.entries(this.confidenceIntervals).forEach(([level, ci]) => {
            const percentage = Math.round(level * 100);
            data.push([
                { value: `${percentage}% CI:`, type: 'label' },
                { value: `[${ci.lowerBound.toFixed(4)}, ${ci.upperBound.toFixed(4)}]`, type: 'result' },
                { value: `Width: ${ci.width.toFixed(4)}`, type: 'data' },
                { value: this.unitName, type: 'data' }
            ]);
        });

        // Add interpretation
        data.push([{ value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }, { value: '', type: 'data' }]);
        data.push([
            { value: 'Interpretation:', type: 'label' },
            { value: 'We can be X% confident that a new observation will fall within the given interval', type: 'data' },
            { value: '', type: 'data' },
            { value: '', type: 'data' }
        ]);

        return data;
    }
    // Export Methods
    async generateImage(filename = 'workbook.png') {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Render the workbook data to canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid and text based on this.currentWorkbook
        let y = 0;
        this.currentWorkbook.forEach(row => {
            let x = 0;
            row.forEach(cell => {
                // Draw cell background based on type
                switch (cell.type) {
                    case 'header':
                        ctx.fillStyle = this.colors.headerBg;
                        break;
                    case 'section':
                        ctx.fillStyle = this.colors.sectionBg;
                        break;
                    case 'result':
                        ctx.fillStyle = this.colors.resultBg;
                        break;
                    case 'formula':
                        ctx.fillStyle = this.colors.formulaBg;
                        break;
                    default:
                        ctx.fillStyle = this.colors.cellBg;
                }
                ctx.fillRect(x, y, this.cellWidth, this.cellHeight);

                // Draw text
                ctx.fillStyle = this.colors.cellText;
                ctx.font = `${this.fontSize}px Arial`;
                ctx.fillText(cell.value, x + 5, y + this.cellHeight / 2);

                x += this.cellWidth;
            });
            y += this.cellHeight;
        });

        // Save to file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filename, buffer);

        return filename;
    }

    async generateXLSX(filename = 'workbook.xlsx') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Analysis');

        // Add rows
        this.currentWorkbook.forEach((row, rowIndex) => {
            const excelRow = sheet.getRow(rowIndex + 1);
            row.forEach((cell, colIndex) => {
                const excelCell = excelRow.getCell(colIndex + 1);
                excelCell.value = cell.value;

                // Style based on type
                switch (cell.type) {
                    case 'header':
                        excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.headerBg.replace('#', '') } };
                        excelCell.font = { color: { argb: this.colors.headerText.replace('#', '') }, bold: true };
                        break;
                    case 'section':
                        excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.sectionBg.replace('#', '') } };
                        excelCell.font = { color: { argb: this.colors.sectionText.replace('#', '') }, bold: true };
                        break;
                    case 'result':
                        excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.resultBg.replace('#', '') } };
                        excelCell.font = { color: { argb: this.colors.resultText.replace('#', '') } };
                        break;
                    case 'formula':
                        excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.colors.formulaBg.replace('#', '') } };
                        excelCell.font = { color: { argb: this.colors.formulaText.replace('#', '') } };
                        break;
                    case 'label':
                        excelCell.font = { bold: true };
                        break;
                }

                excelCell.border = {
                    top: { style: 'thin', color: { argb: this.colors.borderColor.replace('#', '') } },
                    left: { style: 'thin', color: { argb: this.colors.borderColor.replace('#', '') } },
                    bottom: { style: 'thin', color: { argb: this.colors.borderColor.replace('#', '') } },
                    right: { style: 'thin', color: { argb: this.colors.borderColor.replace('#', '') } }
                };
            });
            excelRow.commit();
        });

        // Auto width columns
        sheet.columns.forEach(column => {
            column.width = 30; // Default width
        });

        await workbook.xlsx.writeFile(filename);
        return filename;
    }


}
