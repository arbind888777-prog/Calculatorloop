"use client"

import React, { useState, useEffect } from 'react';
import { Calculator, Activity, Sparkles, TrendingUp, PieChart, Zap, Copy, Check, BarChart3, Lightbulb, RefreshCw, Binary } from 'lucide-react';
import { FinancialCalculatorTemplate } from '@/components/calculators/templates/FinancialCalculatorTemplate';
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"
import { VoiceNumberButton } from "@/components/ui/VoiceNumberButton"

interface MathInput {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'slider';
  options?: string[];
  defaultValue?: number | string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

interface CalculationResult {
  result: string | number;
  explanation?: string;
  steps?: string[];
  tips?: string[];
  formula?: string;
  visualData?: Array<{ label: string; value: number }>;
}

interface MathToolConfig {
  title: string;
  description: string;
  inputs: MathInput[];
  calculate: (inputs: Record<string, any>) => CalculationResult;
  presetScenarios?: Array<{ name: string; icon?: string; values: Record<string, any> }>;
}

const safeFloat = (val: any) => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const safeInt = (val: any) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
};

const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b);

const parseVector = (value: string): number[] =>
  String(value ?? '')
    .split(',')
    .map(part => parseFloat(part.trim()))
    .filter(num => Number.isFinite(num));

const formatVector = (vector: number[]): string => `[${vector.map(v => Number(v.toFixed(4))).join(', ')}]`;

const dotProduct = (left: number[], right: number[]): number =>
  left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);

const vectorMagnitude = (vector: number[]): number => Math.sqrt(dotProduct(vector, vector));

const parseMatrix = (value: string): number[][] =>
  String(value ?? '')
    .split(';')
    .map(row => row.split(',').map(part => parseFloat(part.trim())).filter(num => Number.isFinite(num)))
    .filter(row => row.length > 0);

const formatMatrix = (matrix: number[][]): string =>
  matrix.map(row => `[${row.map(v => Number(v.toFixed(4))).join(', ')}]`).join(' ');

const sameDimensions = (left: number[], right: number[]) => left.length > 0 && left.length === right.length;

const determinant2x2 = (matrix: number[][]): number => matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

const determinant3x3 = (matrix: number[][]): number =>
  matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
  matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
  matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

const inverse2x2 = (matrix: number[][]): number[][] | null => {
  const det = determinant2x2(matrix);
  if (det === 0) return null;
  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det],
  ];
};

const matrixVectorMultiply = (matrix: number[][], vector: number[]): number[] =>
  matrix.map(row => row.reduce((sum, value, index) => sum + value * (vector[index] ?? 0), 0));

const matrixRank2x2 = (matrix: number[][]): number => {
  if (matrix.length !== 2 || matrix.some(row => row.length !== 2)) return 0;
  if (determinant2x2(matrix) !== 0) return 2;
  if (matrix.flat().some(value => value !== 0)) return 1;
  return 0;
};

const solve2x2System = (matrix: number[][], constants: number[]): number[] | null => {
  const det = determinant2x2(matrix);
  if (det === 0) return null;
  const detX = constants[0] * matrix[1][1] - matrix[0][1] * constants[1];
  const detY = matrix[0][0] * constants[1] - constants[0] * matrix[1][0];
  return [detX / det, detY / det];
};

const eigen2x2 = (matrix: number[][]): { values: number[]; vectors: number[][] } | null => {
  if (matrix.length !== 2 || matrix.some(row => row.length !== 2)) return null;
  const trace = matrix[0][0] + matrix[1][1];
  const det = determinant2x2(matrix);
  const discriminant = trace * trace - 4 * det;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const lambda1 = (trace + root) / 2;
  const lambda2 = (trace - root) / 2;
  const makeVector = (lambda: number) => {
    if (matrix[0][1] !== 0) return [1, (lambda - matrix[0][0]) / matrix[0][1]];
    if (matrix[1][0] !== 0) return [(lambda - matrix[1][1]) / matrix[1][0], 1];
    return [1, 0];
  };
  return { values: [lambda1, lambda2], vectors: [makeVector(lambda1), makeVector(lambda2)] };
};

const covariance2D = (points: number[][]): number[][] => {
  const meanX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const covXX = points.reduce((sum, point) => sum + (point[0] - meanX) ** 2, 0) / (points.length - 1 || 1);
  const covYY = points.reduce((sum, point) => sum + (point[1] - meanY) ** 2, 0) / (points.length - 1 || 1);
  const covXY = points.reduce((sum, point) => sum + (point[0] - meanX) * (point[1] - meanY), 0) / (points.length - 1 || 1);
  return [
    [covXX, covXY],
    [covXY, covYY],
  ];
};

const getToolConfig = (id: string | undefined): MathToolConfig => {
  if (!id) return {
    title: 'Calculator Not Found',
    description: 'This calculator configuration is missing.',
    inputs: [],
    calculate: () => ({ result: 'Error' })
  };
  
  // PERCENTAGE CALCULATOR
  if (id.includes('percentage') && !id.includes('ten-') && !id.includes('twenty-')) {
    return {
      title: 'Percentage Calculator',
      description: 'Calculate percentages, increases, decreases, and more.',
      presetScenarios: [
        { name: 'Discount', icon: '🏷️', values: { type: 'What is X% of Y?', val1: 20, val2: 1000 } },
        { name: 'Growth', icon: '📈', values: { type: 'Percentage Change', val1: 100, val2: 150 } },
        { name: 'Score', icon: '🎯', values: { type: 'X is what % of Y?', val1: 45, val2: 50 } },
      ],
      inputs: [
        { name: 'type', label: 'Calculation Type', type: 'select', options: ['What is X% of Y?', 'X is what % of Y?', 'Percentage Change'], defaultValue: 'What is X% of Y?' },
        { name: 'val1', label: 'Value 1', type: 'slider', defaultValue: 15, min: 0, max: 1000, step: 1, helpText: 'Enter the first value' },
        { name: 'val2', label: 'Value 2', type: 'slider', defaultValue: 200, min: 0, max: 1000, step: 1, helpText: 'Enter the second value' },
      ],
      calculate: (inputs) => {
        const type = inputs.type;
        const x = safeFloat(inputs.val1);
        const y = safeFloat(inputs.val2);
        let res = 0;
        let steps: string[] = [];
        let tips: string[] = [];

        if (type === 'What is X% of Y?') {
          res = (x / 100) * y;
          steps = [`Formula: (X / 100) × Y`, `Calculation: (${x} / 100) × ${y} = ${res}`];
          tips = [
            'Quick trick: To find 10%, just move decimal one place left!',
            `${x}% of ${y} equals ${res.toFixed(2)}`
          ];
          return { result: res.toFixed(2), explanation: `${x}% of ${y}`, steps, tips, formula: '(X ÷ 100) × Y' };
        } else if (type === 'X is what % of Y?') {
          if (y === 0) return { result: 'Error', explanation: 'Cannot divide by zero' };
          res = (x / y) * 100;
          steps = [`Formula: (X / Y) × 100`, `Calculation: (${x} / ${y}) × 100 = ${res}%`];
          tips = [
            `${x} represents ${res.toFixed(1)}% of ${y}`,
            res > 50 ? 'This is more than half!' : 'This is less than half'
          ];
          return { result: `${res.toFixed(2)}%`, explanation: `${x} is ${res.toFixed(2)}% of ${y}`, steps, tips, formula: '(X ÷ Y) × 100' };
        } else {
          if (x === 0) return { result: 'Error', explanation: 'Original value cannot be zero' };
          res = ((y - x) / x) * 100;
          steps = [`Formula: ((New - Old) / Old) × 100`, `Calculation: ((${y} - ${x}) / ${x}) × 100 = ${res}%`];
          const changeType = res > 0 ? 'increase' : 'decrease';
          tips = [
            `${Math.abs(res).toFixed(1)}% ${changeType} from ${x} to ${y}`,
            res > 0 ? '📈 Positive growth!' : '📉 Negative change',
            `Absolute change: ${Math.abs(y - x).toFixed(2)}`
          ];
          return { result: `${res.toFixed(2)}%`, explanation: `${Math.abs(res).toFixed(2)}% ${changeType}`, steps, tips, formula: '((New - Old) ÷ Old) × 100' };
        }
      }
    };
  }

  // 10% CALCULATOR
  if (id.includes('ten-percent')) {
    return {
      title: '10% Calculator',
      description: 'Quickly calculate 10% of any number.',
      inputs: [
        { name: 'value', label: 'Number', type: 'slider', defaultValue: 250, min: 0, max: 10000, step: 10 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const res = val * 0.1;
        return { 
          result: res.toFixed(2), 
          explanation: `10% of ${val}`,
          steps: [`${val} × 0.10 = ${res}`],
          tips: ['Quick method: Move decimal point one place left!', `Original: ${val} → 10%: ${res}`],
          formula: 'Value × 0.10'
        };
      }
    };
  }

  // 20% CALCULATOR
  if (id.includes('twenty-percent')) {
    return {
      title: '20% Calculator',
      description: 'Quickly calculate 20% of any number.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 500 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const res = val * 0.2;
        return { 
          result: res.toFixed(2), 
          explanation: `20% of ${val}`,
          steps: [`${val} × 0.20 = ${res}`]
        };
      }
    };
  }

  // RATIO CALCULATOR
  if (id.includes('ratio')) {
    return {
      title: 'Ratio Calculator',
      description: 'Simplify ratios and solve ratio problems.',
      inputs: [
        { name: 'a', label: 'First Value', type: 'number', defaultValue: 12 },
        { name: 'b', label: 'Second Value', type: 'number', defaultValue: 18 },
      ],
      calculate: (inputs) => {
        const a = safeInt(inputs.a);
        const b = safeInt(inputs.b);
        if (a === 0 || b === 0) return { result: 'Invalid', explanation: 'Values must be non-zero' };
        
        const divisor = gcd(a, b);
        const simplifiedA = a / divisor;
        const simplifiedB = b / divisor;
        
        return {
          result: `${simplifiedA}:${simplifiedB}`,
          explanation: `Simplified ratio`,
          steps: [
            `Original ratio: ${a}:${b}`,
            `GCD of ${a} and ${b} is ${divisor}`,
            `Simplified: ${a}÷${divisor} : ${b}÷${divisor} = ${simplifiedA}:${simplifiedB}`
          ]
        };
      }
    };
  }

  // AVERAGE/MEAN CALCULATOR
  if (id.includes('average') || (id.includes('mean') && !id.includes('harmonic') && !id.includes('geometric'))) {
    return {
      title: 'Average Calculator',
      description: 'Calculate mean, median, and mode of numbers.',
      inputs: [
        { name: 'numbers', label: 'Numbers (comma-separated)', type: 'text', defaultValue: '10, 20, 30, 40, 50', placeholder: 'e.g., 5, 10, 15, 20' },
        { name: 'type', label: 'Type', type: 'select', options: ['Mean', 'Median', 'Mode'], defaultValue: 'Mean' },
      ],
      calculate: (inputs) => {
        const nums = (inputs.numbers || '').split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n));
        if (nums.length === 0) return { result: 'Error', explanation: 'Please enter valid numbers' };
        
        const type = inputs.type;
        
        if (type === 'Mean') {
          const sum = nums.reduce((a: number, b: number) => a + b, 0);
          const mean = sum / nums.length;
          return {
            result: mean.toFixed(2),
            explanation: `Mean of ${nums.length} numbers`,
            steps: [
              `Numbers: [${nums.join(', ')}]`,
              `Sum: ${sum}`,
              `Count: ${nums.length}`,
              `Mean = ${sum} ÷ ${nums.length} = ${mean.toFixed(4)}`
            ]
          };
        } else if (type === 'Median') {
          const sorted = [...nums].sort((a: number, b: number) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          return {
            result: median.toFixed(2),
            explanation: `Median of ${nums.length} numbers`,
            steps: [
              `Original: [${nums.join(', ')}]`,
              `Sorted: [${sorted.join(', ')}]`,
              `Median = ${median}`
            ]
          };
        } else { // Mode
          const freq: { [key: number]: number } = {};
          nums.forEach((n: number) => freq[n] = (freq[n] || 0) + 1);
          const maxFreq = Math.max(...Object.values(freq));
          const modes = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq).map(Number);
          return {
            result: modes.join(', '),
            explanation: `Mode (most frequent value${modes.length > 1 ? 's' : ''})`,
            steps: [
              `Numbers: [${nums.join(', ')}]`,
              `Frequency: ${JSON.stringify(freq)}`,
              `Mode(s): ${modes.join(', ')} (appears ${maxFreq} time${maxFreq > 1 ? 's' : ''})`
            ]
          };
        }
      }
    };
  }

  // SQUARE ROOT
  if (id.includes('square-root')) {
    return {
      title: 'Square Root Calculator',
      description: 'Calculate the square root of a number.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 64, min: 0 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        if (val < 0) return { result: 'Error', explanation: 'Cannot calculate square root of negative number' };
        const res = Math.sqrt(val);
        return {
          result: res.toFixed(4),
          explanation: `√${val}`,
          steps: [`√${val} = ${res.toFixed(6)}`]
        };
      }
    };
  }

  // CUBE ROOT
  if (id.includes('cube-root')) {
    return {
      title: 'Cube Root Calculator',
      description: 'Calculate the cube root of a number.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 27 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const res = Math.cbrt(val);
        return {
          result: res.toFixed(4),
          explanation: `∛${val}`,
          steps: [`∛${val} = ${res.toFixed(6)}`]
        };
      }
    };
  }

  // FACTORIAL
  if (id.includes('factorial')) {
    return {
      title: 'Factorial Calculator',
      description: 'Calculate the factorial of a number (n!).',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 5, min: 0, max: 170 },
      ],
      calculate: (inputs) => {
        const n = safeInt(inputs.value);
        if (n < 0) return { result: 'Error', explanation: 'Factorial not defined for negative numbers' };
        if (n > 170) return { result: 'Error', explanation: 'Number too large (max 170)' };
        
        let result = 1;
        const steps: string[] = [];
        for (let i = 2; i <= n; i++) {
          result *= i;
        }
        
        if (n <= 10) {
          let str = '';
          for (let i = n; i >= 1; i--) {
            str += i + (i > 1 ? ' × ' : '');
          }
          steps.push(`${n}! = ${str} = ${result}`);
        } else {
          steps.push(`${n}! = ${n} × ${n-1} × ... × 2 × 1 = ${result}`);
        }
        
        return { result: result.toString(), explanation: `${n}!`, steps };
      }
    };
  }

  // ABSOLUTE VALUE
  if (id.includes('absolute-value')) {
    return {
      title: 'Absolute Value Calculator',
      description: 'Find the absolute value (distance from zero).',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: -25 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const res = Math.abs(val);
        return {
          result: res.toString(),
          explanation: `|${val}|`,
          steps: [`|${val}| = ${res}`]
        };
      }
    };
  }

  // RECIPROCAL
  if (id.includes('reciprocal')) {
    return {
      title: 'Reciprocal Calculator',
      description: 'Calculate 1/x (reciprocal of a number).',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 8 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        if (val === 0) return { result: 'Undefined', explanation: 'Reciprocal of 0 is undefined' };
        const res = 1 / val;
        return {
          result: res.toFixed(6),
          explanation: `1/${val}`,
          steps: [`1 ÷ ${val} = ${res}`]
        };
      }
    };
  }

  // ROUNDING
  if (id.includes('rounding')) {
    return {
      title: 'Rounding Calculator',
      description: 'Round numbers to specified decimal places.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 3.14159 },
        { name: 'decimals', label: 'Decimal Places', type: 'number', defaultValue: 2, min: 0, max: 10 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const dec = safeInt(inputs.decimals);
        const res = Number(val.toFixed(dec));
        return {
          result: res.toString(),
          explanation: `Rounded to ${dec} decimal place${dec !== 1 ? 's' : ''}`,
          steps: [`${val} rounded to ${dec} decimals = ${res}`]
        };
      }
    };
  }

  // REMAINDER/MODULO
  if (id.includes('remainder') || id.includes('modulo')) {
    return {
      title: 'Remainder/Modulo Calculator',
      description: 'Find the remainder when dividing two numbers.',
      inputs: [
        { name: 'dividend', label: 'Dividend', type: 'number', defaultValue: 17 },
        { name: 'divisor', label: 'Divisor', type: 'number', defaultValue: 5 },
      ],
      calculate: (inputs) => {
        const dividend = safeInt(inputs.dividend);
        const divisor = safeInt(inputs.divisor);
        if (divisor === 0) return { result: 'Error', explanation: 'Cannot divide by zero' };
        
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        
        return {
          result: remainder.toString(),
          explanation: `Remainder when ${dividend} ÷ ${divisor}`,
          steps: [
            `${dividend} ÷ ${divisor} = ${quotient} remainder ${remainder}`,
            `Verification: ${divisor} × ${quotient} + ${remainder} = ${dividend}`
          ]
        };
      }
    };
  }

  // EXPONENT/POWER
  if (id.includes('exponent') && !id.includes('scientific')) {
    return {
      title: 'Exponent Calculator',
      description: 'Calculate powers (x^y).',
      inputs: [
        { name: 'base', label: 'Base', type: 'number', defaultValue: 2 },
        { name: 'exponent', label: 'Exponent', type: 'number', defaultValue: 10 },
      ],
      calculate: (inputs) => {
        const base = safeFloat(inputs.base);
        const exp = safeFloat(inputs.exponent);
        const res = Math.pow(base, exp);
        
        if (!isFinite(res)) return { result: 'Error', explanation: 'Result too large or invalid' };
        
        return {
          result: res.toFixed(4),
          explanation: `${base}^${exp}`,
          steps: [`${base} raised to power ${exp} = ${res}`]
        };
      }
    };
  }

  // LOGARITHM
  if (id.includes('logarithm')) {
    return {
      title: 'Logarithm Calculator',
      description: 'Calculate logarithms with any base.',
      inputs: [
        { name: 'value', label: 'Value', type: 'number', defaultValue: 100, min: 0.0001 },
        { name: 'base', label: 'Base', type: 'select', options: ['e (natural)', '10 (common)', '2 (binary)', 'custom'], defaultValue: '10 (common)' },
        { name: 'customBase', label: 'Custom Base', type: 'number', defaultValue: 10, min: 0.0001 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        if (val <= 0) return { result: 'Error', explanation: 'Value must be positive' };
        
        let base = 10;
        const baseType = inputs.base;
        if (baseType === 'e (natural)') base = Math.E;
        else if (baseType === '10 (common)') base = 10;
        else if (baseType === '2 (binary)') base = 2;
        else base = safeFloat(inputs.customBase);
        
        if (base <= 0 || base === 1) return { result: 'Error', explanation: 'Base must be positive and not 1' };
        
        const res = Math.log(val) / Math.log(base);
        return {
          result: res.toFixed(6),
          explanation: `log₍${base === Math.E ? 'e' : base}₎(${val})`,
          steps: [`log₍${base === Math.E ? 'e' : base}₎(${val}) = ${res}`]
        };
      }
    };
  }

  // GCD (GREATEST COMMON DIVISOR)
  if (id.includes('gcd') || id.includes('greatest-common')) {
    return {
      title: 'GCD Calculator',
      description: 'Find the Greatest Common Divisor of two numbers.',
      inputs: [
        { name: 'a', label: 'First Number', type: 'number', defaultValue: 48 },
        { name: 'b', label: 'Second Number', type: 'number', defaultValue: 18 },
      ],
      calculate: (inputs) => {
        const a = safeInt(inputs.a);
        const b = safeInt(inputs.b);
        const res = gcd(a, b);
        
        return {
          result: res.toString(),
          explanation: `GCD(${a}, ${b})`,
          steps: [
            `Finding GCD of ${a} and ${b}`,
            `Using Euclidean algorithm`,
            `GCD = ${res}`
          ]
        };
      }
    };
  }

  // LCM (LEAST COMMON MULTIPLE)
  if (id.includes('lcm') || id.includes('least-common')) {
    return {
      title: 'LCM Calculator',
      description: 'Find the Least Common Multiple of two numbers.',
      inputs: [
        { name: 'a', label: 'First Number', type: 'number', defaultValue: 12 },
        { name: 'b', label: 'Second Number', type: 'number', defaultValue: 18 },
      ],
      calculate: (inputs) => {
        const a = safeInt(inputs.a);
        const b = safeInt(inputs.b);
        if (a === 0 || b === 0) return { result: '0', explanation: 'LCM is 0 when any number is 0' };
        
        const res = lcm(a, b);
        const gcdVal = gcd(a, b);
        
        return {
          result: res.toString(),
          explanation: `LCM(${a}, ${b})`,
          steps: [
            `GCD(${a}, ${b}) = ${gcdVal}`,
            `LCM = (${a} × ${b}) ÷ GCD`,
            `LCM = ${a * b} ÷ ${gcdVal} = ${res}`
          ]
        };
      }
    };
  }

  // PRIME CHECK
  if (id.includes('prime')) {
    return {
      title: 'Prime Number Checker',
      description: 'Check if a number is prime.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 17, min: 2 },
      ],
      calculate: (inputs) => {
        const n = safeInt(inputs.value);
        if (n < 2) return { result: 'Not Prime', explanation: 'Numbers less than 2 are not prime' };
        
        let isPrime = true;
        for (let i = 2; i <= Math.sqrt(n); i++) {
          if (n % i === 0) {
            isPrime = false;
            return {
              result: 'Not Prime',
              explanation: `${n} is divisible by ${i}`,
              steps: [`${n} ÷ ${i} = ${n/i}`, `Therefore ${n} is composite`]
            };
          }
        }
        
        return {
          result: 'Prime',
          explanation: `${n} is a prime number`,
          steps: [`Checked divisibility up to √${n} ≈ ${Math.sqrt(n).toFixed(2)}`, `No divisors found`, `${n} is prime`]
        };
      }
    };
  }

  // DISTANCE FORMULA
  if (id.includes('distance-formula')) {
    return {
      title: 'Distance Formula Calculator',
      description: 'Calculate distance between two points (x₁,y₁) and (x₂,y₂).',
      inputs: [
        { name: 'x1', label: 'x₁', type: 'number', defaultValue: 1 },
        { name: 'y1', label: 'y₁', type: 'number', defaultValue: 2 },
        { name: 'x2', label: 'x₂', type: 'number', defaultValue: 4 },
        { name: 'y2', label: 'y₂', type: 'number', defaultValue: 6 },
      ],
      calculate: (inputs) => {
        const x1 = safeFloat(inputs.x1);
        const y1 = safeFloat(inputs.y1);
        const x2 = safeFloat(inputs.x2);
        const y2 = safeFloat(inputs.y2);
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return {
          result: distance.toFixed(4),
          explanation: `Distance between (${x1},${y1}) and (${x2},${y2})`,
          steps: [
            `Formula: d = √[(x₂-x₁)² + (y₂-y₁)²]`,
            `Δx = ${x2} - ${x1} = ${dx}`,
            `Δy = ${y2} - ${y1} = ${dy}`,
            `d = √[${dx}² + ${dy}²] = √${dx*dx + dy*dy} = ${distance.toFixed(4)}`
          ]
        };
      }
    };
  }

  // MIDPOINT
  if (id.includes('midpoint')) {
    return {
      title: 'Midpoint Calculator',
      description: 'Find the midpoint between two points.',
      inputs: [
        { name: 'x1', label: 'x₁', type: 'number', defaultValue: 2 },
        { name: 'y1', label: 'y₁', type: 'number', defaultValue: 3 },
        { name: 'x2', label: 'x₂', type: 'number', defaultValue: 8 },
        { name: 'y2', label: 'y₂', type: 'number', defaultValue: 7 },
      ],
      calculate: (inputs) => {
        const x1 = safeFloat(inputs.x1);
        const y1 = safeFloat(inputs.y1);
        const x2 = safeFloat(inputs.x2);
        const y2 = safeFloat(inputs.y2);
        
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        
        return {
          result: `(${mx}, ${my})`,
          explanation: `Midpoint of (${x1},${y1}) and (${x2},${y2})`,
          steps: [
            `Formula: M = ((x₁+x₂)/2, (y₁+y₂)/2)`,
            `x-coordinate: (${x1}+${x2})/2 = ${mx}`,
            `y-coordinate: (${y1}+${y2})/2 = ${my}`,
            `Midpoint = (${mx}, ${my})`
          ]
        };
      }
    };
  }

  // SLOPE
  if (id.includes('slope') && !id.includes('point')) {
    return {
      title: 'Slope Calculator',
      description: 'Calculate the slope between two points.',
      inputs: [
        { name: 'x1', label: 'x₁', type: 'number', defaultValue: 1 },
        { name: 'y1', label: 'y₁', type: 'number', defaultValue: 2 },
        { name: 'x2', label: 'x₂', type: 'number', defaultValue: 3 },
        { name: 'y2', label: 'y₂', type: 'number', defaultValue: 6 },
      ],
      calculate: (inputs) => {
        const x1 = safeFloat(inputs.x1);
        const y1 = safeFloat(inputs.y1);
        const x2 = safeFloat(inputs.x2);
        const y2 = safeFloat(inputs.y2);
        
        if (x1 === x2) return { result: 'Undefined', explanation: 'Vertical line (undefined slope)' };
        
        const slope = (y2 - y1) / (x2 - x1);
        
        return {
          result: slope.toFixed(4),
          explanation: `Slope between (${x1},${y1}) and (${x2},${y2})`,
          steps: [
            `Formula: m = (y₂-y₁)/(x₂-x₁)`,
            `m = (${y2}-${y1})/(${x2}-${x1})`,
            `m = ${y2-y1}/${x2-x1} = ${slope.toFixed(4)}`
          ]
        };
      }
    };
  }

  // QUADRATIC FORMULA
  if (id.includes('quadratic')) {
    return {
      title: 'Quadratic Formula Calculator',
      description: 'Solve quadratic equations ax² + bx + c = 0.',
      inputs: [
        { name: 'a', label: 'Coefficient a', type: 'number', defaultValue: 1 },
        { name: 'b', label: 'Coefficient b', type: 'number', defaultValue: -5 },
        { name: 'c', label: 'Coefficient c', type: 'number', defaultValue: 6 },
      ],
      calculate: (inputs) => {
        const a = safeFloat(inputs.a);
        const b = safeFloat(inputs.b);
        const c = safeFloat(inputs.c);
        
        if (a === 0) return { result: 'Invalid', explanation: 'Coefficient a cannot be zero' };
        
        const discriminant = b*b - 4*a*c;
        const steps = [
          `Equation: ${a}x² + ${b}x + ${c} = 0`,
          `Discriminant Δ = b² - 4ac = ${b}² - 4(${a})(${c}) = ${discriminant}`
        ];
        
        if (discriminant > 0) {
          const x1 = (-b + Math.sqrt(discriminant)) / (2*a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2*a);
          steps.push(`Two real roots:`);
          steps.push(`x₁ = (-${b} + √${discriminant}) / ${2*a} = ${x1.toFixed(4)}`);
          steps.push(`x₂ = (-${b} - √${discriminant}) / ${2*a} = ${x2.toFixed(4)}`);
          return { result: `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`, explanation: 'Two distinct real roots', steps };
        } else if (discriminant === 0) {
          const x = -b / (2*a);
          steps.push(`One repeated root: x = -${b} / ${2*a} = ${x.toFixed(4)}`);
          return { result: `x = ${x.toFixed(4)}`, explanation: 'One repeated real root', steps };
        } else {
          const real = -b / (2*a);
          const imag = Math.sqrt(-discriminant) / (2*a);
          steps.push(`Complex roots: ${real.toFixed(4)} ± ${imag.toFixed(4)}i`);
          return { result: `${real.toFixed(4)} ± ${imag.toFixed(4)}i`, explanation: 'Two complex conjugate roots', steps };
        }
      }
    };
  }

  // SCIENTIFIC NOTATION
  if (id.includes('scientific-notation')) {
    return {
      title: 'Scientific Notation Converter',
      description: 'Convert numbers to/from scientific notation.',
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 12500000 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        if (val === 0) return { result: '0 × 10⁰', explanation: 'Zero in scientific notation' };
        
        const exp = Math.floor(Math.log10(Math.abs(val)));
        const coef = val / Math.pow(10, exp);
        
        return {
          result: `${coef.toFixed(2)} × 10^${exp}`,
          explanation: 'Scientific notation',
          steps: [
            `Original: ${val}`,
            `Scientific notation: ${coef.toFixed(4)} × 10^${exp}`
          ]
        };
      }
    };
  }

  // SIGNIFICANT FIGURES
  if (id.includes('significant-figures')) {
    return {
      title: 'Significant Figures Calculator',
      description: 'Count significant figures in a number.',
      inputs: [
        { name: 'value', label: 'Number', type: 'text', defaultValue: '0.00450', placeholder: 'e.g., 0.00450' },
      ],
      calculate: (inputs) => {
        const str = (inputs.value || '').trim();
        if (!str || isNaN(Number(str))) return { result: 'Invalid', explanation: 'Please enter a valid number' };
        
        // Remove leading zeros and decimal point for counting
        let cleaned = str.replace(/^0+/, '').replace('.', '');
        // Count trailing zeros only if there was a decimal point
        const sigFigs = cleaned === '' ? 1 : cleaned.length;
        
        return {
          result: sigFigs.toString(),
          explanation: `${sigFigs} significant figure${sigFigs !== 1 ? 's' : ''}`,
          steps: [
            `Number: ${str}`,
            `Significant figures: ${sigFigs}`
          ]
        };
      }
    };
  }

  // ARITHMETIC PROGRESSION
  if (id.includes('arithmetic-progression')) {
    return {
      title: 'Arithmetic Progression (AP) Calculator',
      description: 'Calculate AP terms and sum.',
      inputs: [
        { name: 'first', label: 'First Term (a)', type: 'number', defaultValue: 2 },
        { name: 'diff', label: 'Common Difference (d)', type: 'number', defaultValue: 3 },
        { name: 'n', label: 'Number of Terms (n)', type: 'number', defaultValue: 5, min: 1 },
      ],
      calculate: (inputs) => {
        const a = safeFloat(inputs.first);
        const d = safeFloat(inputs.diff);
        const n = safeInt(inputs.n);
        
        const nth = a + (n-1)*d;
        const sum = (n/2) * (2*a + (n-1)*d);
        
        return {
          result: `nth term = ${nth}, Sum = ${sum}`,
          explanation: `AP: ${a}, ${a+d}, ${a+2*d}, ...`,
          steps: [
            `First term a = ${a}, Common difference d = ${d}`,
            `nth term = a + (n-1)d = ${a} + (${n}-1)×${d} = ${nth}`,
            `Sum = n/2 × [2a + (n-1)d] = ${n}/2 × [2×${a} + (${n}-1)×${d}] = ${sum}`
          ]
        };
      }
    };
  }

  // GEOMETRIC PROGRESSION
  if (id.includes('geometric-progression')) {
    return {
      title: 'Geometric Progression (GP) Calculator',
      description: 'Calculate GP terms and sum.',
      inputs: [
        { name: 'first', label: 'First Term (a)', type: 'number', defaultValue: 2 },
        { name: 'ratio', label: 'Common Ratio (r)', type: 'number', defaultValue: 3 },
        { name: 'n', label: 'Number of Terms (n)', type: 'number', defaultValue: 4, min: 1 },
      ],
      calculate: (inputs) => {
        const a = safeFloat(inputs.first);
        const r = safeFloat(inputs.ratio);
        const n = safeInt(inputs.n);
        
        const nth = a * Math.pow(r, n-1);
        const sum = r === 1 ? n*a : a * (Math.pow(r, n) - 1) / (r - 1);
        
        return {
          result: `nth term = ${nth.toFixed(2)}, Sum = ${sum.toFixed(2)}`,
          explanation: `GP: ${a}, ${a*r}, ${a*r*r}, ...`,
          steps: [
            `First term a = ${a}, Common ratio r = ${r}`,
            `nth term = a × r^(n-1) = ${a} × ${r}^${n-1} = ${nth.toFixed(4)}`,
            `Sum = a(r^n - 1)/(r-1) = ${sum.toFixed(4)}`
          ]
        };
      }
    };
  }

  // PYTHAGOREAN THEOREM
  if (id.includes('pythagorean')) {
    return {
      title: 'Pythagorean Theorem Calculator',
      description: 'Calculate the third side of a right triangle.',
      inputs: [
        { name: 'a', label: 'Side a', type: 'number', defaultValue: 3 },
        { name: 'b', label: 'Side b', type: 'number', defaultValue: 4 },
        { name: 'find', label: 'Find', type: 'select', options: ['Hypotenuse c', 'Side a', 'Side b'], defaultValue: 'Hypotenuse c' },
      ],
      calculate: (inputs) => {
        const a = safeFloat(inputs.a);
        const b = safeFloat(inputs.b);
        const find = inputs.find;
        
        let result = 0;
        let steps: string[] = [];
        
        if (find === 'Hypotenuse c') {
          result = Math.sqrt(a*a + b*b);
          steps = [
            `Formula: c² = a² + b²`,
            `c² = ${a}² + ${b}² = ${a*a} + ${b*b} = ${a*a + b*b}`,
            `c = √${a*a + b*b} = ${result.toFixed(4)}`
          ];
        } else if (find === 'Side a') {
          result = Math.sqrt(b*b - a*a);
          steps = [`a = √(c² - b²) = ${result.toFixed(4)}`];
        } else {
          result = Math.sqrt(b*b - a*a);
          steps = [`b = √(c² - a²) = ${result.toFixed(4)}`];
        }
        
        return { result: result.toFixed(4), explanation: find, steps };
      }
    };
  }

  // DOUBLE/TRIPLE/HALF/QUARTER/THIRD
  if (id.includes('double') || id.includes('triple') || id.includes('half') || id.includes('quarter') || id.includes('third')) {
    let multiplier = 2;
    let title = 'Double Calculator';
    let desc = 'Double any number instantly.';
    
    if (id.includes('triple')) { multiplier = 3; title = 'Triple Calculator'; desc = 'Triple any number instantly.'; }
    else if (id.includes('half')) { multiplier = 0.5; title = 'Half Calculator'; desc = 'Find half of any number.'; }
    else if (id.includes('quarter')) { multiplier = 0.25; title = 'Quarter Calculator'; desc = 'Find a quarter of any number.'; }
    else if (id.includes('third')) { multiplier = 1/3; title = 'Third Calculator'; desc = 'Find a third of any number.'; }
    
    return {
      title,
      description: desc,
      inputs: [
        { name: 'value', label: 'Number', type: 'number', defaultValue: 50 },
      ],
      calculate: (inputs) => {
        const val = safeFloat(inputs.value);
        const res = val * multiplier;
        return { 
          result: res.toFixed(4), 
          explanation: `${val} × ${multiplier}`,
          steps: [`${val} × ${multiplier} = ${res}`]
        };
      }
    };
  }

  // SUM OF SERIES
  if (id.includes('sum-of-series')) {
    return {
      title: 'Sum of Series Calculator',
      description: 'Calculate the sum of a series of numbers.',
      inputs: [
        { name: 'numbers', label: 'Numbers (comma-separated)', type: 'text', defaultValue: '1, 2, 3, 4, 5', placeholder: 'e.g., 10, 20, 30' },
      ],
      calculate: (inputs) => {
        const nums = (inputs.numbers || '').split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n));
        if (nums.length === 0) return { result: 'Error', explanation: 'Please enter valid numbers' };
        
        const sum = nums.reduce((a: number, b: number) => a + b, 0);
        
        return {
          result: sum.toFixed(2),
          explanation: `Sum of ${nums.length} numbers`,
          steps: [
            `Numbers: [${nums.join(', ')}]`,
            `Sum: ${nums.join(' + ')} = ${sum}`
          ]
        };
      }
    };
  }

  // PRODUCT OF SERIES
  if (id.includes('product-of-series')) {
    return {
      title: 'Product of Series Calculator',
      description: 'Calculate the product of a series of numbers.',
      inputs: [
        { name: 'numbers', label: 'Numbers (comma-separated)', type: 'text', defaultValue: '2, 3, 4', placeholder: 'e.g., 2, 5, 10' },
      ],
      calculate: (inputs) => {
        const nums = (inputs.numbers || '').split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n));
        if (nums.length === 0) return { result: 'Error', explanation: 'Please enter valid numbers' };
        
        const product = nums.reduce((a: number, b: number) => a * b, 1);
        
        return {
          result: product.toFixed(2),
          explanation: `Product of ${nums.length} numbers`,
          steps: [
            `Numbers: [${nums.join(', ')}]`,
            `Product: ${nums.join(' × ')} = ${product}`
          ]
        };
      }
    };
  }

  // AREA CALCULATOR
  if (id.includes('area') && !id.includes('body')) {
    return {
      title: 'Area Calculator',
      description: 'Calculate area of geometric shapes.',
      inputs: [
        { name: 'shape', label: 'Shape', type: 'select', options: ['Rectangle', 'Circle', 'Triangle', 'Square'], defaultValue: 'Rectangle' },
        { name: 'dim1', label: 'Dimension 1', type: 'number', defaultValue: 10 },
        { name: 'dim2', label: 'Dimension 2 (if needed)', type: 'number', defaultValue: 5 },
      ],
      calculate: (inputs) => {
        const shape = inputs.shape;
        const d1 = safeFloat(inputs.dim1);
        const d2 = safeFloat(inputs.dim2);
        let area = 0;
        let formula = '';
        
        if (shape === 'Rectangle') {
          area = d1 * d2;
          formula = `Area = length × width = ${d1} × ${d2}`;
        } else if (shape === 'Circle') {
          area = Math.PI * d1 * d1;
          formula = `Area = πr² = π × ${d1}² = ${area.toFixed(4)}`;
        } else if (shape === 'Triangle') {
          area = 0.5 * d1 * d2;
          formula = `Area = ½ × base × height = 0.5 × ${d1} × ${d2}`;
        } else if (shape === 'Square') {
          area = d1 * d1;
          formula = `Area = side² = ${d1}²`;
        }
        
        return {
          result: area.toFixed(2),
          explanation: `Area of ${shape}`,
          steps: [formula, `Area = ${area.toFixed(4)}`]
        };
      }
    };
  }

  if (
    [
      'vector-add-subtract',
      'vector-scalar-multiply',
      'vector-magnitude-norm',
      'vector-dot-product-angle',
      'vector-cross-product-3d',
      'vector-projection-rejection',
      'vector-orthogonality-check',
      'gram-schmidt-orthonormalization',
      'matrix-vector-multiplication',
      'linear-combination-solver',
      'span-basis-independence',
      'solve-linear-system-advanced',
      'matrix-inverse-advanced',
      'rank-determinant-advanced',
      'eigensystem-calculator',
      'svd-calculator',
      'pca-variance-calculator',
    ].includes(id)
  ) {
    const vectorHelp = 'Comma-separated values, e.g. 1,2,3';
    const matrixHelp = 'Rows separated by semicolon, e.g. 1,2;3,4';

    const configs: Record<string, MathToolConfig> = {
      'vector-add-subtract': {
        title: 'Vector Addition & Subtraction',
        description: 'Add or subtract vectors component-wise with advanced vector notation.',
        inputs: [
          { name: 'operation', label: 'Operation', type: 'select', options: ['Add', 'Subtract'], defaultValue: 'Add' },
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,2,3', placeholder: '1,2,3', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '4,5,6', placeholder: '4,5,6', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (!sameDimensions(a, b)) return { result: 'Error', explanation: 'Both vectors must have the same non-zero dimension.' };
          const operation = inputs.operation === 'Subtract' ? 'Subtract' : 'Add';
          const result = a.map((value, index) => operation === 'Add' ? value + b[index] : value - b[index]);
          return {
            result: formatVector(result),
            explanation: `${operation} ${formatVector(a)} and ${formatVector(b)}`,
            steps: [`A = ${formatVector(a)}`, `B = ${formatVector(b)}`, `${operation === 'Add' ? 'A + B' : 'A - B'} = ${formatVector(result)}`],
            formula: 'c_i = a_i ± b_i',
          };
        },
      },
      'vector-scalar-multiply': {
        title: 'Scalar Multiplication Calculator',
        description: 'Scale a vector by a scalar and inspect the transformed result.',
        inputs: [
          { name: 'scalar', label: 'Scalar', type: 'number', defaultValue: 3 },
          { name: 'vector', label: 'Vector', type: 'text', defaultValue: '2,-1,4', placeholder: '2,-1,4', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const scalar = safeFloat(inputs.scalar);
          const vector = parseVector(inputs.vector);
          if (vector.length === 0) return { result: 'Error', explanation: 'Enter a valid vector.' };
          const scaled = vector.map(value => scalar * value);
          return {
            result: formatVector(scaled),
            explanation: `${scalar} × ${formatVector(vector)}`,
            steps: [`k = ${scalar}`, `k·v = ${formatVector(scaled)}`],
            formula: 'k·v = [k v₁, k v₂, ...]',
          };
        },
      },
      'vector-magnitude-norm': {
        title: 'Vector Magnitude & Norm Calculator',
        description: 'Compute L1, L2 and Infinity norms and the normalized vector.',
        inputs: [
          { name: 'vector', label: 'Vector', type: 'text', defaultValue: '3,4', placeholder: '3,4', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const vector = parseVector(inputs.vector);
          if (vector.length === 0) return { result: 'Error', explanation: 'Enter a valid vector.' };
          const l1 = vector.reduce((sum, value) => sum + Math.abs(value), 0);
          const l2 = vectorMagnitude(vector);
          const linf = Math.max(...vector.map(value => Math.abs(value)));
          const normalized = l2 === 0 ? vector : vector.map(value => value / l2);
          return {
            result: `L2 = ${l2.toFixed(4)}`,
            explanation: `Norms for ${formatVector(vector)}`,
            steps: [
              `L1 = ${l1.toFixed(4)}`,
              `L2 = sqrt(sum(vᵢ²)) = ${l2.toFixed(4)}`,
              `L∞ = ${linf.toFixed(4)}`,
              `Normalized vector = ${formatVector(normalized)}`,
            ],
          };
        },
      },
      'vector-dot-product-angle': {
        title: 'Dot Product & Angle Calculator',
        description: 'Find dot product, cosine similarity and angle between vectors.',
        inputs: [
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,2,3', placeholder: '1,2,3', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '4,5,6', placeholder: '4,5,6', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (!sameDimensions(a, b)) return { result: 'Error', explanation: 'Both vectors must have the same non-zero dimension.' };
          const dot = dotProduct(a, b);
          const magA = vectorMagnitude(a);
          const magB = vectorMagnitude(b);
          if (magA === 0 || magB === 0) return { result: 'Error', explanation: 'Zero vector is not allowed for angle calculation.' };
          const cosine = Math.max(-1, Math.min(1, dot / (magA * magB)));
          const angleDeg = Math.acos(cosine) * (180 / Math.PI);
          return {
            result: `Dot = ${dot.toFixed(4)}`,
            explanation: `Angle = ${angleDeg.toFixed(4)}°`,
            steps: [
              `A·B = ${dot.toFixed(4)}`,
              `|A| = ${magA.toFixed(4)}, |B| = ${magB.toFixed(4)}`,
              `cos θ = ${cosine.toFixed(6)}`,
              `θ = ${angleDeg.toFixed(4)}°`,
            ],
          };
        },
      },
      'vector-cross-product-3d': {
        title: '3D Cross Product Calculator',
        description: 'Compute the cross product of two 3D vectors and the parallelogram area.',
        inputs: [
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,0,0', placeholder: '1,0,0', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '0,1,0', placeholder: '0,1,0', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (a.length !== 3 || b.length !== 3) return { result: 'Error', explanation: 'Cross product needs two 3D vectors.' };
          const cross = [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
          ];
          const area = vectorMagnitude(cross);
          return {
            result: formatVector(cross),
            explanation: `Cross product = ${formatVector(cross)}`,
            steps: [`A × B = ${formatVector(cross)}`, `Parallelogram area = |A × B| = ${area.toFixed(4)}`],
          };
        },
      },
      'vector-projection-rejection': {
        title: 'Vector Projection & Rejection',
        description: 'Resolve a vector into its parallel and perpendicular components.',
        inputs: [
          { name: 'vectorA', label: 'Vector to Project', type: 'text', defaultValue: '3,4', placeholder: '3,4', helpText: vectorHelp },
          { name: 'vectorB', label: 'Base Vector', type: 'text', defaultValue: '1,0', placeholder: '1,0', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (!sameDimensions(a, b)) return { result: 'Error', explanation: 'Vectors must have same dimension.' };
          const denom = dotProduct(b, b);
          if (denom === 0) return { result: 'Error', explanation: 'Base vector cannot be the zero vector.' };
          const factor = dotProduct(a, b) / denom;
          const projection = b.map(value => factor * value);
          const rejection = a.map((value, index) => value - projection[index]);
          return {
            result: `proj = ${formatVector(projection)}`,
            explanation: `rej = ${formatVector(rejection)}`,
            steps: [`Projection factor = ${factor.toFixed(4)}`, `Projection = ${formatVector(projection)}`, `Rejection = ${formatVector(rejection)}`],
          };
        },
      },
      'vector-orthogonality-check': {
        title: 'Orthogonality & Orthonormality Check',
        description: 'Check whether two vectors are orthogonal or orthonormal.',
        inputs: [
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,0', placeholder: '1,0', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '0,1', placeholder: '0,1', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (!sameDimensions(a, b)) return { result: 'Error', explanation: 'Vectors must have same dimension.' };
          const dot = dotProduct(a, b);
          const orthogonal = Math.abs(dot) < 1e-9;
          const orthonormal = orthogonal && Math.abs(vectorMagnitude(a) - 1) < 1e-9 && Math.abs(vectorMagnitude(b) - 1) < 1e-9;
          return {
            result: orthonormal ? 'Orthonormal' : orthogonal ? 'Orthogonal' : 'Not Orthogonal',
            explanation: `Dot product = ${dot.toFixed(6)}`,
            steps: [`A·B = ${dot.toFixed(6)}`, `|A| = ${vectorMagnitude(a).toFixed(6)}`, `|B| = ${vectorMagnitude(b).toFixed(6)}`],
          };
        },
      },
      'gram-schmidt-orthonormalization': {
        title: 'Gram–Schmidt Orthonormalization',
        description: 'Generate an orthonormal basis from two linearly independent vectors.',
        inputs: [
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,1', placeholder: '1,1', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '1,0', placeholder: '1,0', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (!sameDimensions(a, b)) return { result: 'Error', explanation: 'Vectors must have same dimension.' };
          const normA = vectorMagnitude(a);
          if (normA === 0) return { result: 'Error', explanation: 'First vector cannot be zero.' };
          const e1 = a.map(value => value / normA);
          const projFactor = dotProduct(b, e1);
          const u2 = b.map((value, index) => value - projFactor * e1[index]);
          const normU2 = vectorMagnitude(u2);
          if (normU2 === 0) return { result: 'Error', explanation: 'Vectors are linearly dependent.' };
          const e2 = u2.map(value => value / normU2);
          return {
            result: `e1 = ${formatVector(e1)}`,
            explanation: `e2 = ${formatVector(e2)}`,
            steps: [`e1 = ${formatVector(e1)}`, `u2 = ${formatVector(u2)}`, `e2 = ${formatVector(e2)}`],
          };
        },
      },
      'matrix-vector-multiplication': {
        title: 'Matrix–Vector Multiplication',
        description: 'Multiply a matrix by a vector with dimension checking.',
        inputs: [
          { name: 'matrix', label: 'Matrix', type: 'text', defaultValue: '1,2;3,4', placeholder: '1,2;3,4', helpText: matrixHelp },
          { name: 'vector', label: 'Vector', type: 'text', defaultValue: '5,6', placeholder: '5,6', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          const vector = parseVector(inputs.vector);
          if (matrix.length === 0 || vector.length === 0 || matrix.some(row => row.length !== vector.length)) {
            return { result: 'Error', explanation: 'Matrix columns must match vector dimension.' };
          }
          const product = matrixVectorMultiply(matrix, vector);
          return {
            result: formatVector(product),
            explanation: `${formatMatrix(matrix)} × ${formatVector(vector)}`,
            steps: [`Matrix = ${formatMatrix(matrix)}`, `Vector = ${formatVector(vector)}`, `Product = ${formatVector(product)}`],
          };
        },
      },
      'linear-combination-solver': {
        title: 'Linear Combination Solver',
        description: 'Solve a 2D linear combination c1·v1 + c2·v2 = target.',
        inputs: [
          { name: 'basis1', label: 'Basis Vector 1', type: 'text', defaultValue: '1,0', placeholder: '1,0', helpText: vectorHelp },
          { name: 'basis2', label: 'Basis Vector 2', type: 'text', defaultValue: '0,1', placeholder: '0,1', helpText: vectorHelp },
          { name: 'target', label: 'Target Vector', type: 'text', defaultValue: '4,7', placeholder: '4,7', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const v1 = parseVector(inputs.basis1);
          const v2 = parseVector(inputs.basis2);
          const target = parseVector(inputs.target);
          if (v1.length !== 2 || v2.length !== 2 || target.length !== 2) return { result: 'Error', explanation: 'This solver currently supports 2D vectors only.' };
          const solution = solve2x2System([[v1[0], v2[0]], [v1[1], v2[1]]], target);
          if (!solution) return { result: 'Error', explanation: 'Given basis vectors do not span the target uniquely.' };
          return {
            result: `c1 = ${solution[0].toFixed(4)}, c2 = ${solution[1].toFixed(4)}`,
            explanation: `${solution[0].toFixed(4)}·v1 + ${solution[1].toFixed(4)}·v2 = target`,
            steps: [`v1 = ${formatVector(v1)}, v2 = ${formatVector(v2)}`, `target = ${formatVector(target)}`, `Coefficients = [${solution.map(v => v.toFixed(4)).join(', ')}]`],
          };
        },
      },
      'span-basis-independence': {
        title: 'Span, Basis & Linear Independence',
        description: 'Check whether two 2D vectors are linearly independent and form a basis.',
        inputs: [
          { name: 'vectorA', label: 'Vector A', type: 'text', defaultValue: '1,2', placeholder: '1,2', helpText: vectorHelp },
          { name: 'vectorB', label: 'Vector B', type: 'text', defaultValue: '3,4', placeholder: '3,4', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const a = parseVector(inputs.vectorA);
          const b = parseVector(inputs.vectorB);
          if (a.length !== 2 || b.length !== 2) return { result: 'Error', explanation: 'This checker currently supports 2D vectors only.' };
          const det = determinant2x2([[a[0], b[0]], [a[1], b[1]]]);
          const independent = Math.abs(det) > 1e-9;
          return {
            result: independent ? 'Linearly Independent' : 'Linearly Dependent',
            explanation: independent ? 'These vectors form a basis for R².' : 'These vectors do not form a basis for R².',
            steps: [`Determinant = ${det.toFixed(6)}`, independent ? 'det ≠ 0, so basis exists.' : 'det = 0, so vectors are dependent.'],
          };
        },
      },
      'solve-linear-system-advanced': {
        title: 'Advanced Linear System Solver',
        description: 'Solve a 2×2 linear system Ax = b using determinant method.',
        inputs: [
          { name: 'matrix', label: 'Coefficient Matrix', type: 'text', defaultValue: '2,1;5,3', placeholder: '2,1;5,3', helpText: matrixHelp },
          { name: 'constants', label: 'Constants Vector', type: 'text', defaultValue: '1,2', placeholder: '1,2', helpText: vectorHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          const constants = parseVector(inputs.constants);
          if (matrix.length !== 2 || matrix.some(row => row.length !== 2) || constants.length !== 2) {
            return { result: 'Error', explanation: 'This solver currently supports only 2×2 systems.' };
          }
          const solution = solve2x2System(matrix, constants);
          if (!solution) return { result: 'Error', explanation: 'System has no unique solution.' };
          return {
            result: `x = ${solution[0].toFixed(4)}, y = ${solution[1].toFixed(4)}`,
            explanation: `Solution vector = ${formatVector(solution)}`,
            steps: [`A = ${formatMatrix(matrix)}`, `b = ${formatVector(constants)}`, `x = ${formatVector(solution)}`],
          };
        },
      },
      'matrix-inverse-advanced': {
        title: 'Matrix Inverse Calculator',
        description: 'Find the inverse of a 2×2 matrix and verify invertibility.',
        inputs: [
          { name: 'matrix', label: '2×2 Matrix', type: 'text', defaultValue: '4,7;2,6', placeholder: '4,7;2,6', helpText: matrixHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          if (matrix.length !== 2 || matrix.some(row => row.length !== 2)) return { result: 'Error', explanation: 'Only 2×2 matrices are supported here.' };
          const inverse = inverse2x2(matrix);
          if (!inverse) return { result: 'Error', explanation: 'Matrix is singular; inverse does not exist.' };
          return {
            result: formatMatrix(inverse),
            explanation: `A⁻¹ = ${formatMatrix(inverse)}`,
            steps: [`det(A) = ${determinant2x2(matrix).toFixed(4)}`, `Inverse = ${formatMatrix(inverse)}`],
          };
        },
      },
      'rank-determinant-advanced': {
        title: 'Rank & Determinant Calculator',
        description: 'Compute determinant and rank for a 2×2 matrix.',
        inputs: [
          { name: 'matrix', label: '2×2 Matrix', type: 'text', defaultValue: '1,2;3,4', placeholder: '1,2;3,4', helpText: matrixHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          if (matrix.length !== 2 || matrix.some(row => row.length !== 2)) return { result: 'Error', explanation: 'Only 2×2 matrices are supported here.' };
          const det = determinant2x2(matrix);
          const rank = matrixRank2x2(matrix);
          return {
            result: `det = ${det.toFixed(4)}, rank = ${rank}`,
            explanation: `Matrix rank and determinant computed successfully.`,
            steps: [`A = ${formatMatrix(matrix)}`, `det(A) = ${det.toFixed(4)}`, `rank(A) = ${rank}`],
          };
        },
      },
      'eigensystem-calculator': {
        title: 'Eigenvalue & Eigenvector Calculator',
        description: 'Compute eigenvalues and eigenvectors for a 2×2 matrix.',
        inputs: [
          { name: 'matrix', label: '2×2 Matrix', type: 'text', defaultValue: '4,2;1,3', placeholder: '4,2;1,3', helpText: matrixHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          const eigen = eigen2x2(matrix);
          if (!eigen) return { result: 'Error', explanation: 'Only real eigensystems for 2×2 matrices are supported.' };
          return {
            result: `λ1 = ${eigen.values[0].toFixed(4)}, λ2 = ${eigen.values[1].toFixed(4)}`,
            explanation: `v1 = ${formatVector(eigen.vectors[0])}, v2 = ${formatVector(eigen.vectors[1])}`,
            steps: [`Eigenvalues = [${eigen.values.map(v => v.toFixed(4)).join(', ')}]`, `Eigenvector 1 = ${formatVector(eigen.vectors[0])}`, `Eigenvector 2 = ${formatVector(eigen.vectors[1])}`],
          };
        },
      },
      'svd-calculator': {
        title: 'Singular Value Decomposition (SVD)',
        description: 'Estimate singular values of a 2×2 matrix from AᵀA eigenvalues.',
        inputs: [
          { name: 'matrix', label: '2×2 Matrix', type: 'text', defaultValue: '3,1;1,3', placeholder: '3,1;1,3', helpText: matrixHelp },
        ],
        calculate: (inputs) => {
          const matrix = parseMatrix(inputs.matrix);
          if (matrix.length !== 2 || matrix.some(row => row.length !== 2)) return { result: 'Error', explanation: 'Only 2×2 matrices are supported here.' };
          const ata = [
            [matrix[0][0] ** 2 + matrix[1][0] ** 2, matrix[0][0] * matrix[0][1] + matrix[1][0] * matrix[1][1]],
            [matrix[0][0] * matrix[0][1] + matrix[1][0] * matrix[1][1], matrix[0][1] ** 2 + matrix[1][1] ** 2],
          ];
          const eigen = eigen2x2(ata);
          if (!eigen) return { result: 'Error', explanation: 'Unable to compute singular values.' };
          const singularValues = eigen.values.map(value => Math.sqrt(Math.max(0, value))).sort((a, b) => b - a);
          return {
            result: `σ = [${singularValues.map(v => v.toFixed(4)).join(', ')}]`,
            explanation: `Computed from eigenvalues of AᵀA`,
            steps: [`AᵀA = ${formatMatrix(ata)}`, `Singular values = [${singularValues.map(v => v.toFixed(4)).join(', ')}]`],
          };
        },
      },
      'pca-variance-calculator': {
        title: 'PCA & Explained Variance Calculator',
        description: 'Run PCA on 2D sample points and measure explained variance ratio.',
        inputs: [
          { name: 'points', label: '2D Points', type: 'text', defaultValue: '2,1;3,2;4,2;5,3', placeholder: '2,1;3,2;4,2;5,3', helpText: matrixHelp },
        ],
        calculate: (inputs) => {
          const points = parseMatrix(inputs.points);
          if (points.length < 2 || points.some(row => row.length !== 2)) return { result: 'Error', explanation: 'Provide at least two 2D points.' };
          const covariance = covariance2D(points);
          const eigen = eigen2x2(covariance);
          if (!eigen) return { result: 'Error', explanation: 'Unable to compute PCA for these points.' };
          const total = eigen.values[0] + eigen.values[1];
          const explained = eigen.values.map(value => total === 0 ? 0 : (value / total) * 100);
          return {
            result: `PC1 variance = ${explained[0].toFixed(2)}%`,
            explanation: `PC2 variance = ${explained[1].toFixed(2)}%`,
            steps: [`Covariance = ${formatMatrix(covariance)}`, `Eigenvalues = [${eigen.values.map(v => v.toFixed(4)).join(', ')}]`, `Explained variance = [${explained.map(v => v.toFixed(2) + '%').join(', ')}]`],
          };
        },
      },
    };

    return configs[id];
  }

  // DEFAULT GENERIC CALCULATOR
  return {
    title: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Perform mathematical calculations.',
    inputs: [
      { name: 'val1', label: 'Value 1', type: 'number', defaultValue: 10 },
      { name: 'val2', label: 'Value 2', type: 'number', defaultValue: 5 },
      { name: 'operation', label: 'Operation', type: 'select', options: ['Add', 'Subtract', 'Multiply', 'Divide', 'Power'], defaultValue: 'Add' }
    ],
    calculate: (inputs) => {
      const v1 = safeFloat(inputs.val1);
      const v2 = safeFloat(inputs.val2);
      const op = inputs.operation;
      let res = 0;
      let symbol = '+';
      
      if (op === 'Add') { res = v1 + v2; symbol = '+'; }
      else if (op === 'Subtract') { res = v1 - v2; symbol = '-'; }
      else if (op === 'Multiply') { res = v1 * v2; symbol = '×'; }
      else if (op === 'Divide') { 
        if (v2 === 0) return { result: 'Error', explanation: 'Cannot divide by zero' };
        res = v1 / v2; symbol = '÷';
      }
      else if (op === 'Power') { res = Math.pow(v1, v2); symbol = '^'; }
      
      return { 
        result: res.toFixed(4), 
        explanation: `${v1} ${symbol} ${v2}`,
        steps: [`${v1} ${symbol} ${v2} = ${res}`]
      };
    }
  };
};

const getCategoryTheme = () => ({
  gradient: 'from-blue-500/10 via-purple-500/10 to-pink-500/10',
  icon: Binary,
  emoji: '🧮',
  accentColor: 'text-blue-600 dark:text-blue-400'
});

export function GenericMathTool({ id }: { id: string }) {
  if (!id) return <div className="p-8 text-center text-muted-foreground">Calculator configuration not found</div>;
  return <GenericMathToolInner id={id} />;
}

function GenericMathToolInner({ id }: { id: string }) {
  const config = getToolConfig(id);
  const theme = getCategoryTheme();

  const [inputValues, setInputValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    config.inputs.forEach(inp => {
      initial[inp.name] = inp.defaultValue;
    });
    return initial;
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const initial: Record<string, any> = {};
    config.inputs.forEach(inp => {
      initial[inp.name] = inp.defaultValue;
    });
    setInputValues(initial);
    setResult(null);
  }, [id]);

  // Auto-calculate with debounce
  useEffect(() => {
    if (!autoCalculate) return;
    
    const timer = setTimeout(() => {
      handleCalculate();
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValues, autoCalculate]);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = config.calculate(inputValues);
      setResult(res);
      setIsCalculating(false);
    }, 150);
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Result: ${result.result}${result.explanation ? '\nExplanation: ' + result.explanation : ''}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (values: Record<string, any>) => {
    setInputValues({ ...inputValues, ...values });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br ${theme.gradient} p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <theme.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {config.title}
              </h1>
              <p className="text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Preset Scenarios */}
            {config.presetScenarios && config.presetScenarios.length > 0 && (
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Quick Presets</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {config.presetScenarios.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(preset.values)}
                      className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{preset.icon}</div>
                      <div className="text-xs font-medium text-center">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs */}
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
              <div className="space-y-5">
                {config.inputs.map((inp, idx) => (
                  <div key={inp.name} className="space-y-2 animate-in fade-in slide-in-from-left-3 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {inp.label}
                        {inp.helpText && (
                          <div className="group relative">
                            <Lightbulb className="w-4 h-4 text-yellow-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {inp.helpText}
                            </div>
                          </div>
                        )}
                      </label>
                    </div>

                    {inp.type === 'select' ? (
                      <select
                        value={inputValues[inp.name]}
                        onChange={(e) => setInputValues({ ...inputValues, [inp.name]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md"
                      >
                        {inp.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : inp.type === 'slider' ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{inp.min || 0}</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{inputValues[inp.name]}</span>
                          <span>{inp.max || 100}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            value={inputValues[inp.name]}
                            onChange={(e) => setInputValues({ ...inputValues, [inp.name]: parseFloat(e.target.value) })}
                            min={inp.min || 0}
                            max={inp.max || 100}
                            step={inp.step || 1}
                            className="w-full h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                            style={{
                              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((parseFloat(inputValues[inp.name]) - (inp.min || 0)) / ((inp.max || 100) - (inp.min || 0))) * 100}%, rgb(229 231 235) ${((parseFloat(inputValues[inp.name]) - (inp.min || 0)) / ((inp.max || 100) - (inp.min || 0))) * 100}%, rgb(229 231 235) 100%)`
                            }}
                          />
                        </div>
                      </div>
                    ) : inp.type === 'number' ? (
                      <div className="relative">
                        <input
                          type={inp.type}
                          value={inputValues[inp.name]}
                          onChange={(e) => setInputValues({ ...inputValues, [inp.name]: e.target.value })}
                          placeholder={inp.placeholder}
                          min={inp.min}
                          max={inp.max}
                          className="w-full p-3 pr-12 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md"
                        />
                        <VoiceNumberButton
                          label={inp.label}
                          onValueAction={(v) => setInputValues({ ...inputValues, [inp.name]: String(v) })}
                          min={typeof inp.min === 'number' ? inp.min : undefined}
                          max={typeof inp.max === 'number' ? inp.max : undefined}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    ) : (
                      <input
                        type={inp.type}
                        value={inputValues[inp.name]}
                        onChange={(e) => setInputValues({ ...inputValues, [inp.name]: e.target.value })}
                        placeholder={inp.placeholder}
                        min={inp.min}
                        max={inp.max}
                        className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoCalculate}
                    onChange={(e) => setAutoCalculate(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm group-hover:text-blue-600 transition-colors">Auto-calculate</span>
                </label>

                {!autoCalculate && (
                  <button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    Calculate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Main Result */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 backdrop-blur-sm p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Result
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                      title="Copy result"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                    {result.result}
                  </div>
                  {result.explanation && (
                    <div className="text-sm text-muted-foreground mt-2">{result.explanation}</div>
                  )}
                  {result.formula && (
                    <div className="mt-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Formula</div>
                      <div className="text-sm font-mono text-blue-600 dark:text-blue-400">{result.formula}</div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                {result.steps && result.steps.length > 0 && (
                  <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Step-by-Step Solution
                    </h3>
                    <div className="space-y-3">
                      {result.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-right-3 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg text-sm">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {result.tips && result.tips.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 backdrop-blur-sm p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Quick Tips
                    </h3>
                    <ul className="space-y-2">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-right-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Visual Data */}
                {result.visualData && result.visualData.length > 0 && (
                  <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Visual Breakdown
                    </h3>
                    <div className="space-y-3">
                      {result.visualData.map((item, idx) => {
                        const maxVal = Math.max(...result.visualData!.map(d => d.value));
                        const percentage = (item.value / maxVal) * 100;
                        return (
                          <div key={idx} className="animate-in fade-in slide-in-from-left-3 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">{item.value.toFixed(2)}</span>
                            </div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {!result && (
              <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm p-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center animate-in fade-in duration-700">
                <theme.icon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">
                  {autoCalculate ? 'Adjust values to see results' : 'Click Calculate to see results'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
          <SeoContentGenerator 
            title={config.title} 
            description={config.description} 
            categoryName="Mathematics" 
          />
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
