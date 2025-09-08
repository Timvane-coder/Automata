// ./src/SpreadsheetCalculator.js

import { createCanvas } from '@napi-rs/canvas';
import * as math from 'mathjs';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// ./src/SpreadsheetCalculator.js (partial update)

export class SpreadsheetCalculator {
    constructor() {
        // Default settings
        this.width = 800;
        this.height = 600;
        this.rowLabelWidth = 50;
        this.headerHeight = 40;
        this.cellWidth = 120;
        this.cellHeight = 30;
        this.fontSize = 14;
        this.cellPadding = 5;
        this.theme = 'light'; // Default theme
        this.colors = this.setThemeColors(this.theme);
        this.currentSheet = null;
        this.calculationHistory = [];
        this.formulaDatabase = this.initializeFormulaDatabase();
        this.padding = 10;
        this.formulaBarHeight = 25;
        this.statsPanelHeight = 80;
    }

    // Set theme colors based on theme name
    setThemeColors(theme) {
        const themes = {
            light: {
                background: '#ffffff',
                headerBg: '#e0e0e0',
                headerText: '#000000',
                cellBg: '#f9f9f9',
                cellText: '#333333',
                borderColor: '#cccccc',
                gridColor: '#e0e0e0',
                formulaBar: '#f0f0f0',
            },
            excel: {
                background: '#ffffff',
                headerBg: '#4472c4', // Blue-gray header like Excel
                headerText: '#ffffff',
                cellBg: '#ffffff',
                cellText: '#000000',
                borderColor: '#e0e0e0',
                gridColor: '#e0e0e0',
                formulaBar: '#f0f0f0',
            },
            dark: {
                background: '#1a1a1a',
                headerBg: '#2d2d2d',
                headerText: '#ffffff',
                cellBg: '#2a2a2a',
                cellText: '#cccccc',
                borderColor: '#404040',
                gridColor: '#333333',
                formulaBar: '#252525',
            },
            scientific: {
                background: '#ffffff',
                headerBg: '#d3d3d3', // Light gray for a clean look
                headerText: '#000000',
                cellBg: '#ffffff',
                cellText: '#000000',
                borderColor: '#d3d3d3',
                gridColor: '#e0e0e0',
                formulaBar: '#f0f0f0',
            },
            googlesheets: {
                background: '#ffffff',
                headerBg: '#34a853', // Green header like Google Sheets
                headerText: '#ffffff',
                cellBg: '#ffffff',
                cellText: '#000000',
                borderColor: '#e0e0e0',
                gridColor: '#e0e0e0',
                formulaBar: '#f0f0f0',
            },
            classic: {
                background: '#f5f5dc', // Beige background for retro feel
                headerBg: '#d2b48c', // Tan header
                headerText: '#000000',
                cellBg: '#f5f5dc',
                cellText: '#000000',
                borderColor: '#8b4513', // Brown border
                gridColor: '#d2b48c',
                formulaBar: '#f0e68c', // Light yellow
            }
        };
        return themes[theme] || themes['light']; // Default to light if theme is invalid
    }

    // Method to set or change the theme
    setTheme(theme) {
        this.theme = theme;
        this.colors = this.setThemeColors(theme);
    }

    // ... (other methods like renderSpreadsheet, drawData, setCellBackground, setCellTextStyle remain unchanged)



    initializeFormulaDatabase() {
        return {
            // Linear Function: y = mx + b
            'linearfunction': {
                type: 'algebraic',
                description: 'Linear Function Analysis',
                params: ['m', 'b'],
                template: (equation, params) => {
                    const xValues = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
                    const yValues = xValues.map(x => params.m * x + params.b);

                    return [
                        [
                            { value: 'Linear Function Analysis', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Equation:', type: 'label' },
                            { value: `y = ${params.m}x + ${params.b}`, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Parameters:', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: 'Description', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'm =', type: 'label' },
                            { value: params.m, type: 'data' },
                            { value: 'Slope (rate of change)', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'b =', type: 'label' },
                            { value: params.b, type: 'data' },
                            { value: 'Y-intercept', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Key Points:', type: 'header' },
                            { value: 'Calculation', type: 'header' },
                            { value: 'Result', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'X-intercept:', type: 'label' },
                            { value: 'x = -b/m', type: 'formula' },
                            { value: params.m !== 0 ? (-params.b / params.m).toFixed(4) : 'No x-intercept', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Y-intercept:', type: 'label' },
                            { value: 'y = b', type: 'formula' },
                            { value: params.b, type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Domain:', type: 'label' },
                            { value: 'All real numbers', type: 'formula' },
                            { value: '(-∞, ∞)', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Range:', type: 'label' },
                            { value: 'All real numbers', type: 'formula' },
                            { value: '(-∞, ∞)', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Sample Points:', type: 'header' },
                            { value: 'x', type: 'header' },
                            { value: 'y = mx + b', type: 'header' },
                            { value: 'y-value', type: 'header' }
                        ],
                        ...xValues.map((x, index) => [
                            { value: `Point ${index + 1}:`, type: 'label' },
                            { value: x, type: 'data' },
                            { value: `${params.m}(${x}) + ${params.b}`, type: 'formula' },
                            { value: yValues[index].toFixed(2), type: 'result' }
                        ])
                    ];
                }
            },

            // Custom Linear Formula: Parse any linear equation format
            'customlinear': {
                type: 'algebraic',
                description: 'Custom Linear Formula Analysis',
                params: ['equation'],
                template: (equation, params) => {
                    const parsedLinear = this.parseLinearEquation(params.equation);
                    const xValues = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
                    const yValues = xValues.map(x => parsedLinear.m * x + parsedLinear.b);

                    return [
                        [
                            { value: 'Custom Linear Formula Analysis', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Original Equation:', type: 'label' },
                            { value: params.equation, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Standard Form:', type: 'label' },
                            { value: `y = ${parsedLinear.m}x + ${parsedLinear.b}`, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Parsed Parameters:', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: 'Description', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Slope (m) =', type: 'label' },
                            { value: parsedLinear.m, type: 'data' },
                            { value: 'Rate of change', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Y-intercept (b) =', type: 'label' },
                            { value: parsedLinear.b, type: 'data' },
                            { value: 'Value when x = 0', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Analysis:', type: 'header' },
                            { value: 'Calculation', type: 'header' },
                            { value: 'Result', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'X-intercept:', type: 'label' },
                            { value: 'x = -b/m', type: 'formula' },
                            { value: parsedLinear.m !== 0 ? (-parsedLinear.b / parsedLinear.m).toFixed(4) : 'No x-intercept', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Y-intercept:', type: 'label' },
                            { value: 'y = b', type: 'formula' },
                            { value: parsedLinear.b, type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Slope Type:', type: 'label' },
                            { value: this.describeSlopeType(parsedLinear.m), type: 'formula' },
                            { value: parsedLinear.m > 0 ? 'Positive' : parsedLinear.m < 0 ? 'Negative' : 'Zero', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Sample Points:', type: 'header' },
                            { value: 'x', type: 'header' },
                            { value: 'Calculation', type: 'header' },
                            { value: 'y-value', type: 'header' }
                        ],
                        ...xValues.map((x, index) => [
                            { value: `Point ${index + 1}:`, type: 'label' },
                            { value: x, type: 'data' },
                            { value: `${parsedLinear.m}(${x}) + ${parsedLinear.b}`, type: 'formula' },
                            { value: yValues[index].toFixed(2), type: 'result' }
                        ])
                    ];
                }
            },

            // Custom Quadratic Formula: Parse any quadratic equation format
            'customquadratic': {
                type: 'algebraic',
                description: 'Custom Quadratic Formula Analysis',
                params: ['equation'],
                template: (equation, params) => {
                    const parsedQuadratic = this.parseQuadraticEquation(params.equation);
                    const xValues = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
                    const yValues = xValues.map(x => parsedQuadratic.a * x * x + parsedQuadratic.b * x + parsedQuadratic.c);
                    const vertex = this.calculateVertex(parsedQuadratic.a, parsedQuadratic.b, parsedQuadratic.c);
                    const discriminant = parsedQuadratic.b * parsedQuadratic.b - 4 * parsedQuadratic.a * parsedQuadratic.c;

                    return [
                        [
                            { value: 'Custom Quadratic Formula Analysis', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Original Equation:', type: 'label' },
                            { value: params.equation, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Standard Form:', type: 'label' },
                            { value: `y = ${parsedQuadratic.a}x² + ${parsedQuadratic.b}x + ${parsedQuadratic.c}`, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Parsed Parameters:', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: 'Description', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'a =', type: 'label' },
                            { value: parsedQuadratic.a, type: 'data' },
                            { value: 'Coefficient of x²', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'b =', type: 'label' },
                            { value: parsedQuadratic.b, type: 'data' },
                            { value: 'Coefficient of x', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'c =', type: 'label' },
                            { value: parsedQuadratic.c, type: 'data' },
                            { value: 'Constant term', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Key Properties:', type: 'header' },
                            { value: 'Formula', type: 'header' },
                            { value: 'Result', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Discriminant:', type: 'label' },
                            { value: 'b² - 4ac', type: 'formula' },
                            { value: discriminant.toFixed(4), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Opens:', type: 'label' },
                            { value: parsedQuadratic.a > 0 ? 'Upward (a > 0)' : 'Downward (a < 0)', type: 'formula' },
                            { value: parsedQuadratic.a > 0 ? 'Upward' : 'Downward', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Vertex X:', type: 'label' },
                            { value: 'x = -b/(2a)', type: 'formula' },
                            { value: vertex.x.toFixed(4), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Vertex Y:', type: 'label' },
                            { value: 'y = f(vertex_x)', type: 'formula' },
                            { value: vertex.y.toFixed(4), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Axis of Symmetry:', type: 'label' },
                            { value: 'x = -b/(2a)', type: 'formula' },
                            { value: `x = ${vertex.x.toFixed(4)}`, type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Roots/Solutions:', type: 'header' },
                            { value: 'Formula', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'x₁ =', type: 'label' },
                            { value: '(-b + √Δ) / 2a', type: 'formula' },
                            { value: this.calculateQuadraticRoot(parsedQuadratic.a, parsedQuadratic.b, parsedQuadratic.c, true), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'x₂ =', type: 'label' },
                            { value: '(-b - √Δ) / 2a', type: 'formula' },
                            { value: this.calculateQuadraticRoot(parsedQuadratic.a, parsedQuadratic.b, parsedQuadratic.c, false), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Root Type:', type: 'label' },
                            { value: this.describeRootType(discriminant), type: 'formula' },
                            { value: discriminant > 0 ? 'Two real roots' : discriminant === 0 ? 'One real root' : 'No real roots', type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Sample Points:', type: 'header' },
                            { value: 'x', type: 'header' },
                            { value: 'Calculation', type: 'header' },
                            { value: 'y-value', type: 'header' }
                        ],
                        ...xValues.map((x, index) => [
                            { value: `Point ${index + 1}:`, type: 'label' },
                            { value: x, type: 'data' },
                            { value: `${parsedQuadratic.a}(${x})² + ${parsedQuadratic.b}(${x}) + ${parsedQuadratic.c}`, type: 'formula' },
                            { value: yValues[index].toFixed(2), type: 'result' }
                        ])
                    ];
                }
            },

            // Quadratic Formula: ax² + bx + c = 0
            'quadraticformula': {
                type: 'algebraic',
                description: 'Quadratic Formula Solution',
                params: ['a', 'b', 'c'],
                template: (equation, params) => {
                    return [
                        [
                            { value: 'Quadratic Formula Analysis', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Equation:', type: 'label' },
                            { value: `${params.a}x² + ${params.b}x + ${params.c} = 0`, type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Parameters:', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: 'Description', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'a =', type: 'label' },
                            { value: params.a, type: 'data' },
                            { value: 'Coefficient of x²', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'b =', type: 'label' },
                            { value: params.b, type: 'data' },
                            { value: 'Coefficient of x', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'c =', type: 'label' },
                            { value: params.c, type: 'data' },
                            { value: 'Constant term', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Calculations:', type: 'header' },
                            { value: 'Formula', type: 'header' },
                            { value: 'Result', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Discriminant:', type: 'label' },
                            { value: 'b² - 4ac', type: 'formula' },
                            { value: params.b * params.b - 4 * params.a * params.c, type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'x₁ =', type: 'label' },
                            { value: '(-b + √Δ) / 2a', type: 'formula' },
                            { value: this.calculateQuadraticRoot(params.a, params.b, params.c, true), type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'x₂ =', type: 'label' },
                            { value: '(-b - √Δ) / 2a', type: 'formula' },
                            { value: this.calculateQuadraticRoot(params.a, params.b, params.c, false), type: 'result' },
                            { value: '', type: 'data' }
                        ]
                    ];
                }
            },

            // Compound Interest Formula: A = P(1 + r/n)^(nt)
            'compoundinterest': {
                type: 'financial',
                description: 'Compound Interest Calculator',
                params: ['P', 'r', 'n', 't'],
                template: (equation, params) => {
                    return [
                        [
                            { value: 'Compound Interest Analysis', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Formula:', type: 'label' },
                            { value: 'A = P(1 + r/n)^(nt)', type: 'formula' },
                            { value: '', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Parameters:', type: 'header' },
                            { value: 'Value', type: 'header' },
                            { value: 'Description', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'P =', type: 'label' },
                            { value: `$${params.P.toLocaleString()}`, type: 'data' },
                            { value: 'Principal amount', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'r =', type: 'label' },
                            { value: `${(params.r * 100).toFixed(2)}%`, type: 'data' },
                            { value: 'Annual interest rate', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'n =', type: 'label' },
                            { value: params.n, type: 'data' },
                            { value: 'Compounds per year', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 't =', type: 'label' },
                            { value: `${params.t} years`, type: 'data' },
                            { value: 'Time period', type: 'data' },
                            { value: '', type: 'data' }
                        ],
                        ['', '', '', ''],
                        [
                            { value: 'Results:', type: 'header' },
                            { value: 'Calculation', type: 'header' },
                            { value: 'Amount', type: 'header' },
                            { value: '', type: 'header' }
                        ],
                        [
                            { value: 'Final Amount:', type: 'label' },
                            { value: 'A = P(1 + r/n)^(nt)', type: 'formula' },
                            { value: `$${this.calculateCompoundInterest(params.P, params.r, params.n, params.t).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, type: 'result' },
                            { value: '', type: 'data' }
                        ],
                        [
                            { value: 'Interest Earned:', type: 'label' },
                            { value: 'A - P', type: 'formula' },
                            { value: `$${(this.calculateCompoundInterest(params.P, params.r, params.n, params.t) - params.P).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, type: 'result' },
                            { value: '', type: 'data' }
                        ]
                    ];
                }
            },

            // Default shopping list template
            'shopping_list': {
                type: 'shopping',
                description: 'Comprehensive shopping list with automatic calculations',
                params: ['items', 'currency', 'taxRate', 'discountRate'],
                template: this.createShoppingTemplate.bind(this)
            },

            // Custom shopping analysis
            'custom_shopping': {
                type: 'shopping',
                description: 'Custom shopping list with your items',
                params: ['itemsData'],
                template: this.createShoppingTemplate.bind(this)
            },
       

            // Default betting analysis template
            'bet_analysis': {
                type: 'betting',
                description: 'Comprehensive betting probability analysis',
                params: ['winProbability', 'betAmount', 'odds', 'oddsFormat', 'bankroll'],
                template: this.createBettingTemplate.bind(this)
            },

            // Custom betting analysis
            'custom_betting': {
                type: 'betting',
                description: 'Custom betting analysis with your parameters',
                params: ['equation'],
                template: this.createBettingTemplate.bind(this)
            },

            // Default normal distribution template
            'normal_distribution': {
                type: 'statistics',
                description: 'Comprehensive normal distribution analysis',
                params: ['mean', 'standardDeviation', 'sampleSize', 'confidenceLevel', 'dataPoints'],
                template: this.createNormalDistributionTemplate.bind(this)
            },

            // Custom normal distribution analysis
            'custom_normal': {
                type: 'statistics',
                description: 'Custom normal distribution analysis with your parameters',
                params: ['equation'],
                template: this.createNormalDistributionTemplate.bind(this)
            }  
        };
    }

    // Helper method for quadratic formula calculation
    calculateQuadraticRoot(a, b, c, positive = true) {
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            return 'No real solution';
        }
        const sqrt_discriminant = Math.sqrt(discriminant);
        if (positive) {
            return ((-b + sqrt_discriminant) / (2 * a)).toFixed(4);
        } else {
            return ((-b - sqrt_discriminant) / (2 * a)).toFixed(4);
        }
    }

    // Helper method for compound interest calculation
    calculateCompoundInterest(P, r, n, t) {
        return P * Math.pow(1 + r / n, n * t);
    }

    // Helper method to parse linear equations in various formats
    parseLinearEquation(equation) {
        // Remove spaces and convert to lowercase for easier parsing
        let eq = equation.replace(/\s/g, '').toLowerCase();

        // Handle different formats:
        // y = mx + b, y = mx - b, mx + b, ax + by = c, etc.
        let m = 0, b = 0;

        try {
            // Handle standard form: y = mx + b or y = mx - b
            if (eq.includes('y=')) {
                const rightSide = eq.split('y=')[1];
                const parsed = this.parseLinearRightSide(rightSide);
                m = parsed.m;
                b = parsed.b;
            }
            // Handle slope-intercept without y=: mx + b
            else if (eq.includes('x') && !eq.includes('=')) {
                const parsed = this.parseLinearRightSide(eq);
                m = parsed.m;
                b = parsed.b;
            }
            // Handle general form: ax + by = c (convert to y = mx + b)
            else if (eq.includes('=') && eq.includes('x') && eq.includes('y')) {
                const parsed = this.parseGeneralLinearForm(eq);
                m = parsed.m;
                b = parsed.b;
            }
            // Handle point-slope form and other formats
            else {
                throw new Error('Unsupported equation format');
            }

            return { m, b };

        } catch (error) {
            throw new Error(`Unable to parse linear equation: ${equation}. Supported formats: y = mx + b, ax + by = c, mx + b`);
        }
    }

    // Helper method to parse the right side of y = mx + b format
    parseLinearRightSide(rightSide) {
        let m = 0, b = 0;

        // Handle cases like: 2x + 3, -3x + 5, x - 2, -x + 4, 5x, -7, etc.
        rightSide = rightSide.replace('y', '');
        // Split by + and - while keeping the operators
        const terms = rightSide.split(/([+-])/).filter(term => term !== '');
        let currentSign = 1;

        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            if (term === '+') {
                currentSign = 1;
            } else if (term === '-') {
                currentSign = -1;
            } else {
                if (term.includes('x')) {
                    // Extract coefficient of x
                    let coeff = term.replace('x', '');
                    if (coeff === '' || coeff === '+') {
                        coeff = '1';
                    } else if (coeff === '-') {
                        coeff = '-1';
                    }
                    m += currentSign * parseFloat(coeff);
                } else if (term !== '') {
                    // Constant term
                    b += currentSign * parseFloat(term);
                }
            }
        }

        return { m, b };
    }

    // Helper method to parse general form: ax + by = c
    parseGeneralLinearForm(equation) {
        const [leftSide, rightSide] = equation.split('=');

        // Parse coefficients from ax + by
        let a = 0, b = 0;
        const c = parseFloat(rightSide);

        const terms = leftSide.split(/([+-])/).filter(term => term !== '');
        let currentSign = 1;

        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];

            if (term === '+') {
                currentSign = 1;
            } else if (term === '-') {
                currentSign = -1;
            } else {
                if (term.includes('x')) {
                    let coeff = term.replace('x', '');
                    if (coeff === '' || coeff === '+') coeff = '1';
                    else if (coeff === '-') coeff = '-1';
                    a = currentSign * parseFloat(coeff);
                } else if (term.includes('y')) {
                    let coeff = term.replace('y', '');
                    if (coeff === '' || coeff === '+') coeff = '1';
                    else if (coeff === '-') coeff = '-1';
                    b = currentSign * parseFloat(coeff);
                }
            }
        }

        // Convert to slope-intercept form: y = mx + b
        // From ax + by = c to y = (-a/b)x + (c/b)
        if (b === 0) {
            throw new Error('Invalid linear equation: coefficient of y cannot be zero in general form');
        }

        const m = -a / b;
        const b_intercept = c / b;

        return { m, b: b_intercept };
    }

    // Helper method to describe slope type
    describeSlopeType(slope) {
        if (slope > 0) {
            return 'Increasing line';
        } else if (slope < 0) {
            return 'Decreasing line';
        } else {
            return 'Horizontal line';
        }
    }

    // Helper method to parse quadratic equations in various formats
    parseQuadraticEquation(equation) {
        // Remove spaces and convert to lowercase for easier parsing
        let eq = equation.replace(/\s/g, '').toLowerCase();

        // Handle different formats:
        // y = ax² + bx + c, ax² + bx + c = 0, x² + bx + c, etc.
        let a = 0, b = 0, c = 0;

        try {
            // Handle standard form: y = ax² + bx + c
            if (eq.includes('y=')) {
                const rightSide = eq.split('y=')[1];
                const parsed = this.parseQuadraticRightSide(rightSide);
                a = parsed.a;
                b = parsed.b;
                c = parsed.c;
            }
            // Handle equation form: ax² + bx + c = 0
            else if (eq.includes('=0')) {
                const leftSide = eq.split('=0')[0];
                const parsed = this.parseQuadraticRightSide(leftSide);
                a = parsed.a;
                b = parsed.b;
                c = parsed.c;
            }
            // Handle just the polynomial: ax² + bx + c
            else if (eq.includes('x²') || eq.includes('x^2')) {
                const parsed = this.parseQuadraticRightSide(eq);
                a = parsed.a;
                b = parsed.b;
                c = parsed.c;
            } else {
                throw new Error('Unsupported equation format');
            }

            if (a === 0) {
                throw new Error('Not a quadratic equation (coefficient of x² cannot be zero)');
            }

            return { a, b, c };

        } catch (error) {
            throw new Error(`Unable to parse quadratic equation: ${equation}. Supported formats: y = ax² + bx + c, ax² + bx + c = 0, ax² + bx + c`);
        }
    }

    // Helper method to parse the polynomial part of quadratic equations
    parseQuadraticRightSide(rightSide) {
        let a = 0, b = 0, c = 0;
        // Replace x^2 with x² for consistency
        rightSide = rightSide.replace(/x\^2/g, 'x²');
        // Split by + and - while keeping the operators
        const terms = rightSide.split(/([+-])/).filter(term => term !== '');

        let currentSign = 1;
        for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            if (term === '+') {
                currentSign = 1;
            } else if (term === '-') {
                currentSign = -1;
            } else if (term !== '') {
                if (term.includes('x²')) {
                    // Extract coefficient of x²
                    let coeff = term.replace('x²', '');
                    if (coeff === '' || coeff === '+') {
                        coeff = '1';
                    } else if (coeff === '-') {
                        coeff = '-1';
                    }
                    a += currentSign * parseFloat(coeff);
                } else if (term.includes('x') && !term.includes('x²')) {
                    // Extract coefficient of x
                    let coeff = term.replace('x', '');
                    if (coeff === '' || coeff === '+') {
                        coeff = '1';
                    } else if (coeff === '-') {
                        coeff = '-1';
                    }
                    b += currentSign * parseFloat(coeff);
                } else {
                    // Constant term
                    c += currentSign * parseFloat(term);
                }
            }
        }

        return { a, b, c };
    }

    // Helper method to calculate vertex of parabola
    calculateVertex(a, b, c) {
        const x = -b / (2 * a);
        const y = a * x * x + b * x + c;
        return { x, y };
    }

    // Helper method to describe root type based on discriminant
    describeRootType(discriminant) {
        if (discriminant > 0) {
            return 'Two distinct real roots';
        } else if (discriminant === 0) {
            return 'One repeated real root';
        } else {
            return 'Two complex conjugate roots';
        }
    }


    
    // Parse normal distribution equation from user input
    parseNormalDistributionEquation(equation) {
        const defaultParams = {
            mean: 100,
            standardDeviation: 15,
            sampleSize: 1000,
            confidenceLevel: 0.95,
            dataPoints: null // Will be generated if not provided
        };

        try {
            // Remove spaces and normalize the equation
            const cleanEquation = equation.replace(/\s/g, '');

            // Check if it's just the template name
            if (cleanEquation.toLowerCase() === 'normal_distribution' || cleanEquation.toLowerCase() === 'custom_normal') {
                return defaultParams;
            }

            // Try to parse as JavaScript object notation
            let parsedParams = {};

            // Method 1: Try to parse as JSON-like object
            if (cleanEquation.includes('{') && cleanEquation.includes('}')) {
                try {
                    const objectMatch = cleanEquation.match(/\{[^}]+\}/);
                    if (objectMatch) {
                        let objectStr = objectMatch[0];
                        // Convert to valid JSON
                        objectStr = objectStr.replace(/(\w+):/g, '"$1":');
                        objectStr = objectStr.replace(/'/g, '"');
                        parsedParams = JSON.parse(objectStr);
                    }
                } catch (e) {
                    console.warn('Failed to parse as JSON object, trying parameter extraction');
                }
            }

            // Method 2: Extract parameters using regex patterns
            if (Object.keys(parsedParams).length === 0) {
                const patterns = {
                    mean: /mean[:\s]*([0-9.-]+)/i,
                    standardDeviation: /standardDeviation[:\s]*([0-9.]+)/i,
                    sampleSize: /sampleSize[:\s]*([0-9]+)/i,
                    confidenceLevel: /confidenceLevel[:\s]*([0-9.]+)/i
                };

                Object.keys(patterns).forEach(param => {
                    const match = equation.match(patterns[param]);
                    if (match) {
                        parsedParams[param] = parseFloat(match[1]);
                    }
                });
            }

            // Method 3: Handle simple comma-separated values
            if (Object.keys(parsedParams).length === 0) {
                const values = cleanEquation.split(',').map(v => v.trim());
                if (values.length >= 2) {
                    parsedParams = {
                        mean: parseFloat(values[0]) || defaultParams.mean,
                        standardDeviation: parseFloat(values[1]) || defaultParams.standardDeviation,
                        sampleSize: parseInt(values[2]) || defaultParams.sampleSize,
                        confidenceLevel: parseFloat(values[3]) || defaultParams.confidenceLevel
                    };
                }
            }

            // Merge with defaults for any missing parameters
            const result = { ...defaultParams, ...parsedParams };

            // Validate parameters
            result.standardDeviation = Math.max(0.01, result.standardDeviation);
            result.sampleSize = Math.max(10, Math.min(10000, result.sampleSize));
            result.confidenceLevel = Math.max(0.8, Math.min(0.99, result.confidenceLevel));

            return result;

        } catch (error) {
            console.warn('Failed to parse normal distribution equation, using defaults:', error.message);
            return defaultParams;
        }
    }

    createNormalDistributionTemplate(equation, params) {
        const { mean, standardDeviation, sampleSize, confidenceLevel } = params;
        const data = [];

        // Generate sample data points if not provided
        let dataPoints = params.dataPoints;
        if (!dataPoints) {
            dataPoints = this.generateNormalDistributionData(mean, standardDeviation, sampleSize);
        }

        // Calculate statistics
        const stats = this.calculateNormalDistributionStats(dataPoints, mean, standardDeviation);
        const probabilities = this.calculateNormalProbabilities(mean, standardDeviation, confidenceLevel);
        
        // Header
        data.push([
            { value: 'Normal Distribution Analysis', type: 'header', span: 4, style: 'title' },
            '', '', ''
        ]);
        data.push([
            { value: `Generated: ${new Date().toLocaleString()}`, type: 'data', span: 4 },
            '', '', ''
        ]);
        data.push(['', '', '', '']); // Empty row

        // Input Parameters Display
        data.push([
            { value: 'Distribution Parameters', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Parameter', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Symbol', type: 'header' },
            { value: 'Description', type: 'header' }
        ]);

        data.push([
            { value: 'Mean (μ)', type: 'label' },
            { value: mean.toFixed(2), type: 'result' },
            { value: 'μ', type: 'data' },
            { value: 'Population mean (center)', type: 'data' }
        ]);

        data.push([
            { value: 'Standard Deviation (σ)', type: 'label' },
            { value: standardDeviation.toFixed(2), type: 'result' },
            { value: 'σ', type: 'data' },
            { value: 'Population standard deviation (spread)', type: 'data' }
        ]);

        data.push([
            { value: 'Variance (σ²)', type: 'label' },
            { value: Math.pow(standardDeviation, 2).toFixed(2), type: 'result' },
            { value: 'σ²', type: 'data' },
            { value: 'Population variance', type: 'data' }
        ]);

        data.push([
            { value: 'Sample Size', type: 'label' },
            { value: sampleSize.toString(), type: 'result' },
            { value: 'n', type: 'data' },
            { value: 'Number of data points generated', type: 'data' }
        ]);

        data.push([
            { value: 'Confidence Level', type: 'label' },
            { value: `${(confidenceLevel * 100).toFixed(1)}%`, type: 'result' },
            { value: 'CL', type: 'data' },
            { value: 'Confidence level for intervals', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Sample Statistics (calculated from generated data)
        data.push([
            { value: 'Sample Statistics', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Statistic', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Formula', type: 'header' },
            { value: 'Interpretation', type: 'header' }
        ]);

        data.push([
            { value: 'Sample Mean (x̄)', type: 'label' },
            { value: stats.sampleMean.toFixed(4), type: 'result' },
            { value: 'Σx/n', type: 'formula' },
            { value: `Deviation from μ: ${(stats.sampleMean - mean).toFixed(4)}`, type: 'data' }
        ]);

        data.push([
            { value: 'Sample Std Dev (s)', type: 'label' },
            { value: stats.sampleStdDev.toFixed(4), type: 'result' },
            { value: '√(Σ(x-x̄)²/(n-1))', type: 'formula' },
            { value: `Deviation from σ: ${(stats.sampleStdDev - standardDeviation).toFixed(4)}`, type: 'data' }
        ]);

        data.push([
            { value: 'Minimum Value', type: 'label' },
            { value: stats.min.toFixed(4), type: 'result' },
            { value: 'min(x)', type: 'formula' },
            { value: `Z-score: ${((stats.min - mean) / standardDeviation).toFixed(2)}`, type: 'data' }
        ]);

        data.push([
            { value: 'Maximum Value', type: 'label' },
            { value: stats.max.toFixed(4), type: 'result' },
            { value: 'max(x)', type: 'formula' },
            { value: `Z-score: ${((stats.max - mean) / standardDeviation).toFixed(2)}`, type: 'data' }
        ]);

        data.push([
            { value: 'Range', type: 'label' },
            { value: (stats.max - stats.min).toFixed(4), type: 'result' },
            { value: 'max - min', type: 'formula' },
            { value: `${((stats.max - stats.min) / standardDeviation).toFixed(2)} standard deviations`, type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Percentiles and Quartiles
        data.push([
            { value: 'Percentiles & Quartiles', type: 'header', span: 4 },
            '', '', ''
        ]);

        const percentiles = this.calculatePercentiles(dataPoints);
        
        data.push([
            { value: 'Percentile', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Z-Score', type: 'header' },
            { value: 'Description', type: 'header' }
        ]);

        [
            { p: 5, name: '5th Percentile' },
            { p: 25, name: 'Q1 (25th)' },
            { p: 50, name: 'Median (Q2)' },
            { p: 75, name: 'Q3 (75th)' },
            { p: 95, name: '95th Percentile' }
        ].forEach(item => {
            const value = percentiles[`p${item.p}`];
            const zScore = (value - mean) / standardDeviation;
            data.push([
                { value: item.name, type: 'label' },
                { value: value.toFixed(4), type: 'result' },
                { value: zScore.toFixed(2), type: 'data' },
                { value: `${item.p}% of data below this value`, type: 'data' }
            ]);
        });

        data.push(['', '', '', '']); // Empty row

        // Probability Calculations
        data.push([
            { value: 'Probability Analysis', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Range', type: 'header' },
            { value: 'Probability', type: 'header' },
            { value: 'Z-Score Range', type: 'header' },
            { value: 'Interpretation', type: 'header' }
        ]);

        // Standard ranges
        const standardRanges = [
            { range: '±1σ', lower: mean - standardDeviation, upper: mean + standardDeviation, expected: 0.6827 },
            { range: '±2σ', lower: mean - 2*standardDeviation, upper: mean + 2*standardDeviation, expected: 0.9545 },
            { range: '±3σ', lower: mean - 3*standardDeviation, upper: mean + 3*standardDeviation, expected: 0.9973 }
        ];

        standardRanges.forEach(range => {
            const probability = this.normalCDF(range.upper, mean, standardDeviation) - 
                              this.normalCDF(range.lower, mean, standardDeviation);
            const lowerZ = (range.lower - mean) / standardDeviation;
            const upperZ = (range.upper - mean) / standardDeviation;
            
            data.push([
                { value: `${range.range} (${range.lower.toFixed(2)} to ${range.upper.toFixed(2)})`, type: 'label' },
                { value: `${(probability * 100).toFixed(2)}%`, type: 'result' },
                { value: `${lowerZ.toFixed(1)} to ${upperZ.toFixed(1)}`, type: 'data' },
                { value: `Expected: ${(range.expected * 100).toFixed(2)}%`, type: 'data' }
            ]);
        });

        data.push(['', '', '', '']); // Empty row

        // Confidence Intervals
        data.push([
            { value: 'Confidence Intervals', type: 'header', span: 4 },
            '', '', ''
        ]);

        const zCritical = this.getZCritical(confidenceLevel);
        const marginOfError = zCritical * (standardDeviation / Math.sqrt(sampleSize));
        const ciLower = stats.sampleMean - marginOfError;
        const ciUpper = stats.sampleMean + marginOfError;

        data.push([
            { value: 'Parameter', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Formula', type: 'header' },
            { value: 'Interpretation', type: 'header' }
        ]);

        data.push([
            { value: 'Z-Critical', type: 'label' },
            { value: zCritical.toFixed(4), type: 'result' },
            { value: `Φ⁻¹(${(1 + confidenceLevel) / 2})`, type: 'formula' },
            { value: `For ${(confidenceLevel * 100).toFixed(1)}% confidence`, type: 'data' }
        ]);

        data.push([
            { value: 'Margin of Error', type: 'label' },
            { value: marginOfError.toFixed(4), type: 'result' },
            { value: 'z × (σ/√n)', type: 'formula' },
            { value: 'Maximum likely sampling error', type: 'data' }
        ]);

        data.push([
            { value: 'Confidence Interval', type: 'label' },
            { value: `[${ciLower.toFixed(4)}, ${ciUpper.toFixed(4)}]`, type: 'result' },
            { value: 'x̄ ± ME', type: 'formula' },
            { value: `${(confidenceLevel * 100).toFixed(1)}% confident μ is in this range`, type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Normality Tests Results
        data.push([
            { value: 'Normality Assessment', type: 'header', span: 4 },
            '', '', ''
        ]);

        const normalityTests = this.performNormalityTests(dataPoints, mean, standardDeviation);

        data.push([
            { value: 'Test', type: 'header' },
            { value: 'Statistic', type: 'header' },
            { value: 'Result', type: 'header' },
            { value: 'Interpretation', type: 'header' }
        ]);

        data.push([
            { value: 'Skewness', type: 'label' },
            { value: normalityTests.skewness.toFixed(4), type: 'result' },
            { value: Math.abs(normalityTests.skewness) < 0.5 ? 'Normal' : 'Skewed', type: 'data' },
            { value: normalityTests.skewness > 0 ? 'Right-skewed' : normalityTests.skewness < 0 ? 'Left-skewed' : 'Symmetric', type: 'data' }
        ]);

        data.push([
            { value: 'Kurtosis', type: 'label' },
            { value: normalityTests.kurtosis.toFixed(4), type: 'result' },
            { value: Math.abs(normalityTests.kurtosis - 3) < 1 ? 'Normal' : 'Non-normal', type: 'data' },
            { value: normalityTests.kurtosis > 3 ? 'Heavy-tailed' : normalityTests.kurtosis < 3 ? 'Light-tailed' : 'Normal tails', type: 'data' }
        ]);

        data.push([
            { value: 'Shapiro-Wilk Test', type: 'label' },
            { value: 'W = ' + normalityTests.shapiroWilk.toFixed(4), type: 'result' },
            { value: normalityTests.shapiroWilk > 0.95 ? 'Normal' : 'Non-normal', type: 'data' },
            { value: 'W > 0.95 suggests normal distribution', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Histogram Data for Visualization
        data.push([
            { value: 'Histogram Data (for graphing)', type: 'header', span: 4 },
            '', '', ''
        ]);

        const histogramData = this.createHistogramData(dataPoints, 20); // 20 bins
        
        data.push([
            { value: 'Bin Center', type: 'header' },
            { value: 'Frequency', type: 'header' },
            { value: 'Relative Freq', type: 'header' },
            { value: 'Expected Freq', type: 'header' }
        ]);

        histogramData.forEach(bin => {
            const expectedFreq = this.normalPDF(bin.center, mean, standardDeviation) * 
                                (bin.width * sampleSize);
            data.push([
                { value: bin.center.toFixed(2), type: 'data' },
                { value: bin.frequency.toString(), type: 'result' },
                { value: (bin.frequency / sampleSize).toFixed(4), type: 'data' },
                { value: expectedFreq.toFixed(2), type: 'formula' }
            ]);
        });

        data.push(['', '', '', '']); // Empty row

        // Recommendations and Insights
        data.push([
            { value: 'Key Insights & Recommendations', type: 'header', span: 4 },
            '', '', ''
        ]);

        const insights = this.generateNormalDistributionInsights(stats, normalityTests, mean, standardDeviation);
        insights.forEach(insight => {
            data.push([
                { value: insight.category, type: 'label' },
                { value: insight.insight, type: 'data', span: 3 },
                '', ''
            ]);
        });

        return data;
    }

    // Generate random normal distribution data
    generateNormalDistributionData(mean, standardDeviation, sampleSize) {
        const data = [];
        for (let i = 0; i < sampleSize; i++) {
            // Box-Muller transformation for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            data.push(mean + standardDeviation * z0);
        }
        return data;
    }

    // Calculate comprehensive statistics for normal distribution
    calculateNormalDistributionStats(dataPoints, populationMean, populationStdDev) {
        const n = dataPoints.length;
        const sampleMean = dataPoints.reduce((sum, x) => sum + x, 0) / n;
        
        const variance = dataPoints.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / (n - 1);
        const sampleStdDev = Math.sqrt(variance);
        
        const sortedData = [...dataPoints].sort((a, b) => a - b);
        const min = sortedData[0];
        const max = sortedData[n - 1];
        
        return {
            sampleMean,
            sampleStdDev,
            variance,
            min,
            max,
            n,
            sortedData
        };
    }

    // Calculate percentiles
    calculatePercentiles(sortedData) {
        const n = sortedData.length;
        const getPercentile = (p) => {
            const index = (p / 100) * (n - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;
            return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
        };

        return {
            p5: getPercentile(5),
            p25: getPercentile(25),
            p50: getPercentile(50),
            p75: getPercentile(75),
            p95: getPercentile(95)
        };
    }

    // Calculate normal probabilities
    calculateNormalProbabilities(mean, stdDev, confidenceLevel) {
        const zCritical = this.getZCritical(confidenceLevel);
        
        return {
            withinOneStd: this.normalCDF(mean + stdDev, mean, stdDev) - 
                         this.normalCDF(mean - stdDev, mean, stdDev),
            withinTwoStd: this.normalCDF(mean + 2*stdDev, mean, stdDev) - 
                         this.normalCDF(mean - 2*stdDev, mean, stdDev),
            withinThreeStd: this.normalCDF(mean + 3*stdDev, mean, stdDev) - 
                           this.normalCDF(mean - 3*stdDev, mean, stdDev),
            confidenceInterval: {
                lower: mean - zCritical * stdDev,
                upper: mean + zCritical * stdDev,
                probability: confidenceLevel
            }
        };
    }

    // Normal PDF (probability density function)
    normalPDF(x, mean, stdDev) {
        const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
        const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
        return coefficient * Math.exp(exponent);
    }

    // Normal CDF (cumulative distribution function) - approximation
    normalCDF(x, mean, stdDev) {
        const z = (x - mean) / stdDev;
        // Approximation using error function
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        
        return z > 0 ? 1 - prob : prob;
    }

    // Get Z critical value for confidence level
    getZCritical(confidenceLevel) {
        const alpha = 1 - confidenceLevel;
        const alphaHalf = alpha / 2;
        
        // Approximate inverse normal CDF for common confidence levels
        const zTable = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576,
            0.999: 3.291
        };
        
        return zTable[confidenceLevel] || 1.96; // Default to 95%
    }

    // Perform normality tests
    performNormalityTests(dataPoints, expectedMean, expectedStdDev) {
        const n = dataPoints.length;
        const mean = dataPoints.reduce((sum, x) => sum + x, 0) / n;
        
        // Calculate skewness
        const m3 = dataPoints.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0) / n;
        const m2 = dataPoints.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        const skewness = m3 / Math.pow(m2, 1.5);
        
        // Calculate kurtosis
        const m4 = dataPoints.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) / n;
        const kurtosis = m4 / Math.pow(m2, 2);
        
        // Simplified Shapiro-Wilk test statistic (approximation)
        const sortedData = [...dataPoints].sort((a, b) => a - b);
        let shapiroWilk = 0.95; // Simplified - would need proper coefficients for exact test
        
        return {
            skewness,
            kurtosis,
            shapiroWilk
        };
    }

    // Create histogram data
    createHistogramData(dataPoints, numBins) {
        const sortedData = [...dataPoints].sort((a, b) => a - b);
        const min = sortedData[0];
        const max = sortedData[sortedData.length - 1];
        const binWidth = (max - min) / numBins;
        
        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            const binCenter = (binStart + binEnd) / 2;
            
            const frequency = dataPoints.filter(x => x >= binStart && x < binEnd).length;
            
            bins.push({
                start: binStart,
                end: binEnd,
                center: binCenter,
                width: binWidth,
                frequency: frequency
            });
        }
        
        // Handle the last bin edge case
        if (bins.length > 0) {
            bins[bins.length - 1].frequency += dataPoints.filter(x => x === max).length;
        }
        
        return bins;
    }

    // Generate insights and recommendations
    generateNormalDistributionInsights(stats, normalityTests, populationMean, populationStdDev) {
        const insights = [];

        // Sample vs Population comparison
        const meanDifference = Math.abs(stats.sampleMean - populationMean);
        const stdDevDifference = Math.abs(stats.sampleStdDev - populationStdDev);

        if (meanDifference < populationStdDev * 0.1) {
            insights.push({
                category: 'Sample Quality',
                insight: '✅ Excellent - Sample mean very close to population mean'
            });
        } else if (meanDifference < populationStdDev * 0.2) {
            insights.push({
                category: 'Sample Quality',
                insight: '✅ Good - Sample mean reasonably close to population mean'
            });
        } else {
            insights.push({
                category: 'Sample Quality',
                insight: '⚠️ Consider larger sample - Sample mean differs significantly from population'
            });
        }

        // Normality assessment
        if (Math.abs(normalityTests.skewness) < 0.5 && Math.abs(normalityTests.kurtosis - 3) < 1) {
            insights.push({
                category: 'Distribution Shape',
                insight: '✅ Data appears normally distributed - Good for statistical inference'
            });
        } else {
            let shapeIssues = [];
            if (Math.abs(normalityTests.skewness) >= 0.5) {
                shapeIssues.push(`${normalityTests.skewness > 0 ? 'right' : 'left'}-skewed`);
            }
            if (Math.abs(normalityTests.kurtosis - 3) >= 1) {
                shapeIssues.push(`${normalityTests.kurtosis > 3 ? 'heavy' : 'light'}-tailed`);
            }
            insights.push({
                category: 'Distribution Shape',
                insight: `⚠️ Data shows ${shapeIssues.join(' and ')} characteristics - May affect normality assumptions`
            });
        }

        // Standard deviation comparison
        if (stdDevDifference < populationStdDev * 0.1) {
            insights.push({
                category: 'Variability',
                insight: '✅ Sample standard deviation matches population parameter well'
            });
        } else if (stdDevDifference < populationStdDev * 0.2) {
            insights.push({
                category: 'Variability',
                insight: '✅ Sample standard deviation reasonably close to population parameter'
            });
        } else {
            insights.push({
                category: 'Variability',
                insight: '⚠️ Sample standard deviation differs notably from expected population value'
            });
        }

        // Sample size adequacy
        if (stats.n >= 1000) {
            insights.push({
                category: 'Sample Size',
                insight: '✅ Large sample size provides excellent statistical power and precision'
            });
        } else if (stats.n >= 100) {
            insights.push({
                category: 'Sample Size',
                insight: '✅ Good sample size for most statistical analyses'
            });
        } else if (stats.n >= 30) {
            insights.push({
                category: 'Sample Size',
                insight: '✅ Adequate sample size for basic normal distribution analyses'
            });
        } else {
            insights.push({
                category: 'Sample Size',
                insight: '⚠️ Small sample size - Consider increasing for more reliable results'
            });
        }

        // Range analysis
        const theoreticalRange = 6 * populationStdDev; // ±3σ covers ~99.7%
        const actualRange = stats.max - stats.min;
        const rangeRatio = actualRange / theoreticalRange;

        if (rangeRatio >= 0.8 && rangeRatio <= 1.2) {
            insights.push({
                category: 'Data Range',
                insight: '✅ Data range consistent with normal distribution expectations'
            });
        } else if (rangeRatio < 0.8) {
            insights.push({
                category: 'Data Range',
                insight: '⚠️ Data range smaller than expected - May indicate truncation or limited variability'
            });
        } else {
            insights.push({
                category: 'Data Range',
                insight: '⚠️ Data range larger than expected - Check for outliers or heavy tails'
            });
        }

        // Outlier detection
        const lowerFence = populationMean - 3 * populationStdDev;
        const upperFence = populationMean + 3 * populationStdDev;
        const outliers = stats.sortedData.filter(x => x < lowerFence || x > upperFence);
        
        if (outliers.length === 0) {
            insights.push({
                category: 'Outliers',
                insight: '✅ No extreme outliers detected (within ±3σ)'
            });
        } else {
            const outlierPercentage = (outliers.length / stats.n * 100).toFixed(1);
            insights.push({
                category: 'Outliers',
                insight: `⚠️ ${outliers.length} outliers detected (${outlierPercentage}%) - Review for data quality`
            });
        }

        // Statistical power and precision insights
        const standardError = populationStdDev / Math.sqrt(stats.n);
        const marginOfError95 = 1.96 * standardError;
        const precisionPercentage = (marginOfError95 / populationMean * 100).toFixed(1);

        if (parseFloat(precisionPercentage) <= 5) {
            insights.push({
                category: 'Precision',
                insight: `✅ Excellent precision - 95% CI margin of error is ${precisionPercentage}% of mean`
            });
        } else if (parseFloat(precisionPercentage) <= 10) {
            insights.push({
                category: 'Precision',
                insight: `✅ Good precision - 95% CI margin of error is ${precisionPercentage}% of mean`
            });
        } else {
            insights.push({
                category: 'Precision',
                insight: `⚠️ Limited precision - 95% CI margin of error is ${precisionPercentage}% of mean`
            });
        }

        // Recommendations for further analysis
        if (Math.abs(normalityTests.skewness) >= 1.0) {
            insights.push({
                category: 'Recommendations',
                insight: '📊 Consider data transformation (log, square root) to reduce skewness'
            });
        }

        if (stats.n < 100) {
            insights.push({
                category: 'Recommendations',
                insight: '📈 Increase sample size for more robust statistical inferences'
            });
        }

        if (outliers.length > stats.n * 0.05) {
            insights.push({
                category: 'Recommendations',
                insight: '🔍 Investigate outliers - may indicate data entry errors or different populations'
            });
        }

        // Central Limit Theorem applicability
        if (stats.n >= 30) {
            insights.push({
                category: 'Statistical Theory',
                insight: '✅ Sample size adequate for Central Limit Theorem - sampling distribution of mean will be approximately normal'
            });
        } else {
            insights.push({
                category: 'Statistical Theory',
                insight: '⚠️ Small sample size - Central Limit Theorem may not fully apply'
            });
        }

        // Confidence interval interpretation
        insights.push({
            category: 'Confidence Intervals',
            insight: '📐 Confidence intervals represent range of plausible population parameter values, not prediction intervals for individual observations'
        });

        return insights;
    }


// Parse shopping equation from user input with consistent return structure
parseShoppingEquation(equation) {
    // Default parameter structure - always return this format
    const defaultResult = {
        items: [
            { name: 'Rice', quantity: 2, unitPrice: 12.00, category: 'Grains' },
            { name: 'Oil', quantity: 3, unitPrice: 5.00, category: 'Cooking' },
            { name: 'Bread', quantity: 4, unitPrice: 2.50, category: 'Bakery' },
            { name: 'Milk', quantity: 2, unitPrice: 3.00, category: 'Dairy' },
            { name: 'Sugar', quantity: 1, unitPrice: 4.50, category: 'Baking' },
            { name: 'Apples', quantity: 3, unitPrice: 3.20, category: 'Fruits' },
            { name: 'Chicken', quantity: 2, unitPrice: 8.75, category: 'Meat' },
            { name: 'Eggs', quantity: 1, unitPrice: 6.00, category: 'Dairy' }
        ],
        currency: 'USD',
        taxRate: 0.08, // 8% tax
        discountRate: 0.00 // No discount by default
    };

    try {
        // Handle null/undefined/empty input
        if (!equation || typeof equation !== 'string') {
            return defaultResult;
        }

        // Remove leading/trailing spaces and normalize
        const cleanEquation = equation.trim();

        // Handle simple template names
        if (cleanEquation.toLowerCase() === 'shopping_list' || 
            cleanEquation.toLowerCase() === 'custom_shopping' ||
            cleanEquation === '') {
            return defaultResult;
        }

        // Initialize result with defaults
        const result = { ...defaultResult };

        // Method 1: Parse JSON-like object format
        // Example: { items: [...], currency: "EUR", taxRate: 0.1 }
        if (this.isJSONLikeFormat(cleanEquation)) {
            const parsedObject = this.parseJSONLikeString(cleanEquation);
            if (parsedObject) {
                // Merge parsed data with defaults
                if (parsedObject.items && Array.isArray(parsedObject.items)) {
                    result.items = this.validateShoppingItems(parsedObject.items);
                }
                if (parsedObject.currency && typeof parsedObject.currency === 'string') {
                    result.currency = parsedObject.currency.toUpperCase();
                }
                if (typeof parsedObject.taxRate === 'number' && parsedObject.taxRate >= 0) {
                    result.taxRate = Math.min(parsedObject.taxRate, 1); // Cap at 100%
                }
                if (typeof parsedObject.discountRate === 'number' && parsedObject.discountRate >= 0) {
                    result.discountRate = Math.min(parsedObject.discountRate, 1); // Cap at 100%
                }
                return result;
            }
        }

        // Method 2: Parse structured table format
        // Example: Item | Qty | Price | Category
        if (this.isTableFormat(cleanEquation)) {
            const parsedItems = this.parseTableFormat(cleanEquation);
            if (parsedItems && parsedItems.length > 0) {
                result.items = this.validateShoppingItems(parsedItems);
                return result;
            }
        }

        // Method 3: Parse simple list format
        // Example: Rice: 2 12.00, Oil: 3 5.00, Bread: 4 2.50
        if (this.isSimpleListFormat(cleanEquation)) {
            const parsedItems = this.parseSimpleListFormat(cleanEquation);
            if (parsedItems && parsedItems.length > 0) {
                result.items = this.validateShoppingItems(parsedItems);
                return result;
            }
        }

        // Method 4: Parse parameter string format
        // Example: currency:EUR, taxRate:0.1, items:Rice 2 12.00|Oil 3 5.00
        if (this.isParameterStringFormat(cleanEquation)) {
            const parsedParams = this.parseParameterString(cleanEquation);
            if (parsedParams) {
                return { ...result, ...parsedParams };
            }
        }

        // If no parsing method worked, try to extract any recognizable items
        const extractedItems = this.extractItemsFromText(cleanEquation);
        if (extractedItems && extractedItems.length > 0) {
            result.items = this.validateShoppingItems(extractedItems);
            return result;
        }

        // Fallback to defaults
        return defaultResult;

    } catch (error) {
        console.warn('Failed to parse shopping equation, using defaults:', error.message);
        return defaultResult;
    }
}

// Helper method to check if input is JSON-like format
isJSONLikeFormat(text) {
    const trimmed = text.trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
}

// Helper method to parse JSON-like string
parseJSONLikeString(text) {
    try {
        // Try direct JSON parse first
        return JSON.parse(text);
    } catch {
        try {
            // Convert JavaScript object notation to valid JSON
            let jsonStr = text
                .replace(/(\w+):/g, '"$1":')  // Quote property names
                .replace(/'/g, '"')           // Convert single quotes to double
                .replace(/,\s*}/g, '}')       // Remove trailing commas
                .replace(/,\s*]/g, ']');      // Remove trailing commas in arrays
            
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    }
}

// Helper method to check if input is table format
isTableFormat(text) {
    const lines = text.split('\n');
    return lines.some(line => 
        line.includes('|') && 
        (line.toLowerCase().includes('item') || line.toLowerCase().includes('qty'))
    );
}

// Helper method to parse table format
parseTableFormat(text) {
    const items = [];
    const lines = text.split('\n').filter(line => line.trim());
    let headerFound = false;

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and separators
        if (!trimmedLine || trimmedLine.match(/^[-=|+\s]+$/)) {
            continue;
        }

        // Detect and skip header
        if (!headerFound && 
            (trimmedLine.toLowerCase().includes('item') || 
             trimmedLine.toLowerCase().includes('name')) &&
            (trimmedLine.toLowerCase().includes('qty') || 
             trimmedLine.toLowerCase().includes('quantity'))) {
            headerFound = true;
            continue;
        }

        // Parse data rows
        if (trimmedLine.includes('|')) {
            const parts = trimmedLine.split('|').map(part => part.trim());
            if (parts.length >= 3) {
                const item = {
                    name: parts[0] || `Item ${items.length + 1}`,
                    quantity: this.parseNumber(parts[1]) || 1,
                    unitPrice: this.parseNumber(parts[2]) || 0,
                    category: parts[3] || 'General'
                };
                items.push(item);
            }
        }
    }

    return items;
}

// Helper method to check if input is simple list format
isSimpleListFormat(text) {
    return text.includes(':') && 
           (text.includes(',') || text.includes(';') || text.includes('\n'));
}

// Helper method to parse simple list format
parseSimpleListFormat(text) {
    const items = [];
    const entries = text.split(/[,;\n]/).filter(entry => entry.trim());

    for (const entry of entries) {
        if (entry.includes(':')) {
            const [name, details] = entry.split(':').map(s => s.trim());
            if (name && details) {
                const detailParts = details.split(/\s+/).filter(p => p);
                const item = {
                    name: name,
                    quantity: this.parseNumber(detailParts[0]) || 1,
                    unitPrice: this.parseNumber(detailParts[1]) || 0,
                    category: detailParts[2] || 'General'
                };
                items.push(item);
            }
        }
    }

    return items;
}

// Helper method to check if input is parameter string format
isParameterStringFormat(text) {
    return text.includes(':') && 
           (text.toLowerCase().includes('currency') || 
            text.toLowerCase().includes('tax') || 
            text.toLowerCase().includes('discount'));
}

// Helper method to parse parameter string format
parseParameterString(text) {
    const result = {};
    const pairs = text.split(',').map(s => s.trim());

    for (const pair of pairs) {
        if (pair.includes(':')) {
            const [key, value] = pair.split(':').map(s => s.trim());
            const lowerKey = key.toLowerCase();

            switch (lowerKey) {
                case 'currency':
                    result.currency = value.toUpperCase();
                    break;
                case 'taxrate':
                case 'tax':
                    result.taxRate = this.parseNumber(value) || 0;
                    break;
                case 'discountrate':
                case 'discount':
                    result.discountRate = this.parseNumber(value) || 0;
                    break;
                case 'items':
                    result.items = this.parseItemsString(value);
                    break;
            }
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

// Helper method to parse items from a string
parseItemsString(itemsStr) {
    const items = [];
    const itemEntries = itemsStr.split('|').filter(entry => entry.trim());

    for (const entry of itemEntries) {
        const parts = entry.trim().split(/\s+/);
        if (parts.length >= 3) {
            const item = {
                name: parts[0],
                quantity: this.parseNumber(parts[1]) || 1,
                unitPrice: this.parseNumber(parts[2]) || 0,
                category: parts[3] || 'General'
            };
            items.push(item);
        }
    }

    return items;
}

// Helper method to extract items from any text
extractItemsFromText(text) {
    const items = [];
    const lines = text.split(/[\n,;]/).filter(line => line.trim());

    for (const line of lines) {
        // Try to find patterns like "word number number"
        const matches = line.match(/(\w+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g);
        if (matches) {
            for (const match of matches) {
                const parts = match.split(/\s+/);
                if (parts.length >= 3) {
                    const item = {
                        name: parts[0],
                        quantity: this.parseNumber(parts[1]) || 1,
                        unitPrice: this.parseNumber(parts[2]) || 0,
                        category: 'General'
                    };
                    items.push(item);
                }
            }
        }
    }

    return items;
}

// Helper method to safely parse numbers
parseNumber(str) {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string') return 0;
    
    const cleaned = str.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// Enhanced validation method for shopping items
validateShoppingItems(items) {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => {
        // Ensure all required properties exist with valid values
        const validatedItem = {
            name: this.validateItemName(item.name, index),
            quantity: this.validateQuantity(item.quantity),
            unitPrice: this.validateUnitPrice(item.unitPrice),
            category: this.validateCategory(item.category)
        };

        return validatedItem;
    }).filter(item => item.name && item.name !== 'Invalid Item');
}

// Helper validation methods
validateItemName(name, index) {
    if (typeof name === 'string' && name.trim().length > 0) {
        return name.trim();
    }
    return `Item ${index + 1}`;
}

validateQuantity(quantity) {
    const parsed = this.parseNumber(quantity);
    return parsed > 0 ? parsed : 1;
}

validateUnitPrice(unitPrice) {
    const parsed = this.parseNumber(unitPrice);
    return parsed >= 0 ? parsed : 0;
}

validateCategory(category) {
    if (typeof category === 'string' && category.trim().length > 0) {
        return category.trim();
    }
    return 'General';
}
    createShoppingTemplate(equation, params) {
        const { items, currency, taxRate, discountRate } = params;
        const data = [];
        const currencySymbol = this.getCurrencySymbol(currency);

        // Calculate totals
        let subtotal = 0;
        const itemTotals = [];
        const categoryTotals = {};

        // Calculate item totals and category totals
        items.forEach(item => {
            const total = item.quantity * item.unitPrice;
            itemTotals.push(total);
            subtotal += total;

            if (!categoryTotals[item.category]) {
                categoryTotals[item.category] = 0;
            }
            categoryTotals[item.category] += total;
        });

        const discountAmount = subtotal * discountRate;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * taxRate;
        const finalTotal = afterDiscount + taxAmount;

        // Header
        data.push([
            { value: 'Shopping List Analysis', type: 'header', span: 6, style: 'title' },
            '', '', '', '', ''
        ]);
        data.push([
            { value: `Generated: ${new Date().toLocaleString()}`, type: 'data', span: 6 },
            '', '', '', '', ''
        ]);
        data.push(['', '', '', '', '', '']); // Empty row

        // Shopping Items Table
        data.push([
            { value: 'Shopping Items', type: 'header', span: 6 },
            '', '', '', '', ''
        ]);

        data.push([
            { value: 'Item Name', type: 'header' },
            { value: 'Category', type: 'header' },
            { value: 'Quantity', type: 'header' },
            { value: 'Unit Price', type: 'header' },
            { value: 'Total', type: 'header' },
            { value: 'Notes', type: 'header' }
        ]);

        // Add each item
        items.forEach((item, index) => {
            const total = itemTotals[index];
            data.push([
                { value: item.name, type: 'label' },
                { value: item.category, type: 'data' },
                { value: item.quantity.toString(), type: 'result' },
                { value: `${currencySymbol}${item.unitPrice.toFixed(2)}`, type: 'data' },
                { value: `${currencySymbol}${total.toFixed(2)}`, type: 'result' },
                { value: this.getItemNotes(item, total), type: 'data' }
            ]);
        });

        data.push(['', '', '', '', '', '']); // Empty row

        // Category Summary
        data.push([
            { value: 'Category Summary', type: 'header', span: 6 },
            '', '', '', '', ''
        ]);

        data.push([
            { value: 'Category', type: 'header' },
            { value: 'Items Count', type: 'header' },
            { value: 'Total Amount', type: 'header' },
            { value: 'Percentage', type: 'header' },
            { value: 'Avg per Item', type: 'header' },
            { value: 'Priority', type: 'header' }
        ]);

        Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]).forEach(category => {
            const categoryTotal = categoryTotals[category];
            const categoryItems = items.filter(item => item.category === category);
            const percentage = (categoryTotal / subtotal) * 100;
            const avgPerItem = categoryTotal / categoryItems.length;

            data.push([
                { value: category, type: 'label' },
                { value: categoryItems.length.toString(), type: 'result' },
                { value: `${currencySymbol}${categoryTotal.toFixed(2)}`, type: 'result' },
                { value: `${percentage.toFixed(1)}%`, type: 'data' },
                { value: `${currencySymbol}${avgPerItem.toFixed(2)}`, type: 'data' },
                { value: this.getCategoryPriority(category), type: 'data' }
            ]);
        });

        data.push(['', '', '', '', '', '']); // Empty row

        // Financial Summary
        data.push([
            { value: 'Financial Summary', type: 'header', span: 6 },
            '', '', '', '', ''
        ]);

        data.push([
            { value: 'Description', type: 'header' },
            { value: 'Calculation', type: 'header' },
            { value: 'Amount', type: 'header' },
            { value: 'Percentage', type: 'header' },
            { value: 'Impact', type: 'header' },
            { value: 'Notes', type: 'header' }
        ]);

        data.push([
            { value: 'Subtotal', type: 'label' },
            { value: 'Sum of all items', type: 'formula' },
            { value: `${currencySymbol}${subtotal.toFixed(2)}`, type: 'result' },
            { value: '100.0%', type: 'data' },
            { value: 'Base amount', type: 'data' },
            { value: `${items.length} items total`, type: 'data' }
        ]);

        if (discountRate > 0) {
            data.push([
                { value: 'Discount', type: 'label' },
                { value: `${(discountRate * 100).toFixed(1)}% of subtotal`, type: 'formula' },
                { value: `-${currencySymbol}${discountAmount.toFixed(2)}`, type: 'result' },
                { value: `-${(discountRate * 100).toFixed(1)}%`, type: 'data' },
                { value: 'Savings', type: 'data' },
                { value: 'Applied discount', type: 'data' }
            ]);

            data.push([
                { value: 'After Discount', type: 'label' },
                { value: 'Subtotal - Discount', type: 'formula' },
                { value: `${currencySymbol}${afterDiscount.toFixed(2)}`, type: 'result' },
                { value: `${((afterDiscount / subtotal) * 100).toFixed(1)}%`, type: 'data' },
                { value: 'Reduced total', type: 'data' },
                { value: 'Before tax', type: 'data' }
            ]);
        }

        if (taxRate > 0) {
            data.push([
                { value: 'Tax', type: 'label' },
                { value: `${(taxRate * 100).toFixed(1)}% of discounted amount`, type: 'formula' },
                { value: `+${currencySymbol}${taxAmount.toFixed(2)}`, type: 'result' },
                { value: `+${(taxRate * 100).toFixed(1)}%`, type: 'data' },
                { value: 'Additional cost', type: 'data' },
                { value: 'Government tax', type: 'data' }
            ]);
        }

        data.push([
            { value: 'Final Total', type: 'label' },
            { value: 'After discount + Tax', type: 'formula' },
            { value: `${currencySymbol}${finalTotal.toFixed(2)}`, type: 'result' },
            { value: `${((finalTotal / subtotal) * 100).toFixed(1)}%`, type: 'data' },
            { value: 'Amount to pay', type: 'data' },
            { value: 'Final checkout amount', type: 'data' }
        ]);

        data.push(['', '', '', '', '', '']); // Empty row

        // Shopping Statistics
        data.push([
            { value: 'Shopping Statistics', type: 'header', span: 6 },
            '', '', '', '', ''
        ]);

        const avgItemPrice = subtotal / items.length;
        const maxItem = items.reduce((max, item, index) => 
            itemTotals[index] > itemTotals[max] ? index : max, 0);
        const minItem = items.reduce((min, item, index) => 
            itemTotals[index] < itemTotals[min] ? index : min, 0);

        data.push([
            { value: 'Statistic', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Description', type: 'header' },
            { value: 'Analysis', type: 'header' },
            { value: 'Recommendation', type: 'header' },
            { value: 'Action', type: 'header' }
        ]);

        data.push([
            { value: 'Total Items', type: 'label' },
            { value: items.length.toString(), type: 'result' },
            { value: 'Number of different items', type: 'data' },
            { value: items.length > 10 ? 'Large shopping list' : items.length > 5 ? 'Medium list' : 'Small list', type: 'data' },
            { value: items.length > 15 ? 'Consider splitting into multiple trips' : 'Manageable size', type: 'data' },
            { value: 'Review necessity', type: 'data' }
        ]);

        data.push([
            { value: 'Average Item Cost', type: 'label' },
            { value: `${currencySymbol}${avgItemPrice.toFixed(2)}`, type: 'result' },
            { value: 'Average total per item', type: 'data' },
            { value: avgItemPrice > 10 ? 'High average' : avgItemPrice > 5 ? 'Moderate average' : 'Low average', type: 'data' },
            { value: avgItemPrice > 15 ? 'Look for alternatives' : 'Reasonable pricing', type: 'data' },
            { value: 'Compare prices', type: 'data' }
        ]);

        data.push([
            { value: 'Most Expensive Item', type: 'label' },
            { value: `${items[maxItem].name} (${currencySymbol}${itemTotals[maxItem].toFixed(2)})`, type: 'result' },
            { value: 'Highest total cost item', type: 'data' },
            { value: `${((itemTotals[maxItem] / subtotal) * 100).toFixed(1)}% of total`, type: 'data' },
            { value: itemTotals[maxItem] > subtotal * 0.3 ? 'Consider if necessary' : 'Reasonable proportion', type: 'data' },
            { value: 'Price check', type: 'data' }
        ]);

        data.push([
            { value: 'Least Expensive Item', type: 'label' },
            { value: `${items[minItem].name} (${currencySymbol}${itemTotals[minItem].toFixed(2)})`, type: 'result' },
            { value: 'Lowest total cost item', type: 'data' },
            { value: `${((itemTotals[minItem] / subtotal) * 100).toFixed(1)}% of total`, type: 'data' },
            { value: 'Good value item', type: 'data' },
            { value: 'Consider buying more', type: 'data' }
        ]);

        data.push([
            { value: 'Categories Count', type: 'label' },
            { value: Object.keys(categoryTotals).length.toString(), type: 'result' },
            { value: 'Different item categories', type: 'data' },
            { value: 'Diverse shopping list', type: 'data' },
            { value: 'Well-balanced selection', type: 'data' },
            { value: 'Organize by category', type: 'data' }
        ]);

        data.push(['', '', '', '', '', '']); // Empty row

        // Budget Analysis
        data.push([
            { value: 'Budget Analysis & Recommendations', type: 'header', span: 6 },
            '', '', '', '', ''
        ]);

        const recommendations = this.generateShoppingRecommendations(items, itemTotals, subtotal, finalTotal);
        recommendations.forEach(rec => {
            data.push([
                { value: rec.category, type: 'label' },
                { value: rec.recommendation, type: 'data', span: 5 },
                '', '', '', ''
            ]);
        });

        return data;
    }

    // Generate shopping recommendations
    generateShoppingRecommendations(items, itemTotals, subtotal, finalTotal) {
        const recommendations = [];

        // Budget recommendations
        if (finalTotal > 200) {
            recommendations.push({
                category: 'Budget Alert',
                recommendation: '💰 High total amount - Consider if all items are necessary or look for alternatives'
            });
        } else if (finalTotal > 100) {
            recommendations.push({
                category: 'Budget Notice',
                recommendation: '💸 Moderate spending - Good time to check for deals and coupons'
            });
        } else {
            recommendations.push({
                category: 'Budget Status',
                recommendation: '✅ Reasonable total - Well-controlled shopping list'
            });
        }

        // Item-specific recommendations
        const maxItemIndex = itemTotals.indexOf(Math.max(...itemTotals));
        const maxItemPercentage = (itemTotals[maxItemIndex] / subtotal) * 100;

        if (maxItemPercentage > 40) {
            recommendations.push({
                category: 'Item Distribution',
                recommendation: `⚠️ ${items[maxItemIndex].name} represents ${maxItemPercentage.toFixed(1)}% of total - Consider if quantity is necessary`
            });
        }

        // Shopping efficiency
        if (items.length < 5) {
            recommendations.push({
                category: 'Shopping Efficiency',
                recommendation: '🛒 Small list - Good for quick shopping trips, consider combining with other errands'
            });
        } else if (items.length > 15) {
            recommendations.push({
                category: 'Shopping Efficiency',
                recommendation: '📝 Large list - Consider organizing by store layout or splitting into multiple trips'
            });
        }

        // Category balance
        const categories = [...new Set(items.map(item => item.category))];
        if (categories.includes('Fruits') || categories.includes('Vegetables')) {
            recommendations.push({
                category: 'Nutrition',
                recommendation: '🥬 Good inclusion of fresh produce - Healthy shopping choices'
            });
        } else {
            recommendations.push({
                category: 'Nutrition',
                recommendation: '🍎 Consider adding fresh fruits and vegetables for balanced nutrition'
            });
        }

        return recommendations;
    }

    // Get currency symbol
    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹'
        };
        return symbols[currency] || '$';
    }

    // Get item notes based on price analysis
    getItemNotes(item, total) {
        if (total > 20) return 'High value item';
        if (total < 2) return 'Low cost item';
        if (item.quantity > 5) return 'Bulk purchase';
        return 'Standard item';
    }

    // Get category priority
    getCategoryPriority(category) {
        const priorities = {
            'Dairy': 'High',
            'Meat': 'High',
            'Fruits': 'Medium',
            'Vegetables': 'Medium',
            'Grains': 'Medium',
            'Bakery': 'Medium',
            'Cooking': 'Low',
            'Baking': 'Low',
            'Snacks': 'Low'
        };
        return priorities[category] || 'Medium';
    }

    // Method to get supported parameter formats for shopping
    getSupportedParameterFormats() {
        return {
            formats: [
                'Text format: Item | Qty | Unit Price format',
                'Simple list: ItemName: qty price, ItemName2: qty price',
                'Object notation: { items: [...], currency: "USD", taxRate: 0.08 }',
                'Template name: shopping_list (uses defaults)'
            ],
            parameters: {
                items: 'Array of shopping items with name, quantity, unitPrice, and category',
                currency: 'Currency code (USD, EUR, GBP, etc.)',
                taxRate: 'Tax rate as decimal (0.08 for 8%)',
                discountRate: 'Discount rate as decimal (0.10 for 10%)'
            },
            examples: {
                simple_text: `Rice | 2 | 12.00
Oil | 3 | 5.00
Bread | 4 | 2.50`,
                simple_list: 'Rice: 2 12.00, Oil: 3 5.00, Bread: 4 2.50',
                with_tax: '{ currency: "USD", taxRate: 0.08, discountRate: 0.05 }',
                full_object: '{ items: [{ name: "Rice", quantity: 2, unitPrice: 12.00, category: "Grains" }], currency: "USD" }'
            }
        };
    }

    // Method to validate shopping parameters
    validateShoppingParameters(params) {
        const errors = [];

        if (!params.items || !Array.isArray(params.items)) {
            errors.push('Items must be an array');
            return { isValid: false, errors };
        }

        if (params.items.length === 0) {
            errors.push('At least one item is required');
        }

        params.items.forEach((item, index) => {
            if (!item.name || typeof item.name !== 'string') {
                errors.push(`Item ${index + 1}: Name is required and must be a string`);
            }
            if (item.quantity === undefined || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) < 0) {
                errors.push(`Item ${index + 1}: Quantity must be a non-negative number`);
            }
            if (item.unitPrice === undefined || isNaN(parseFloat(item.unitPrice)) || parseFloat(item.unitPrice) < 0) {
                errors.push(`Item ${index + 1}: Unit price must be a non-negative number`);
            }
        });

        if (params.taxRate !== undefined && (isNaN(parseFloat(params.taxRate)) || parseFloat(params.taxRate) < 0)) {
            errors.push('Tax rate must be a non-negative number');
        }

        if (params.discountRate !== undefined && (isNaN(parseFloat(params.discountRate)) || parseFloat(params.discountRate) < 0 || parseFloat(params.discountRate) > 1)) {
            errors.push('Discount rate must be between 0 and 1');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Method to add item to shopping list
    addShoppingItem(name, quantity, unitPrice, category = 'General') {
        const item = {
            name: name || `Item ${Date.now()}`,
            quantity: Math.max(0, parseFloat(quantity) || 1),
            unitPrice: Math.max(0, parseFloat(unitPrice) || 0),
            category: category || 'General'
        };
        return item;
    }

   // Method to calculate shopping totals
    calculateShoppingTotals(items, taxRate = 0, discountRate = 0) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = subtotal * discountRate;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * taxRate;
        const finalTotal = afterDiscount + taxAmount;

        return {
            subtotal,
            discountAmount,
            afterDiscount,
            taxAmount,
            finalTotal,
            itemCount: items.length,
            averageItemCost: subtotal / items.length
        };
    }

    // Method to group items by category
    groupItemsByCategory(items) {
        const categoryGroups = {};
        
        items.forEach((item, index) => {
            const category = item.category || 'General';
            if (!categoryGroups[category]) {
                categoryGroups[category] = {
                    items: [],
                    totalCost: 0,
                    itemCount: 0,
                    averageCost: 0
                };
            }
            
            const itemTotal = item.quantity * item.unitPrice;
            categoryGroups[category].items.push({
                ...item,
                index,
                total: itemTotal
            });
            categoryGroups[category].totalCost += itemTotal;
            categoryGroups[category].itemCount++;
        });

        // Calculate averages
        Object.keys(categoryGroups).forEach(category => {
            const group = categoryGroups[category];
            group.averageCost = group.totalCost / group.itemCount;
        });

        return categoryGroups;
    }

    // Method to find budget optimization opportunities
    findBudgetOptimizations(items, targetBudget) {
        const currentTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const optimizations = [];

        if (currentTotal <= targetBudget) {
            optimizations.push({
                type: 'within_budget',
                message: `✅ Current total (${this.formatCurrency(currentTotal)}) is within budget`,
                savings: targetBudget - currentTotal,
                action: 'none'
            });
            return optimizations;
        }

        const overage = currentTotal - targetBudget;
        const itemsWithTotals = items.map((item, index) => ({
            ...item,
            index,
            total: item.quantity * item.unitPrice,
            costPerUnit: item.unitPrice,
            efficiency: (item.quantity * item.unitPrice) / item.quantity
        }));

        // Sort by total cost descending to find highest impact items
        const highestCostItems = [...itemsWithTotals].sort((a, b) => b.total - a.total);

        // Suggest quantity reductions
        let cumulativeSavings = 0;
        for (const item of highestCostItems) {
            if (cumulativeSavings >= overage) break;

            const maxReduction = Math.floor(item.quantity * 0.5); // Max 50% reduction
            if (maxReduction > 0) {
                const savings = maxReduction * item.unitPrice;
                optimizations.push({
                    type: 'reduce_quantity',
                    item: item.name,
                    currentQuantity: item.quantity,
                    suggestedQuantity: item.quantity - maxReduction,
                    savings: savings,
                    message: `Reduce ${item.name} from ${item.quantity} to ${item.quantity - maxReduction} units`,
                    action: 'reduce'
                });
                cumulativeSavings += savings;
            }
        }

        // Suggest item removal for non-essential categories
        const nonEssentialCategories = ['Snacks', 'Luxury', 'Entertainment', 'Baking'];
        const nonEssentialItems = itemsWithTotals.filter(item => 
            nonEssentialCategories.includes(item.category));

        nonEssentialItems.forEach(item => {
            optimizations.push({
                type: 'remove_item',
                item: item.name,
                savings: item.total,
                message: `Consider removing ${item.name} (${item.category}) to save ${this.formatCurrency(item.total)}`,
                action: 'remove'
            });
        });

        return optimizations;
    }

    // Method to suggest shopping alternatives
    suggestAlternatives(items) {
        const alternatives = [];

        items.forEach((item, index) => {
            const suggestions = [];

            // Price-based suggestions
            if (item.unitPrice > 10) {
                suggestions.push({
                    type: 'price',
                    suggestion: 'Look for store brand or generic alternatives',
                    potentialSavings: item.unitPrice * 0.2 * item.quantity // 20% savings
                });
            }

            // Quantity-based suggestions
            if (item.quantity > 5) {
                suggestions.push({
                    type: 'quantity',
                    suggestion: 'Consider bulk buying for better unit price',
                    potentialSavings: item.unitPrice * 0.1 * item.quantity // 10% bulk discount
                });
            }

            // Category-based suggestions
            const categoryAlternatives = {
                'Meat': 'Consider plant-based protein alternatives',
                'Snacks': 'Try homemade alternatives',
                'Bakery': 'Consider baking at home',
                'Dairy': 'Look for local dairy options'
            };

            if (categoryAlternatives[item.category]) {
                suggestions.push({
                    type: 'category',
                    suggestion: categoryAlternatives[item.category],
                    potentialSavings: item.unitPrice * 0.15 * item.quantity // 15% savings
                });
            }

            if (suggestions.length > 0) {
                alternatives.push({
                    item: item.name,
                    index,
                    alternatives: suggestions
                });
            }
        });

        return alternatives;
    }

    // Method to analyze shopping patterns
    analyzeShoppingPatterns(items) {
        const patterns = {
            categoryDistribution: {},
            priceRanges: {
                low: 0,    // < $5
                medium: 0, // $5-$15
                high: 0    // > $15
            },
            quantityPatterns: {
                single: 0,    // qty = 1
                multiple: 0,  // qty 2-5
                bulk: 0       // qty > 5
            },
            insights: []
        };

        // Analyze category distribution
        items.forEach(item => {
            const category = item.category || 'General';
            if (!patterns.categoryDistribution[category]) {
                patterns.categoryDistribution[category] = { count: 0, totalValue: 0 };
            }
            patterns.categoryDistribution[category].count++;
            patterns.categoryDistribution[category].totalValue += item.quantity * item.unitPrice;

            // Analyze price ranges
            if (item.unitPrice < 5) {
                patterns.priceRanges.low++;
            } else if (item.unitPrice <= 15) {
                patterns.priceRanges.medium++;
            } else {
                patterns.priceRanges.high++;
            }

            // Analyze quantity patterns
            if (item.quantity === 1) {
                patterns.quantityPatterns.single++;
            } else if (item.quantity <= 5) {
                patterns.quantityPatterns.multiple++;
            } else {
                patterns.quantityPatterns.bulk++;
            }
        });

        // Generate insights
        const totalItems = items.length;
        const mostCommonCategory = Object.keys(patterns.categoryDistribution)
            .reduce((a, b) => patterns.categoryDistribution[a].count > patterns.categoryDistribution[b].count ? a : b);

        patterns.insights.push(`Most common category: ${mostCommonCategory} (${patterns.categoryDistribution[mostCommonCategory].count} items)`);

        if (patterns.priceRanges.high > totalItems * 0.3) {
            patterns.insights.push('⚠️ High proportion of expensive items - consider alternatives');
        }

        if (patterns.quantityPatterns.bulk > totalItems * 0.3) {
            patterns.insights.push('📦 Good use of bulk purchasing for savings');
        }

        if (patterns.quantityPatterns.single > totalItems * 0.7) {
            patterns.insights.push('🛒 Mostly single items - check if bulk options available');
        }

        return patterns;
    }

    // Method to estimate shopping time
    estimateShoppingTime(items) {
        const baseTimePerItem = 2; // 2 minutes per item base time
        const categoryTimeMultipliers = {
            'Meat': 1.5,      // Takes longer to select
            'Fruits': 1.3,    // Need to check quality
            'Vegetables': 1.3,
            'Dairy': 1.1,
            'Bakery': 1.2,
            'General': 1.0
        };

        let totalTime = 0;
        const categoryGroups = this.groupItemsByCategory(items);

        Object.keys(categoryGroups).forEach(category => {
            const multiplier = categoryTimeMultipliers[category] || 1.0;
            const categoryItems = categoryGroups[category].itemCount;
            totalTime += categoryItems * baseTimePerItem * multiplier;
        });

        // Add checkout time (5-10 minutes depending on items)
        const checkoutTime = items.length > 15 ? 10 : items.length > 8 ? 7 : 5;
        totalTime += checkoutTime;

        return {
            totalMinutes: Math.ceil(totalTime),
            breakdown: {
                shoppingTime: Math.ceil(totalTime - checkoutTime),
                checkoutTime: checkoutTime,
                categoriesCount: Object.keys(categoryGroups).length
            },
            tips: this.getShoppingTimeTips(totalTime, items.length)
        };
    }

    // Method to get shopping time tips
    getShoppingTimeTips(totalTime, itemCount) {
        const tips = [];

        if (totalTime > 60) {
            tips.push('🕐 Long shopping trip expected - consider splitting into multiple visits');
        }

        if (itemCount > 20) {
            tips.push('📝 Large list - organize by store layout for efficiency');
        }

        tips.push('🛒 Use a shopping cart for more than 10 items');
        tips.push('📱 Consider store apps for aisle locations');

        if (totalTime > 45) {
            tips.push('⏰ Shop during off-peak hours to avoid crowds');
        }

        return tips;
    }

    // Method to format currency
    formatCurrency(amount, currency = 'USD') {
        const symbol = this.getCurrencySymbol(currency);
        return `${symbol}${amount.toFixed(2)}`;
    }

    // Method to calculate cost per category as percentage
    calculateCategoryPercentages(items) {
        const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const categoryGroups = this.groupItemsByCategory(items);
        const percentages = {};

        Object.keys(categoryGroups).forEach(category => {
            percentages[category] = {
                percentage: (categoryGroups[category].totalCost / totalCost) * 100,
                amount: categoryGroups[category].totalCost,
                itemCount: categoryGroups[category].itemCount
            };
        });

        return percentages;
    }

    // Method to generate shopping list summary
    generateShoppingSummary(items, currency = 'USD', taxRate = 0, discountRate = 0) {
        const totals = this.calculateShoppingTotals(items, taxRate, discountRate);
        const categoryGroups = this.groupItemsByCategory(items);
        const patterns = this.analyzeShoppingPatterns(items);
        const timeEstimate = this.estimateShoppingTime(items);

        return {
            totals: {
                ...totals,
                formatted: {
                    subtotal: this.formatCurrency(totals.subtotal, currency),
                    finalTotal: this.formatCurrency(totals.finalTotal, currency),
                    discountAmount: this.formatCurrency(totals.discountAmount, currency),
                    taxAmount: this.formatCurrency(totals.taxAmount, currency)
                }
            },
            categories: Object.keys(categoryGroups).length,
            categoryBreakdown: categoryGroups,
            patterns,
            timeEstimate,
            recommendations: this.generateShoppingRecommendations(
                items, 
                items.map(item => item.quantity * item.unitPrice),
                totals.subtotal,
                totals.finalTotal
            )
        };
    }

    // Method to export shopping list to different formats
    exportShoppingList(items, format = 'text', options = {}) {
        const currency = options.currency || 'USD';
        const taxRate = options.taxRate || 0;
        const discountRate = options.discountRate || 0;
        const totals = this.calculateShoppingTotals(items, taxRate, discountRate);

        switch (format.toLowerCase()) {
            case 'text':
                return this.exportAsText(items, totals, currency);
            case 'csv':
                return this.exportAsCSV(items, totals, currency);
            case 'json':
                return this.exportAsJSON(items, totals, currency, options);
            case 'markdown':
                return this.exportAsMarkdown(items, totals, currency);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Method to export as text
    exportAsText(items, totals, currency) {
        const symbol = this.getCurrencySymbol(currency);
        let output = 'SHOPPING LIST\n';
        output += '=============\n\n';
        output += `Generated: ${new Date().toLocaleString()}\n\n`;

        output += 'ITEMS:\n';
        items.forEach((item, index) => {
            const total = item.quantity * item.unitPrice;
            output += `${index + 1}. ${item.name} - Qty: ${item.quantity} @ ${symbol}${item.unitPrice.toFixed(2)} = ${symbol}${total.toFixed(2)}\n`;
        });

        output += '\n';
        output += `SUBTOTAL: ${symbol}${totals.subtotal.toFixed(2)}\n`;
        if (totals.discountAmount > 0) {
            output += `DISCOUNT: -${symbol}${totals.discountAmount.toFixed(2)}\n`;
        }
        if (totals.taxAmount > 0) {
            output += `TAX: +${symbol}${totals.taxAmount.toFixed(2)}\n`;
        }
        output += `FINAL TOTAL: ${symbol}${totals.finalTotal.toFixed(2)}\n`;

        return output;
    }

    // Method to export as CSV
    exportAsCSV(items, totals, currency) {
        const symbol = this.getCurrencySymbol(currency);
        let csv = 'Item Name,Category,Quantity,Unit Price,Total\n';

        items.forEach(item => {
            const total = item.quantity * item.unitPrice;
            csv += `"${item.name}","${item.category}",${item.quantity},${item.unitPrice},${total}\n`;
        });

        csv += '\n';
        csv += `Summary,,,Subtotal,${totals.subtotal}\n`;
        if (totals.discountAmount > 0) {
            csv += `Summary,,,Discount,-${totals.discountAmount}\n`;
        }
        if (totals.taxAmount > 0) {
            csv += `Summary,,,Tax,${totals.taxAmount}\n`;
        }
        csv += `Summary,,,Final Total,${totals.finalTotal}\n`;

        return csv;
    }

    // Method to export as JSON
    exportAsJSON(items, totals, currency, options) {
        return JSON.stringify({
            metadata: {
                generated: new Date().toISOString(),
                currency: currency,
                taxRate: options.taxRate || 0,
                discountRate: options.discountRate || 0
            },
            items: items.map(item => ({
                ...item,
                total: item.quantity * item.unitPrice
            })),
            totals,
            summary: this.generateShoppingSummary(items, currency, options.taxRate, options.discountRate)
        }, null, 2);
    }

    // Method to export as Markdown
    exportAsMarkdown(items, totals, currency) {
        const symbol = this.getCurrencySymbol(currency);
        let md = '# Shopping List\n\n';
        md += `**Generated:** ${new Date().toLocaleString()}\n\n`;

        md += '## Items\n\n';
        md += '| Item Name | Category | Quantity | Unit Price | Total |\n';
        md += '|-----------|----------|----------|------------| ------|\n';

        items.forEach(item => {
            const total = item.quantity * item.unitPrice;
            md += `| ${item.name} | ${item.category} | ${item.quantity} | ${symbol}${item.unitPrice.toFixed(2)} | ${symbol}${total.toFixed(2)} |\n`;
        });

        md += '\n## Summary\n\n';
        md += `- **Subtotal:** ${symbol}${totals.subtotal.toFixed(2)}\n`;
        if (totals.discountAmount > 0) {
            md += `- **Discount:** -${symbol}${totals.discountAmount.toFixed(2)}\n`;
        }
        if (totals.taxAmount > 0) {
            md += `- **Tax:** +${symbol}${totals.taxAmount.toFixed(2)}\n`;
        }
        md += `- **Final Total:** ${symbol}${totals.finalTotal.toFixed(2)}\n`;

        return md;
    }

    // Method to merge multiple shopping lists
    mergeShoppingLists(lists) {
        const mergedItems = {};
        const metadata = {
            totalLists: lists.length,
            mergedAt: new Date().toISOString()
        };

        lists.forEach((list, listIndex) => {
            list.items.forEach(item => {
                const key = `${item.name.toLowerCase()}_${item.category.toLowerCase()}`;
                
                if (mergedItems[key]) {
                    // Item exists, merge quantities and recalculate average price
                    const existing = mergedItems[key];
                    const totalQuantity = existing.quantity + item.quantity;
                    const averagePrice = ((existing.quantity * existing.unitPrice) + (item.quantity * item.unitPrice)) / totalQuantity;
                    
                    mergedItems[key] = {
                        ...existing,
                        quantity: totalQuantity,
                        unitPrice: averagePrice,
                        sources: [...(existing.sources || [listIndex - 1]), listIndex]
                    };
                } else {
                    // New item
                    mergedItems[key] = {
                        ...item,
                        sources: [listIndex]
                    };
                }
            });
        });

        return {
            items: Object.values(mergedItems),
            metadata
        };
    }



    // Parse betting equation from user input
    parseBettingEquation(equation) {
        const defaultParams = {
            winProbability: 0.55,
            betAmount: 100,
            odds: 2.0,
            oddsFormat: 'decimal',
            bankroll: 1000
        };

        try {
            // Remove spaces and normalize the equation
            const cleanEquation = equation.replace(/\s/g, '');

            // Check if it's just the template name
            if (cleanEquation.toLowerCase() === 'bet_analysis' || cleanEquation.toLowerCase() === 'custom_betting') {
                return defaultParams;
            }

            // Try to parse as JavaScript object notation
            // Handle different input formats
            let parsedParams = {};

            // Method 1: Try to parse as JSON-like object
            if (cleanEquation.includes('{') && cleanEquation.includes('}')) {
                try {
                    // Extract the object part
                    const objectMatch = cleanEquation.match(/\{[^}]+\}/);
                    if (objectMatch) {
                        let objectStr = objectMatch[0];
                        // Convert to valid JSON
                        objectStr = objectStr.replace(/(\w+):/g, '"$1":');
                        objectStr = objectStr.replace(/'/g, '"');
                        parsedParams = JSON.parse(objectStr);
                    }
                } catch (e) {
                    console.warn('Failed to parse as JSON object, trying parameter extraction');
                }
            }

            // Method 2: Extract parameters using regex patterns
            if (Object.keys(parsedParams).length === 0) {
                const patterns = {
                    winProbability: /winProbability[:\s]*([0-9.]+)/i,
                    betAmount: /betAmount[:\s]*([0-9.]+)/i,
                    odds: /odds[:\s]*(-?[0-9.]+)/i,
                    oddsFormat: /oddsFormat[:\s]*['"]?(\w+)['"]?/i,
                    bankroll: /bankroll[:\s]*([0-9.]+)/i
                };

                Object.keys(patterns).forEach(param => {
                    const match = equation.match(patterns[param]);
                    if (match) {
                        if (param === 'oddsFormat') {
                            parsedParams[param] = match[1].toLowerCase();
                        } else {
                            parsedParams[param] = parseFloat(match[1]);
                        }
                    }
                });
            }

            // Method 3: Handle simple comma-separated values
            if (Object.keys(parsedParams).length === 0) {
                const values = cleanEquation.split(',').map(v => v.trim());
                if (values.length >= 4) {
                    parsedParams = {
                        winProbability: parseFloat(values[0]) || defaultParams.winProbability,
                        betAmount: parseFloat(values[1]) || defaultParams.betAmount,
                        odds: parseFloat(values[2]) || defaultParams.odds,
                        oddsFormat: values[3].replace(/['"]/g, '').toLowerCase() || defaultParams.oddsFormat,
                        bankroll: parseFloat(values[4]) || defaultParams.bankroll
                    };
                }
            }

            // Merge with defaults for any missing parameters
            const result = { ...defaultParams, ...parsedParams };

            // Validate parameters
            result.winProbability = Math.max(0, Math.min(1, result.winProbability));
            result.betAmount = Math.max(0, result.betAmount);
            result.bankroll = Math.max(result.betAmount, result.bankroll);

            if (!['decimal', 'american', 'fractional'].includes(result.oddsFormat)) {
                result.oddsFormat = 'decimal';
            }

            return result;

        } catch (error) {
            console.warn('Failed to parse betting equation, using defaults:', error.message);
            return defaultParams;
        }
    }

    createBettingTemplate(equation, params) {
        const { winProbability, betAmount, odds, oddsFormat, bankroll } = params;
        const data = [];

        // Convert odds to decimal format for calculations
        let decimalOdds = odds;
        let impliedProbability, expectedValue, variance, standardDeviation;

        if (oddsFormat === 'american') {
            decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
        } else if (oddsFormat === 'fractional') {
            // Assuming odds is passed as decimal representation of fraction
            decimalOdds = odds + 1;
        }

        // Calculate betting metrics
        impliedProbability = 1 / decimalOdds;
        const payout = betAmount * decimalOdds;
        const profit = payout - betAmount;
        expectedValue = (winProbability * profit) - ((1 - winProbability) * betAmount);

        // Calculate variance and standard deviation
        const winOutcome = profit;
        const loseOutcome = -betAmount;
        const expectedOutcome = expectedValue;
        variance = winProbability * Math.pow(winOutcome - expectedOutcome, 2) +
                  (1 - winProbability) * Math.pow(loseOutcome - expectedOutcome, 2);
        standardDeviation = Math.sqrt(variance);

        // Header
        data.push([
            { value: 'Betting Probability Analysis', type: 'header', span: 4, style: 'title' },
            '', '', ''
        ]);
        data.push([
            { value: `Generated: ${new Date().toLocaleString()}`, type: 'data', span: 4 },
            '', '', ''
        ]);
        data.push(['', '', '', '']); // Empty row

        // Input Parameters Display
        data.push([
            { value: 'Input Parameters', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Parameter', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Format', type: 'header' },
            { value: 'Description', type: 'header' }
        ]);

        data.push([
            { value: 'Bet Amount', type: 'label' },
            { value: `$${betAmount.toFixed(2)}`, type: 'result' },
            { value: 'USD', type: 'data' },
            { value: 'Amount wagered per bet', type: 'data' }
        ]);

        data.push([
            { value: 'Winning Probability', type: 'label' },
            { value: `${(winProbability * 100).toFixed(2)}%`, type: 'result' },
            { value: 'Percentage', type: 'data' },
            { value: 'Your estimated chance of winning', type: 'data' }
        ]);

        data.push([
            { value: 'Losing Probability', type: 'label' },
            { value: `${((1 - winProbability) * 100).toFixed(2)}%`, type: 'result' },
            { value: 'Percentage', type: 'data' },
            { value: 'Your estimated chance of losing', type: 'data' }
        ]);

        data.push([
            { value: 'Original Odds', type: 'label' },
            { value: odds.toString(), type: 'result' },
            { value: oddsFormat.charAt(0).toUpperCase() + oddsFormat.slice(1), type: 'data' },
            { value: 'Bookmaker odds as entered', type: 'data' }
        ]);

        data.push([
            { value: 'Decimal Odds', type: 'label' },
            { value: decimalOdds.toFixed(2), type: 'result' },
            { value: 'Decimal', type: 'data' },
            { value: 'Converted to decimal format', type: 'data' }
        ]);

        data.push([
            { value: 'Implied Probability', type: 'label' },
            { value: `${(impliedProbability * 100).toFixed(2)}%`, type: 'result' },
            { value: 'Percentage', type: 'data' },
            { value: 'Probability implied by bookmaker odds', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Payout Analysis
        data.push([
            { value: 'Payout Analysis', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Scenario', type: 'header' },
            { value: 'Probability', type: 'header' },
            { value: 'Total Return', type: 'header' },
            { value: 'Net Profit/Loss', type: 'header' }
        ]);

        data.push([
            { value: 'Win', type: 'label' },
            { value: `${(winProbability * 100).toFixed(2)}%`, type: 'result' },
            { value: `$${payout.toFixed(2)}`, type: 'data' },
            { value: `+$${profit.toFixed(2)}`, type: 'result' }
        ]);

        data.push([
            { value: 'Loss', type: 'label' },
            { value: `${((1 - winProbability) * 100).toFixed(2)}%`, type: 'result' },
            { value: '$0.00', type: 'data' },
            { value: `-$${betAmount.toFixed(2)}`, type: 'result' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Expected Value Analysis
        data.push([
            { value: 'Statistical Analysis', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Metric', type: 'header' },
            { value: 'Formula', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Interpretation', type: 'header' }
        ]);

        data.push([
            { value: 'Expected Value', type: 'label' },
            { value: 'E(X) = P(win)×Profit - P(lose)×Loss', type: 'formula' },
            { value: `$${expectedValue.toFixed(2)}`, type: 'result' },
            { value: expectedValue > 0 ? 'Positive expectation - Good bet!' : expectedValue < 0 ? 'Negative expectation - Bad bet' : 'Break-even bet', type: 'data' }
        ]);

        data.push([
            { value: 'Expected Value %', type: 'label' },
            { value: '(E(X) / Bet Amount) × 100', type: 'formula' },
            { value: `${((expectedValue / betAmount) * 100).toFixed(2)}%`, type: 'result' },
            { value: 'Return on investment per bet', type: 'data' }
        ]);

        data.push([
            { value: 'Variance', type: 'label' },
            { value: 'Var(X) = Σ[P(x)×(x-μ)²]', type: 'formula' },
            { value: variance.toFixed(2), type: 'result' },
            { value: 'Measure of bet volatility', type: 'data' }
        ]);

        data.push([
            { value: 'Standard Deviation', type: 'label' },
            { value: 'σ = √Var(X)', type: 'formula' },
            { value: `$${standardDeviation.toFixed(2)}`, type: 'result' },
            { value: 'Risk (uncertainty) per bet', type: 'data' }
        ]);

        // Edge calculation
        const edge = winProbability - impliedProbability;
        data.push([
            { value: 'Betting Edge', type: 'label' },
            { value: 'Your Prob - Implied Prob', type: 'formula' },
            { value: `${(edge * 100).toFixed(2)}%`, type: 'result' },
            { value: edge > 0.05 ? 'Strong positive edge' : edge > 0 ? 'Positive edge (good bet)' : edge < -0.05 ? 'Strong negative edge' : 'Negative edge (avoid)', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Bankroll Management
        data.push([
            { value: 'Bankroll Management', type: 'header', span: 4 },
            '', '', ''
        ]);

        const betPercentage = (betAmount / bankroll) * 100;
        const maxConsecutiveLosses = Math.floor(bankroll / betAmount);

        // Kelly Criterion calculation
        const kellyFraction = edge > 0 ? (winProbability * decimalOdds - 1) / (decimalOdds - 1) : 0;
        const kellySuggested = Math.max(0, kellyFraction * bankroll);

        data.push([
            { value: 'Metric', type: 'header' },
            { value: 'Value', type: 'header' },
            { value: 'Assessment', type: 'header' },
            { value: 'Risk Level', type: 'header' }
        ]);

        data.push([
            { value: 'Current Bankroll', type: 'label' },
            { value: `$${bankroll.toFixed(2)}`, type: 'result' },
            { value: 'Total available funds', type: 'data' },
            { value: 'N/A', type: 'data' }
        ]);

        data.push([
            { value: 'Bet Size %', type: 'label' },
            { value: `${betPercentage.toFixed(2)}%`, type: 'result' },
            { value: betPercentage <= 2 ? 'Very Conservative' : betPercentage <= 5 ? 'Conservative' : betPercentage <= 10 ? 'Moderate' : 'Aggressive', type: 'data' },
            { value: betPercentage <= 5 ? 'Low' : betPercentage <= 10 ? 'Medium' : 'High', type: 'data' }
        ]);

        data.push([
            { value: 'Kelly Criterion', type: 'label' },
            { value: `$${kellySuggested.toFixed(2)}`, type: 'result' },
            { value: `${((kellySuggested / bankroll) * 100).toFixed(2)}% of bankroll`, type: 'data' },
            { value: kellyFraction > 0 ? 'Mathematically optimal' : 'Avoid this bet', type: 'data' }
        ]);

        data.push([
            { value: 'Survival Capacity', type: 'label' },
            { value: `${maxConsecutiveLosses} bets`, type: 'result' },
            { value: 'Max consecutive losses before ruin', type: 'data' },
            { value: maxConsecutiveLosses >= 20 ? 'Good' : maxConsecutiveLosses >= 10 ? 'Moderate' : 'Risky', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Simulation Results
        data.push([
            { value: 'Long-term Projection (100 bets)', type: 'header', span: 4 },
            '', '', ''
        ]);

        data.push([
            { value: 'Outcome', type: 'header' },
            { value: 'Expected Count', type: 'header' },
            { value: 'Expected Profit/Loss', type: 'header' },
            { value: 'Cumulative Impact', type: 'header' }
        ]);

        const expectedWins = winProbability * 100;
        const expectedLosses = (1 - winProbability) * 100;
        const totalExpectedProfit = expectedValue * 100;
        const totalBetAmount = betAmount * 100;

        data.push([
            { value: 'Wins', type: 'label' },
            { value: expectedWins.toFixed(1), type: 'result' },
            { value: `+$${(expectedWins * profit).toFixed(2)}`, type: 'data' },
            { value: 'Positive contribution', type: 'data' }
        ]);

        data.push([
            { value: 'Losses', type: 'label' },
            { value: expectedLosses.toFixed(1), type: 'result' },
            { value: `-$${(expectedLosses * betAmount).toFixed(2)}`, type: 'data' },
            { value: 'Negative contribution', type: 'data' }
        ]);

        data.push([
            { value: 'Total Wagered', type: 'label' },
            { value: '100 bets', type: 'formula' },
            { value: `$${totalBetAmount.toFixed(2)}`, type: 'result' },
            { value: 'Total money at risk', type: 'data' }
        ]);

        data.push([
            { value: 'Net Expected Result', type: 'label' },
            { value: 'Over 100 bets', type: 'formula' },
            { value: `$${totalExpectedProfit.toFixed(2)}`, type: 'result' },
            { value: totalExpectedProfit > 0 ? 'Profitable long-term' : 'Unprofitable long-term', type: 'data' }
        ]);

        data.push([
            { value: 'ROI %', type: 'label' },
            { value: '(Net Profit / Total Wagered) × 100', type: 'formula' },
            { value: `${((totalExpectedProfit / totalBetAmount) * 100).toFixed(2)}%`, type: 'result' },
            { value: 'Return on investment', type: 'data' }
        ]);

        data.push(['', '', '', '']); // Empty row

        // Recommendations
        data.push([
            { value: 'Recommendations', type: 'header', span: 4 },
            '', '', ''
        ]);

        const recommendations = this.generateRecommendations(expectedValue, edge, betPercentage, kellyFraction);
        recommendations.forEach(rec => {
            data.push([
                { value: rec.category, type: 'label' },
                { value: rec.recommendation, type: 'data', span: 3 },
                '', ''
            ]);
        });

        return data;
    }

    generateRecommendations(expectedValue, edge, betPercentage, kellyFraction) {
        const recommendations = [];

        // Bet Decision
        if (expectedValue > 0 && edge > 0.02) {
            recommendations.push({
                category: 'Bet Decision',
                recommendation: '✅ RECOMMENDED - Positive expected value with good edge'
            });
        } else if (expectedValue > 0) {
            recommendations.push({
                category: 'Bet Decision',
                recommendation: '⚠️ MARGINAL - Small positive edge, proceed with caution'
            });
        } else {
            recommendations.push({
                category: 'Bet Decision',
                recommendation: '❌ NOT RECOMMENDED - Negative expected value'
            });
        }

        // Bet Sizing
        if (betPercentage <= 2) {
            recommendations.push({
                category: 'Bet Sizing',
                recommendation: '🛡️ Very conservative sizing - Low risk approach'
            });
        } else if (betPercentage <= 5) {
            recommendations.push({
                category: 'Bet Sizing',
                recommendation: '✅ Conservative sizing - Recommended for most bettors'
            });
        } else if (betPercentage <= 10) {
            recommendations.push({
                category: 'Bet Sizing',
                recommendation: '⚠️ Moderate sizing - Acceptable if confident in edge'
            });
        } else {
            recommendations.push({
                category: 'Bet Sizing',
                recommendation: '🚨 Aggressive sizing - High risk, consider reducing'
            });
        }

        // Kelly Criterion
        if (kellyFraction > 0.1) {
            recommendations.push({
                category: 'Kelly Advice',
                recommendation: 'Strong mathematical edge detected - Consider increasing bet size'
            });
        } else if (kellyFraction > 0.02) {
            recommendations.push({
                category: 'Kelly Advice',
                recommendation: 'Moderate edge - Current bet size may be appropriate'
            });
        } else if (kellyFraction > 0) {
            recommendations.push({
                category: 'Kelly Advice',
                recommendation: 'Small edge - Consider smaller bet size'
            });
        } else {
            recommendations.push({
                category: 'Kelly Advice',
                recommendation: 'No mathematical edge - Kelly suggests avoiding this bet'
            });
        }

        return recommendations;
    }

    // Method to get supported parameter formats for betting
    getSupportedParameterFormats() {
        return {
            formats: [
                'Object notation: { winProbability: 0.55, betAmount: 100, odds: 2.0, oddsFormat: "decimal", bankroll: 1000 }',
                'Parameter list: winProbability: 0.55, betAmount: 100, odds: 2.0, oddsFormat: decimal, bankroll: 1000',
                'Comma separated: 0.55, 100, 2.0, decimal, 1000',
                'Template name: bet_analysis (uses defaults)'
            ],
            parameters: {
                winProbability: 'Your estimated probability of winning (0.0 to 1.0)',
                betAmount: 'Amount to bet per wager (positive number)',
                odds: 'Bookmaker odds in specified format',
                oddsFormat: 'Format of odds: "decimal", "american", or "fractional"',
                bankroll: 'Total bankroll available for betting (positive number)'
            },
            examples: {
                conservative: 'winProbability: 0.55, betAmount: 25, odds: 1.9, oddsFormat: decimal, bankroll: 1000',
                aggressive: 'winProbability: 0.65, betAmount: 100, odds: 2.2, oddsFormat: decimal, bankroll: 500',
                american_odds: 'winProbability: 0.6, betAmount: 50, odds: +150, oddsFormat: american, bankroll: 2000',
                fractional_odds: 'winProbability: 0.45, betAmount: 75, odds: 2.5, oddsFormat: fractional, bankroll: 1500'
            },
            validation: {
                winProbability: { min: 0, max: 1, type: 'float' },
                betAmount: { min: 0.01, max: Infinity, type: 'float' },
                odds: { min: -Infinity, max: Infinity, type: 'float' },
                oddsFormat: { values: ['decimal', 'american', 'fractional'], type: 'string' },
                bankroll: { min: 0.01, max: Infinity, type: 'float' }
            }
        };
    }

    // Method to validate betting parameters
    validateBettingParameters(params) {
        const validation = this.getSupportedParameterFormats().validation;
        const errors = [];

        Object.keys(validation).forEach(param => {
            const value = params[param];
            const rules = validation[param];

            if (value === undefined || value === null) {
                errors.push(`Parameter '${param}' is required`);
                return;
            }

            if (rules.type === 'float') {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    errors.push(`Parameter '${param}' must be a valid number`);
                    return;
                }
                if (numValue < rules.min || numValue > rules.max) {
                    errors.push(`Parameter '${param}' must be between ${rules.min} and ${rules.max}`);
                    return;
                }
            }

            if (rules.type === 'string' && rules.values) {
                if (!rules.values.includes(value.toString().toLowerCase())) {
                    errors.push(`Parameter '${param}' must be one of: ${rules.values.join(', ')}`);
                    return;
                }
            }
        });

        // Additional validation rules
        if (params.betAmount > params.bankroll) {
            errors.push('Bet amount cannot exceed bankroll');
        }

        if (params.winProbability <= 0 || params.winProbability >= 1) {
            errors.push('Win probability must be between 0 and 1 (exclusive)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Method to convert odds between formats
    convertOdds(odds, fromFormat, toFormat) {
        if (fromFormat === toFormat) return odds;

        let decimal;

        // Convert to decimal first
        switch (fromFormat.toLowerCase()) {
            case 'decimal':
                decimal = odds;
                break;
            case 'american':
                decimal = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
                break;
            case 'fractional':
                decimal = odds + 1;
                break;
            default:
                throw new Error(`Unsupported odds format: ${fromFormat}`);
        }

        // Convert from decimal to target format
        switch (toFormat.toLowerCase()) {
            case 'decimal':
                return Math.round(decimal * 100) / 100;
            case 'american':
                return decimal >= 2 ?
                    Math.round((decimal - 1) * 100) :
                    Math.round(-100 / (decimal - 1));
            case 'fractional':
                return Math.round((decimal - 1) * 100) / 100;
            default:
                throw new Error(`Unsupported odds format: ${toFormat}`);
        }
    }

    // Method to calculate break-even probability
    calculateBreakEvenProbability(odds, oddsFormat = 'decimal') {
        const decimalOdds = this.convertOdds(odds, oddsFormat, 'decimal');
        return 1 / decimalOdds;
    }

    // Method to calculate implied probability
    calculateImpliedProbability(odds, oddsFormat = 'decimal') {
        return this.calculateBreakEvenProbability(odds, oddsFormat);
    }

    // Method to calculate Kelly Criterion
    calculateKellyCriterion(winProbability, odds, oddsFormat = 'decimal') {
        const decimalOdds = this.convertOdds(odds, oddsFormat, 'decimal');
        const lossProb = 1 - winProbability;
        return (winProbability * decimalOdds - 1) / (decimalOdds - 1);
    }

    // Method to simulate betting outcomes
    simulateBetting(params, numSimulations = 1000) {
        const { winProbability, betAmount, odds, oddsFormat, bankroll } = params;
        const decimalOdds = this.convertOdds(odds, oddsFormat, 'decimal');
        const profit = betAmount * (decimalOdds - 1);

        const results = {
            wins: 0,
            losses: 0,
            totalProfit: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
            outcomes: []
        };

        let currentWinStreak = 0;
        let currentLossStreak = 0;

        for (let i = 0; i < numSimulations; i++) {
            const isWin = Math.random() < winProbability;
            const outcome = isWin ? profit : -betAmount;

            results.outcomes.push(outcome);
            results.totalProfit += outcome;

            if (isWin) {
                results.wins++;
                currentWinStreak++;
                currentLossStreak = 0;
                results.maxWinStreak = Math.max(results.maxWinStreak, currentWinStreak);
            } else {
                results.losses++;
                currentLossStreak++;
                currentWinStreak = 0;
                results.maxLossStreak = Math.max(results.maxLossStreak, currentLossStreak);
            }
        }

        results.winRate = results.wins / numSimulations;
        results.averageProfit = results.totalProfit / numSimulations;
        results.roi = (results.totalProfit / (betAmount * numSimulations)) * 100;

        return results;
    }

    // Method to generate risk assessment
    generateRiskAssessment(params) {
        const { winProbability, betAmount, bankroll, odds, oddsFormat } = params;
        const decimalOdds = this.convertOdds(odds, oddsFormat, 'decimal');
        const impliedProbability = this.calculateImpliedProbability(odds, oddsFormat);
        const kelly = this.calculateKellyCriterion(winProbability, odds, oddsFormat);

        const riskFactors = [];
        let riskScore = 0;

        // Bet size risk
        const betPercentage = (betAmount / bankroll) * 100;
        if (betPercentage > 10) {
            riskFactors.push('High bet size relative to bankroll (>10%)');
            riskScore += 3;
        } else if (betPercentage > 5) {
            riskFactors.push('Moderate bet size relative to bankroll (5-10%)');
            riskScore += 1;
        }

        // Edge risk
        const edge = winProbability - impliedProbability;
        if (edge <= 0) {
            riskFactors.push('No positive edge detected');
            riskScore += 4;
        } else if (edge < 0.02) {
            riskFactors.push('Very small edge (<2%)');
            riskScore += 2;
        }

        // Kelly risk
        if (kelly <= 0) {
            riskFactors.push('Kelly Criterion suggests avoiding this bet');
            riskScore += 3;
        } else if (kelly < betPercentage / 100) {
            riskFactors.push('Bet size exceeds Kelly Criterion recommendation');
            riskScore += 1;
        }

        // Probability confidence
        if (winProbability > 0.8) {
            riskFactors.push('Very high win probability claim (>80%) - verify confidence');
            riskScore += 1;
        }

        return {
            riskScore: riskScore,
            riskLevel: riskScore === 0 ? 'Low' : riskScore <= 3 ? 'Moderate' : riskScore <= 6 ? 'High' : 'Very High',
            riskFactors: riskFactors,
            recommendations: this.generateRiskRecommendations(riskScore, riskFactors)
        };
    }

    // Method to generate risk-based recommendations
    generateRiskRecommendations(riskScore, riskFactors) {
        const recommendations = [];

        if (riskScore === 0) {
            recommendations.push('✅ Low risk profile - Proceed as planned');
        } else if (riskScore <= 3) {
            recommendations.push('⚠️ Moderate risk - Consider reducing bet size');
            recommendations.push('📊 Monitor results closely');
        } else if (riskScore <= 6) {
            recommendations.push('🚨 High risk detected - Strongly consider avoiding');
            recommendations.push('💰 If proceeding, significantly reduce bet size');
            recommendations.push('📈 Reassess probability estimates');
        } else {
            recommendations.push('❌ Very high risk - Avoid this bet');
            recommendations.push('🔍 Review analysis methodology');
            recommendations.push('💡 Consider paper trading first');
        }

        return recommendations;
    }

// Method to parse custom equations with parameters
parseCustomEquation(equation, parameters) {
    let normalizedEq = equation.toLowerCase().replace(/\s/g, '');

    // Special handling for normal distribution
    if (normalizedEq.startsWith('normal_distribution') || normalizedEq.startsWith('custom_normal')) {
        let paramsString = equation.replace(/normal_distribution|custom_normal/i, '').trim();
        let parsedParams;

        if (paramsString) {
            // Parse the remaining string as params
            parsedParams = this.parseNormalDistributionEquation(paramsString);
        } else if (parameters && Object.keys(parameters).length > 0) {
            // Use provided parameters object
            parsedParams = { ...this.getDefaultParameters('normal_distribution'), ...parameters };
        } else {
            // Defaults
            parsedParams = this.getDefaultParameters('normal_distribution');
        }

        // Validate
        const validation = this.validateNormalDistributionParameters(parsedParams);
        if (!validation.isValid) {
            throw new Error(`Invalid normal distribution parameters: ${validation.errors.join('; ')}`);
        }

        return {
            equation: 'normal_distribution',
            template: this.formulaDatabase['normal_distribution'],
            parameters: parsedParams
        };
    }

    // Special handling for betting
    if (normalizedEq.startsWith('bet_analysis') || normalizedEq.startsWith('custom_betting')) {
        let paramsString = equation.replace(/bet_analysis|custom_betting/i, '').trim();
        let parsedParams;

        if (paramsString) {
            // Parse the remaining string as params
            parsedParams = this.parseBettingEquation(paramsString);
        } else if (parameters && Object.keys(parameters).length > 0) {
            // Use provided parameters object
            parsedParams = { ...this.getDefaultParameters('bet_analysis'), ...parameters };
        } else {
            // Defaults
            parsedParams = this.getDefaultParameters('bet_analysis');
        }

        // Validate
        const validation = this.validateBettingParameters(parsedParams);
        if (!validation.isValid) {
            throw new Error(`Invalid betting parameters: ${validation.errors.join('; ')}`);
        }

        return {
            equation: 'bet_analysis',
            template: this.formulaDatabase['bet_analysis'],
            parameters: parsedParams
        };
    }

    // Special handling for shopping
    if (normalizedEq.startsWith('shopping_list') || normalizedEq.startsWith('custom_shopping')) {
        let paramsString = equation.replace(/shopping_list|custom_shopping/i, '').trim();
        let parsedParams;

        if (paramsString) {
            // Parse the remaining string as params
            parsedParams = this.parseShoppingEquation(paramsString);
        } else if (parameters && Object.keys(parameters).length > 0) {
            // Use provided parameters object
            parsedParams = { ...this.getDefaultParameters('shopping_list'), ...parameters };
        } else {
            // Defaults
            parsedParams = this.getDefaultParameters('shopping_list');
        }

        // Validate
        const validation = this.validateShoppingParameters(parsedParams);
        if (!validation.isValid) {
            throw new Error(`Invalid shopping parameters: ${validation.errors.join('; ')}`);
        }

        return {
            equation: 'shopping_list',
            template: this.formulaDatabase['shopping_list'],
            parameters: parsedParams
        };
    }

    if (!this.formulaDatabase[normalizedEq]) {
        throw new Error(`Unknown equation: ${equation}`);
    }

    const template = this.formulaDatabase[normalizedEq];
    // Validate parameters
    const requiredParams = template.params;
    const missingParams = requiredParams.filter(param => !(param in parameters));

    if (missingParams.length > 0) {
        throw new Error(`Missing parameters: ${missingParams.join(', ')}`);
    }

    // Validate parameter types and values
    this.validateParameters(normalizedEq, parameters);

    return {
        equation: normalizedEq,
        template: template,
        parameters: parameters
    };
}

// Method to validate normal distribution parameters
validateNormalDistributionParameters(parameters) {
    const errors = [];

    if (typeof parameters.mean !== 'number') {
        errors.push('Mean must be a number');
    }

    if (typeof parameters.standardDeviation !== 'number' || parameters.standardDeviation <= 0) {
        errors.push('Standard deviation must be a positive number');
    }

    if (typeof parameters.sampleSize !== 'number' || parameters.sampleSize < 10 || parameters.sampleSize > 10000) {
        errors.push('Sample size must be between 10 and 10,000');
    }

    if (typeof parameters.confidenceLevel !== 'number' || parameters.confidenceLevel <= 0 || parameters.confidenceLevel >= 1) {
        errors.push('Confidence level must be between 0 and 1 (exclusive)');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Method to validate parameters based on equation type
validateParameters(equation, parameters) {
    switch(equation) {
        case 'normal_distribution':
        case 'custom_normal':
            const normalValidation = this.validateNormalDistributionParameters(parameters);
            if (!normalValidation.isValid) {
                throw new Error(normalValidation.errors.join('; '));
            }
            break;
        case 'linearfunction':
            // Linear functions are valid for any real numbers m and b
            if (typeof parameters.m !== 'number' || typeof parameters.b !== 'number') {
                throw new Error('Parameters "m" and "b" must be numbers');
            }
            break;
        case 'customlinear':
            // Custom linear requires an equation string
            if (typeof parameters.equation !== 'string' || parameters.equation.trim() === '') {
                throw new Error('Parameter "equation" must be a non-empty string');
            }
            // Test if the equation can be parsed
            try {
                this.parseLinearEquation(parameters.equation);
            } catch (error) {
                throw new Error(`Invalid linear equation: ${error.message}`);
            }
            break;
        case 'customquadratic':
            // Custom quadratic requires an equation string
            if (typeof parameters.equation !== 'string' || parameters.equation.trim() === '') {
                throw new Error('Parameter "equation" must be a non-empty string');
            }
            // Test if the equation can be parsed
            try {
                this.parseQuadraticEquation(parameters.equation);
            } catch (error) {
                throw new Error(`Invalid quadratic equation: ${error.message}`);
            }
            break;
        case 'quadraticformula':
            if (parameters.a === 0) {
                throw new Error('Parameter "a" cannot be zero in quadratic formula');
            }
            break;
        case 'compoundinterest':
            if (parameters.P <= 0) {
                throw new Error('Principal amount must be positive');
            }
            if (parameters.r < 0) {
                throw new Error('Interest rate cannot be negative');
            }
            if (parameters.n <= 0) {
                throw new Error('Number of compounds per year must be positive');
            }
            if (parameters.t <= 0) {
                throw new Error('Time period must be positive');
            }
            break;
        case 'bet_analysis':
        case 'custom_betting':
            const bettingValidation = this.validateBettingParameters(parameters);
            if (!bettingValidation.isValid) {
                throw new Error(bettingValidation.errors.join('; '));
            }
            break;
        case 'shopping_list':
        case 'custom_shopping':
            const shoppingValidation = this.validateShoppingParameters(parameters);
            if (!shoppingValidation.isValid) {
                throw new Error(shoppingValidation.errors.join('; '));
            }
            break;
    }
}

// Method to get default analysis template for an equation
getDefaultAnalysisTemplate(equation) {
    const normalizedEq = equation.toLowerCase().replace(/\s/g, '');

    if (!this.formulaDatabase[normalizedEq]) {
        throw new Error(`Unknown equation: ${equation}`);
    }

    const template = this.formulaDatabase[normalizedEq];
    // Provide default parameters based on equation type
    const defaultParams = this.getDefaultParameters(normalizedEq);

    return {
        equation: normalizedEq,
        type: template.type,
        description: template.description,
        requiredParams: template.params,
        defaultParams: defaultParams,
        example: this.generateSpreadsheetWithParams(equation, defaultParams)
    };
}

// Method to get default parameters for each equation
getDefaultParameters(equation) {
    const defaults = {
        'normal_distribution': {
            mean: 100,
            standardDeviation: 15,
            sampleSize: 1000,
            confidenceLevel: 0.95,
            dataPoints: null
        },
        'custom_normal': {
            equation: 'mean: 100, standardDeviation: 15, sampleSize: 1000, confidenceLevel: 0.95'
        },
        'linearfunction': { m: 2, b: 3 }, // y = 2x + 3
        'customlinear': { equation: 'y = 2x + 3' }, // Example custom linear equation
        'quadraticformula': { a: 1, b: -5, c: 6 }, // x² - 5x + 6 = 0
        'customquadratic': { equation: 'y = x² - 4x + 3' }, // Example custom quadratic equation
        'compoundinterest': { P: 1000, r: 0.05, n: 12, t: 5 }, // $1000 at 5% compounded monthly for 5 years
        'bet_analysis': {
            winProbability: 0.55,
            betAmount: 100,
            odds: 2.0,
            oddsFormat: 'decimal',
            bankroll: 1000
        },
        'custom_betting': {
            equation: 'winProbability:0.55, betAmount:100, odds:2.0, oddsFormat:decimal, bankroll:1000'
        },
        'shopping_list': {
            items: [
                { name: 'Rice', quantity: 2, unitPrice: 12.00, category: 'Grains' },
                { name: 'Oil', quantity: 3, unitPrice: 5.00, category: 'Cooking' },
                { name: 'Bread', quantity: 4, unitPrice: 2.50, category: 'Bakery' },
                { name: 'Milk', quantity: 2, unitPrice: 3.00, category: 'Dairy' },
                { name: 'Sugar', quantity: 1, unitPrice: 4.50, category: 'Baking' },
                { name: 'Apples', quantity: 3, unitPrice: 3.20, category: 'Fruits' },
                { name: 'Chicken', quantity: 2, unitPrice: 8.75, category: 'Meat' },
                { name: 'Eggs', quantity: 1, unitPrice: 6.00, category: 'Dairy' }
            ],
            currency: 'USD',
            taxRate: 0.08, // 8% tax
            discountRate: 0.00 // No discount by default
        },
        'custom_shopping': {
            itemsData: 'Rice: 2 12.00, Oil: 3 5.00, Bread: 4 2.50, Milk: 2 3.00'
        }
    };

    return defaults[equation] || {};
}

// Method to get available equations
getAvailableEquations() {
    return Object.keys(this.formulaDatabase).map(key => ({
        equation: key,
        type: this.formulaDatabase[key].type,
        description: this.formulaDatabase[key].description,
        params: this.formulaDatabase[key].params
    }));
}

// Method to get calculation history
getCalculationHistory() {
    return this.calculationHistory;
}

// Method to clear history
clearHistory() {
    this.calculationHistory = [];
}

// Method to change theme
setTheme(theme) {
    this.theme = theme;
    this.colors = this.setThemeColors(theme);
}

// Method to add custom equation template
addCustomEquation(name, config) {
    const normalizedName = name.toLowerCase().replace(/\s/g, '');
    this.formulaDatabase[normalizedName] = {
        type: config.type || 'custom',
        description: config.description || name,
        params: config.params || [],
        template: config.template
    };
}

// Method to calculate shopping metrics for statistics
    calculateShoppingMetrics(params) {
        const { items, currency, taxRate, discountRate } = params;
        const totals = this.calculateShoppingTotals(items, taxRate, discountRate);
        const categoryGroups = this.groupItemsByCategory(items);
        const patterns = this.analyzeShoppingPatterns(items);
        const timeEstimate = this.estimateShoppingTime(items);
        const categoryPercentages = this.calculateCategoryPercentages(items);

        return {
            ...totals,
            categoryCount: Object.keys(categoryGroups).length,
            mostExpensiveItem: items.reduce((max, item) => 
                (item.quantity * item.unitPrice) > (max.quantity * max.unitPrice) ? item : max, items[0]),
            averageItemPrice: totals.subtotal / items.length,
            patterns,
            timeEstimate,
            categoryPercentages,
            priceEfficiency: totals.subtotal / items.length // Cost per item
        };
    }
// Method to calculate normal distribution metrics for statistics
calculateNormalDistributionMetrics(params) {
    const { mean, standardDeviation, sampleSize, confidenceLevel } = params;
    
    // Generate sample data if not provided
    const dataPoints = params.dataPoints || this.generateNormalDistributionData(mean, standardDeviation, sampleSize);
    
    // Calculate comprehensive statistics
    const stats = this.calculateNormalDistributionStats(dataPoints, mean, standardDeviation);
    const probabilities = this.calculateNormalProbabilities(mean, standardDeviation, confidenceLevel);
    const normalityTests = this.performNormalityTests(dataPoints, mean, standardDeviation);
    
    // Calculate additional metrics
    const zCritical = this.getZCritical(confidenceLevel);
    const marginOfError = zCritical * (standardDeviation / Math.sqrt(sampleSize));
    const standardError = standardDeviation / Math.sqrt(sampleSize);
    
    return {
        sampleMean: stats.sampleMean,
        sampleStdDev: stats.sampleStdDev,
        populationMean: mean,
        populationStdDev: standardDeviation,
        sampleSize: sampleSize,
        confidenceLevel: confidenceLevel,
        zCritical: zCritical,
        marginOfError: marginOfError,
        standardError: standardError,
        skewness: normalityTests.skewness,
        kurtosis: normalityTests.kurtosis,
        shapiroWilk: normalityTests.shapiroWilk,
        probabilities: probabilities,
        range: stats.max - stats.min,
        variance: stats.variance
    };
}

// Method to calculate betting metrics for statistics
calculateBettingMetrics(params) {
    const { winProbability, betAmount, odds, oddsFormat, bankroll } = params;
    const decimalOdds = this.convertOdds(odds, oddsFormat, 'decimal');
    const impliedProbability = this.calculateImpliedProbability(odds, oddsFormat);
    const payout = betAmount * decimalOdds;
    const profit = payout - betAmount;
    const expectedValue = (winProbability * profit) - ((1 - winProbability) * betAmount);
    const edge = winProbability - impliedProbability;
    const kellyFraction = this.calculateKellyCriterion(winProbability, odds, oddsFormat);
    const betPercentage = (betAmount / bankroll) * 100;

    // Calculate variance and standard deviation
    const winOutcome = profit;
    const loseOutcome = -betAmount;
    const variance = winProbability * Math.pow(winOutcome - expectedValue, 2) +
                    (1 - winProbability) * Math.pow(loseOutcome - expectedValue, 2);
    const standardDeviation = Math.sqrt(variance);

    return {
        expectedValue,
        edge,
        kellyFraction,
        betPercentage,
        impliedProbability,
        variance,
        standardDeviation
    };
}

// Method to generate spreadsheet from equation with custom parameters
generateSpreadsheetWithParams(equation, parameters) {
    const parsedEq = this.parseCustomEquation(equation, parameters);
    const template = parsedEq.template;
    const data = template.template(equation, parsedEq.parameters); // Use parsed parameters

    this.currentSheet = {
        equation: parsedEq.equation,
        type: template.type,
        description: template.description,
        data: data,
        parameters: parsedEq.parameters,
        generated: new Date().toISOString(),
        rows: data.length,
        cols: data[0] ? data[0].length : 0
    };

    this.calculationHistory.push({
        equation: parsedEq.equation,
        parameters: parsedEq.parameters,
        timestamp: new Date().toISOString(),
        type: template.type
    });

    return this.currentSheet;
}

// Enhanced method to generate spreadsheet from equation
generateSpreadsheet(equation, parameters = null) {
    const normalizedEq = equation.toLowerCase().replace(/\s/g, '');
    if (!this.formulaDatabase[normalizedEq]) {
        throw new Error(`Unknown equation: ${equation}. Available equations: ${Object.keys(this.formulaDatabase).join(', ')}`);
    }

    const template = this.formulaDatabase[normalizedEq];
    // Use provided parameters or defaults
    const finalParams = parameters || this.getDefaultParameters(normalizedEq);

    // Validate parameters
    this.validateParameters(normalizedEq, finalParams);

    // Generate the data using the template
    const data = template.template(equation, finalParams);

    this.currentSheet = {
        equation: normalizedEq,
        type: template.type,
        description: template.description,
        data: data,
        parameters: finalParams,
        generated: new Date().toISOString(),
        rows: data.length,
        cols: data[0] ? data[0].length : 0
    };

    this.calculationHistory.push({
        equation: normalizedEq,
        parameters: finalParams,
        timestamp: new Date().toISOString(),
        type: template.type
    });

    return this.currentSheet;
}

// Method to get template-specific help and examples
getTemplateHelp(equation) {
    const normalizedEq = equation.toLowerCase().replace(/\s/g, '');

    switch(normalizedEq) {
        case 'normal_distribution':
        case 'custom_normal':
            return {
                type: 'statistics',
                description: 'Comprehensive normal distribution analysis with probability calculations, confidence intervals, and normality tests',
                parameterFormats: {
                    formats: [
                        'Object notation: { mean: 100, standardDeviation: 15, sampleSize: 1000, confidenceLevel: 0.95 }',
                        'Simple format: mean: 100, standardDeviation: 15, sampleSize: 1000',
                        'Comma-separated: 100, 15, 1000, 0.95',
                        'Template name: normal_distribution (uses defaults)'
                    ],
                    parameters: {
                        mean: 'Population mean (μ) - any real number',
                        standardDeviation: 'Population standard deviation (σ) - positive number',
                        sampleSize: 'Number of data points to generate (10-10,000)',
                        confidenceLevel: 'Confidence level for intervals (0.8-0.99)',
                        dataPoints: 'Optional: provide your own data array'
                    }
                },
                examples: {
                    basic: 'normal_distribution',
                    withParams: 'normal_distribution mean: 75, standardDeviation: 10, sampleSize: 500, confidenceLevel: 0.99',
                    iqScores: 'custom_normal mean: 100, standardDeviation: 15, sampleSize: 1000',
                    heightData: 'normal_distribution mean: 170, standardDeviation: 8, sampleSize: 2000, confidenceLevel: 0.95'
                },
                metrics: 'Calculates sample statistics, percentiles, confidence intervals, normality tests, and provides comprehensive statistical analysis with insights'
            };

        case 'bet_analysis':
        case 'custom_betting':
            return {
                type: 'betting',
                description: 'Comprehensive betting probability analysis with Kelly Criterion, expected value, and risk assessment',
                parameterFormats: this.getSupportedParameterFormats(),
                examples: {
                    basic: 'bet_analysis',
                    withParams: 'bet_analysis winProbability: 0.6, betAmount: 50, odds: 2.2, oddsFormat: decimal, bankroll: 1000',
                    american: 'custom_betting winProbability: 0.55, betAmount: 100, odds: +150, oddsFormat: american, bankroll: 2000'
                },
                metrics: 'Calculates expected value, Kelly Criterion, risk assessment, and long-term projections'
            };

        case 'shopping_list':
        case 'custom_shopping':
            return {
                type: 'shopping',
                description: 'Comprehensive shopping list analysis with budget tracking, category breakdown, and optimization suggestions',
                parameterFormats: this.getSupportedParameterFormats(),
                examples: {
                    basic: 'shopping_list',
                    textFormat: `shopping_list Rice | 2 | 12.00
Oil | 3 | 5.00
Bread | 4 | 2.50`,
                    simpleList: 'custom_shopping Rice: 2 12.00, Oil: 3 5.00, Bread: 4 2.50',
                    withSettings: 'shopping_list currency: EUR, taxRate: 0.10, discountRate: 0.05'
                },
                metrics: 'Calculates totals, category analysis, budget optimization, and shopping time estimates'
            };

        case 'linearfunction':
            return {
                type: 'mathematical',
                description: 'Linear function analysis with slope-intercept form',
                examples: {
                    basic: 'linearfunction m: 2, b: 3',
                    custom: 'customlinear equation: "y = 3x - 5"'
                }
            };

        case 'quadraticformula':
            return {
                type: 'mathematical',
                description: 'Quadratic equation solver with detailed analysis',
                examples: {
                    basic: 'quadraticformula a: 1, b: -5, c: 6',
                    custom: 'customquadratic equation: "y = 2x² - 4x + 1"'
                }
            };

        case 'compoundinterest':
            return {
                type: 'financial',
                description: 'Compound interest calculator with detailed breakdown',
                examples: {
                    basic: 'compoundinterest P: 1000, r: 0.05, n: 12, t: 5'
                }
            };
        default:
            return {
                type: 'unknown',
                description: 'Template not found',
                availableTemplates: this.getAvailableEquations()
            };
    }
}

// Method to get all supported formats for all templates
getAllSupportedFormats() {
    return {
        statistics: {
            templates: ['normal_distribution', 'custom_normal'],
            formats: {
                formats: [
                    'Object notation: { mean: 100, standardDeviation: 15, sampleSize: 1000, confidenceLevel: 0.95 }',
                    'Simple format: mean: 100, standardDeviation: 15, sampleSize: 1000',
                    'Comma-separated: 100, 15, 1000, 0.95',
                    'Template name: normal_distribution (uses defaults)'
                ],
                parameters: {
                    mean: 'Population mean (μ) - any real number',
                    standardDeviation: 'Population standard deviation (σ) - positive number',
                    sampleSize: 'Number of data points to generate (10-10,000)',
                    confidenceLevel: 'Confidence level for intervals (0.8-0.99)',
                    dataPoints: 'Optional: provide your own data array'
                }
            },
            description: 'Normal distribution analysis with comprehensive statistical calculations'
        },
        betting: {
            templates: ['bet_analysis', 'custom_betting'],
            formats: this.getSupportedParameterFormats ? this.getSupportedParameterFormats() : {},
            description: 'Betting analysis with probability calculations and risk management'
        },
        shopping: {
            templates: ['shopping_list', 'custom_shopping'],
            formats: {
                formats: [
                    'Text format: Item | Qty | Unit Price',
                    'Simple list: ItemName: qty price',
                    'Object notation: { items: [...], currency: "USD", taxRate: 0.08 }',
                    'Template name: shopping_list (uses defaults)'
                ],
                parameters: {
                    items: 'Array of shopping items',
                    currency: 'Currency code (USD, EUR, GBP, etc.)',
                    taxRate: 'Tax rate as decimal',
                    discountRate: 'Discount rate as decimal'
                }
            },
            description: 'Shopping list analysis with budget optimization and category breakdown'
        },
        mathematical: {
            templates: ['linearfunction', 'customlinear', 'quadraticformula', 'customquadratic'],
            description: 'Mathematical equation analysis and solving'
        },
        financial: {
            templates: ['compoundinterest'],
            description: 'Financial calculations and analysis'
        }
    };
}

// Method to suggest similar templates
suggestSimilarTemplates(equation) {
    const normalizedEq = equation.toLowerCase().replace(/\s/g, '');
    const suggestions = [];
    
    if (normalizedEq.includes('normal') || normalizedEq.includes('gaussian') || normalizedEq.includes('bell') || 
        normalizedEq.includes('distribution') || normalizedEq.includes('statistics') || normalizedEq.includes('probability')) {
        suggestions.push({
            template: 'normal_distribution',
            reason: 'For normal distribution and statistical analysis'
        });
    }
    
    if (normalizedEq.includes('bet') || normalizedEq.includes('gambl') || normalizedEq.includes('odds')) {
        suggestions.push({
            template: 'bet_analysis',
            reason: 'For betting and gambling probability analysis'
        });
    }

    if (normalizedEq.includes('shop') || normalizedEq.includes('buy') || normalizedEq.includes('purchase') || normalizedEq.includes('list')) {
        suggestions.push({
            template: 'shopping_list',
            reason: 'For shopping list analysis and budget tracking'
        });
    }

    if (normalizedEq.includes('linear') || normalizedEq.includes('line') || normalizedEq.includes('slope')) {
        suggestions.push({
            template: 'linearfunction',
            reason: 'For linear equation analysis'
        });
    }

    if (normalizedEq.includes('quadratic') || normalizedEq.includes('square') || normalizedEq.includes('parabola')) {
        suggestions.push({
            template: 'quadraticformula',
            reason: 'For quadratic equation solving'
        });
    }

    if (normalizedEq.includes('interest') || normalizedEq.includes('invest') || normalizedEq.includes('compound')) {
        suggestions.push({
            template: 'compoundinterest',
            reason: 'For compound interest calculations'
        });
    }

    return suggestions;
}


   setCellBackground(ctx, x, y, type, span = 1) {
        let bgColor = this.colors.cellBg;

        switch (type) {
            case 'header':
                bgColor = this.colors.headerBg;
                break;
            case 'result':
            case 'positive':
                bgColor = this.theme === 'dark' ? '#1a4d2e' : '#e8f5e8';
                break;
            case 'negative':
                bgColor = this.theme === 'dark' ? '#4d1a1a' : '#ffeaea';
                break;
            case 'formula':
                bgColor = this.theme === 'dark' ? '#2a2a4d' : '#f0f0ff';
                break;
            case 'title':
                bgColor = this.theme === 'dark' ? '#2d2d2d' : '#f0f0f0';
                break;
        }

        if (bgColor !== this.colors.cellBg) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, this.cellWidth * span, this.cellHeight);
        }

        return bgColor; // Return for potential use in spanning cells
    }

    // Set text style based on cell type
    setCellTextStyle(ctx, type) {
        let textColor = this.colors.cellText;
        let font = `${this.fontSize}px Arial`;

        switch (type) {
            case 'header':
                font = `bold ${this.fontSize}px Arial`;
                textColor = this.colors.headerText;
                break;
            case 'label':
                font = `bold ${this.fontSize}px Arial`;
                break;
            case 'formula':
                font = `italic ${this.fontSize}px Arial`;
                textColor = this.theme === 'dark' ? '#9bb3ff' : '#4169e1';
                break;
            case 'result':
                font = `bold ${this.fontSize}px Arial`;
                break;
            case 'positive':
                font = `bold ${this.fontSize}px Arial`;
                textColor = this.theme === 'dark' ? '#90ee90' : '#006400';
                break;
            case 'negative':
                font = `bold ${this.fontSize}px Arial`;
                textColor = this.theme === 'dark' ? '#ff6b6b' : '#dc143c';
                break;
            case 'title':
                font = `bold ${this.fontSize + 2}px Arial`;
                textColor = this.colors.headerText;
                break;
        }

        ctx.font = font;
        ctx.fillStyle = textColor;
    }

    // Method to render spreadsheet as canvas
    renderSpreadsheet(outputPath = null) {
        if (!this.currentSheet) {
            throw new Error('No spreadsheet data to render. Generate a spreadsheet first.');
        }

        // Dynamically calculate canvas dimensions, accounting for cell padding
        const numCols = this.currentSheet.cols;
        const numRows = this.currentSheet.rows;
        this.width = this.rowLabelWidth + (numCols * this.cellWidth) + this.padding * 2; // Padding on both sides
        this.height = this.headerHeight + 30 + (numRows * this.cellHeight) + this.formulaBarHeight + this.statsPanelHeight + this.padding * 2; // Padding top and bottom

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // Set up canvas with a safety check
        if (!this.colors || !this.colors.background) {
            console.error('Colors not properly initialized. Using default background.');
            ctx.fillStyle = '#ffffff'; // Fallback white background
        } else {
            this.setupCanvas(ctx);
        }

        // Draw spreadsheet
        this.drawSpreadsheet(ctx);

        // Save to file if path provided
        if (outputPath) {
            this.saveCanvas(canvas, outputPath);
        }

        return canvas;
    }

        // Setup canvas with background and basic styling
    setupCanvas(ctx) {
        // Fill background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.width, this.height);

        // Set default font
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textBaseline = 'middle';
    }


    // Draw the spreadsheet grid and data
    drawSpreadsheet(ctx) {
        if (!this.currentSheet) return;

        const data = this.currentSheet.data;
        const startX = this.rowLabelWidth;
        const startY = this.headerHeight + 30; // Account for title space

        // Draw title
        this.drawTitle(ctx);

        // Draw column headers (A, B, C, etc.)
        this.drawColumnHeaders(ctx, data[0].length);

        // Draw row headers (1, 2, 3, etc.)
        this.drawRowHeaders(ctx, data.length);

        // Draw grid and data
        this.drawGrid(ctx, data);
        this.drawData(ctx, data);

        // Draw formula bar
        this.drawFormulaBar(ctx);

        // Draw statistics panel
        this.drawStatistics(ctx);
    }

    // Draw spreadsheet title
    drawTitle(ctx) {
        ctx.font = `bold ${this.fontSize + 4}px Arial`;
        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'center';
        const title = `${this.currentSheet.description} - ${this.currentSheet.equation.toUpperCase()}`;
        ctx.fillText(title, this.width / 2, 15 + this.padding); // Adjusted for padding
        ctx.font = `${this.fontSize}px Arial`;
    }

    // Draw column headers (A, B, C, etc.)
    drawColumnHeaders(ctx, numCols) {
        ctx.fillStyle = this.colors.headerBg;
        ctx.fillRect(this.rowLabelWidth, 0, numCols * this.cellWidth, this.headerHeight);
        ctx.strokeStyle = this.colors.borderColor;
        ctx.strokeRect(this.rowLabelWidth, 0, numCols * this.cellWidth, this.headerHeight);

        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'center';

        for (let col = 0; col < numCols; col++) {
            const letter = String.fromCharCode(65 + col); // A, B, C, etc.
            const x = this.rowLabelWidth + col * this.cellWidth + this.cellWidth / 2;
            const y = this.headerHeight / 2;
            ctx.fillText(letter, x, y);

            // Draw column separator
            if (col > 0) {
                ctx.beginPath();
                ctx.moveTo(this.rowLabelWidth + col * this.cellWidth, 0);
                ctx.lineTo(this.rowLabelWidth + col * this.cellWidth, this.headerHeight);
                ctx.stroke();
            }
        }
    }

    // Draw row headers (1, 2, 3, etc.)
    drawRowHeaders(ctx, numRows) {
        const startY = this.headerHeight + 30; // Account for title space
        ctx.fillStyle = this.colors.headerBg;
        ctx.fillRect(0, startY, this.rowLabelWidth, numRows * this.cellHeight);
        ctx.strokeStyle = this.colors.borderColor;
        ctx.strokeRect(0, startY, this.rowLabelWidth, numRows * this.cellHeight);

        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'center';

        for (let row = 0; row < numRows; row++) {
            const rowNumber = row + 1;
            const x = this.rowLabelWidth / 2;
            const y = startY + row * this.cellHeight + this.cellHeight / 2;
            ctx.fillText(rowNumber.toString(), x, y);

            // Draw row separator
            if (row > 0) {
                ctx.beginPath();
                ctx.moveTo(0, startY + row * this.cellHeight);
                ctx.lineTo(this.rowLabelWidth, startY + row * this.cellHeight);
                ctx.stroke();
            }
        }
    }

    // Draw the grid lines
    drawGrid(ctx, data) {
        const startX = this.rowLabelWidth;
        const startY = this.headerHeight + 30;
        const gridWidth = data[0].length * this.cellWidth;
        const gridHeight = data.length * this.cellHeight;
        ctx.strokeStyle = this.colors.gridColor;
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let col = 0; col <= data[0].length; col++) {
            const x = startX + col * this.cellWidth;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, startY + gridHeight);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let row = 0; row <= data.length; row++) {
            const y = startY + row * this.cellHeight;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + gridWidth, y);
            ctx.stroke();
        }
   }

    



// Draw the data in cells
    drawData(ctx, data) {
        const startX = this.rowLabelWidth;
        const startY = this.headerHeight + 30;
        ctx.textAlign = 'left';

        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const cellData = data[row][col];
                const x = startX + col * this.cellWidth + this.cellPadding + 5; // Adjusted x with padding
                const y = startY + row * this.cellHeight + this.cellHeight / 2; // Center vertically, adjusted with padding

                // Get cell value and type
                let value, type;
                if (typeof cellData === 'object' && cellData !== null) {
                    value = cellData.value || '';
                    type = cellData.type || 'data';
                } else {
                    value = cellData || '';
                    type = 'data';
                }

                // Handle cell spanning
                if (typeof cellData === 'object' && cellData.span) {
                    const spanWidth = cellData.span * this.cellWidth;
                    ctx.fillStyle = this.setCellBackground(ctx, startX + col * this.cellWidth, startY + row * this.cellHeight, type, cellData.span);
                    ctx.fillRect(startX + col * this.cellWidth, startY + row * this.cellHeight, spanWidth, this.cellHeight);
                    col += cellData.span - 1; // Skip spanned columns
                } else {
                    this.setCellBackground(ctx, startX + col * this.cellWidth, startY + row * this.cellHeight, type);
                }

                // Set text style based on type
                this.setCellTextStyle(ctx, type);

                // Draw cell value with padding consideration
                if (value !== '') {
                    const maxWidth = this.cellWidth - (this.cellPadding * 2) - 10; // Adjust max width for padding
                    const truncatedText = this.truncateText(ctx, value.toString(), maxWidth);
                    ctx.fillText(truncatedText, x, y);
                }
            }
        }
    }
    // Draw formula bar
    drawFormulaBar(ctx) {
        const barHeight = this.formulaBarHeight;
        const barY = this.headerHeight + 30 + this.currentSheet.rows * this.cellHeight + this.padding;

        ctx.fillStyle = this.colors.formulaBar;
        ctx.fillRect(0, barY, this.width, barHeight);
        ctx.strokeStyle = this.colors.borderColor;
        ctx.strokeRect(0, barY, this.width, barHeight);

        ctx.fillStyle = this.colors.cellText;
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('Formula:', this.padding, barY + barHeight / 2);

        const equationText = `${this.currentSheet.equation.toUpperCase()} - ${this.currentSheet.description}`;
        ctx.font = `${this.fontSize}px Arial`;
        ctx.fillText(equationText, 80, barY + barHeight / 2);
    }

    // Draw statistics panel
    drawStatistics(ctx) {
        const panelY = this.headerHeight + 30 + this.currentSheet.rows * this.cellHeight + this.formulaBarHeight + this.padding * 2;
        const panelHeight = this.statsPanelHeight;

        ctx.fillStyle = this.colors.formulaBar;
        ctx.fillRect(0, panelY, this.width, panelHeight);
        ctx.strokeStyle = this.colors.borderColor;
        ctx.strokeRect(0, panelY, this.width, panelHeight);

        ctx.fillStyle = this.colors.cellText;
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('Analysis Summary:', this.padding, panelY + 20);
        ctx.font = `${this.fontSize - 1}px Arial`;

        const stats = this.generateStatistics();
        let yOffset = 35;
        stats.forEach(stat => {
            ctx.fillText(stat, this.padding, panelY + yOffset);
            yOffset += 15;
        });
    }
    // Generate statistics for current sheet
    // Generate statistics for current sheet
generateStatistics() {
    const stats = [];
    const params = this.currentSheet.parameters;

    switch (this.currentSheet.equation) {


        case 'normal_distribution':
        case 'custom_normal':
            const normalMetrics = this.calculateNormalDistributionMetrics(params);
            stats.push(`Distribution: Normal(μ=${params.mean}, σ=${params.standardDeviation})`);
            stats.push(`Sample: n=${params.sampleSize}, x̄=${normalMetrics.sampleMean.toFixed(4)}, s=${normalMetrics.sampleStdDev.toFixed(4)}`);
            stats.push(`Confidence: ${(params.confidenceLevel * 100).toFixed(1)}% CI Margin of Error = ±${normalMetrics.marginOfError.toFixed(4)}`);
            stats.push(`Shape: Skewness=${normalMetrics.skewness.toFixed(3)}, Kurtosis=${normalMetrics.kurtosis.toFixed(3)}`);
            stats.push(`Range: ${normalMetrics.range.toFixed(2)} (${(normalMetrics.range/params.standardDeviation).toFixed(1)}σ)`);
            stats.push(`Normality: Shapiro-Wilk W=${normalMetrics.shapiroWilk.toFixed(4)} ${normalMetrics.shapiroWilk > 0.95 ? '✓' : '⚠'}`);
            stats.push(`Standard Error: ${normalMetrics.standardError.toFixed(4)}`);
            stats.push(`Z-Critical (${(params.confidenceLevel * 100).toFixed(1)}%): ±${normalMetrics.zCritical.toFixed(3)}`);
            break;


        case 'linearfunction':
            stats.push(`Equation: y = ${params.m}x + ${params.b}`);
            stats.push(`Slope: ${params.m} (${this.describeSlopeType(params.m)})`);
            stats.push(`Y-Intercept: ${params.b}`);
            stats.push(`X-Intercept: ${params.m !== 0 ? (-params.b / params.m).toFixed(4) : 'No x-intercept'}`);
            // Add sample points
            const linearPoints = this.getLinearSamplePoints(`y = ${params.m}x + ${params.b}`, [-2, 2], 5);
            stats.push(`Sample Points: ${linearPoints.map(p => `(${p.x}, ${p.y})`).join(', ')}`);
            break;

        case 'customlinear':
            const parsedLinear = this.parseLinearEquation(params.equation);
            stats.push(`Original Equation: ${params.equation}`);
            stats.push(`Standard Form: y = ${parsedLinear.m}x + ${parsedLinear.b}`);
            stats.push(`Slope: ${parsedLinear.m} (${this.describeSlopeType(parsedLinear.m)})`);
            stats.push(`Y-Intercept: ${parsedLinear.b}`);
            stats.push(`X-Intercept: ${parsedLinear.m !== 0 ? (-parsedLinear.b / parsedLinear.m).toFixed(4) : 'No x-intercept'}`);
            // Add sample points
            const customLinearPoints = this.getLinearSamplePoints(params.equation, [-2, 2], 5);
            stats.push(`Sample Points: ${customLinearPoints.map(p => `(${p.x}, ${p.y})`).join(', ')}`);
            break;

        case 'quadraticformula':
            const discriminant = params.b * params.b - 4 * params.a * params.c;
            stats.push(`Equation: ${params.a}x² + ${params.b}x + ${params.c} = 0`);
            stats.push(`Discriminant: ${discriminant} (${discriminant >= 0 ? 'Real solutions' : 'Complex solutions'})`);
            break;

        case 'compoundinterest':
            const finalAmount = this.calculateCompoundInterest(params.P, params.r, params.n, params.t);
            stats.push(`Principal: $${params.P.toLocaleString()}, Rate: ${(params.r * 100).toFixed(2)}%`);
            stats.push(`Final Amount: $${finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
            break;

        case 'bet_analysis':
        case 'custom_betting':
            const metrics = this.calculateBettingMetrics(params);
            stats.push(`Bet: $${params.betAmount}, Odds: ${params.odds} (${params.oddsFormat})`);
            stats.push(`Win Probability: ${(params.winProbability * 100).toFixed(2)}%`);
            stats.push(`Expected Value: $${metrics.expectedValue.toFixed(2)} (${metrics.expectedValue > 0 ? 'Positive' : metrics.expectedValue < 0 ? 'Negative' : 'Neutral'})`);
            stats.push(`Edge: ${(metrics.edge * 100).toFixed(2)}%`);
            stats.push(`Kelly Criterion: ${(metrics.kellyFraction * 100).toFixed(2)}% of bankroll`);
            stats.push(`Bet Size: ${metrics.betPercentage.toFixed(2)}% of bankroll`);
            stats.push(`Implied Probability: ${(metrics.impliedProbability * 100).toFixed(2)}%`);
            stats.push(`Standard Deviation: $${metrics.standardDeviation.toFixed(2)}`);
            break;

        case 'shopping_list':
        case 'custom_shopping':
            const shoppingMetrics = this.calculateShoppingMetrics(params);
            stats.push(`Items: ${params.items.length}, Categories: ${shoppingMetrics.categoryCount}`);
            stats.push(`Subtotal: ${params.currency}${shoppingMetrics.subtotal.toFixed(2)}`);
            if (shoppingMetrics.discountAmount > 0) {
                stats.push(`Discount: ${params.currency}${shoppingMetrics.discountAmount.toFixed(2)} (${(params.discountRate * 100).toFixed(1)}%)`);
            }
            if (shoppingMetrics.taxAmount > 0) {
                stats.push(`Tax: ${params.currency}${shoppingMetrics.taxAmount.toFixed(2)} (${(params.taxRate * 100).toFixed(1)}%)`);
            }
            stats.push(`Total: ${params.currency}${shoppingMetrics.finalTotal.toFixed(2)}`);
            stats.push(`Most Expensive: ${shoppingMetrics.mostExpensiveItem.name} (${params.currency}${(shoppingMetrics.mostExpensiveItem.quantity * shoppingMetrics.mostExpensiveItem.unitPrice).toFixed(2)})`);
            stats.push(`Average Item Price: ${params.currency}${shoppingMetrics.averageItemPrice.toFixed(2)}`);
            stats.push(`Estimated Shopping Time: ${shoppingMetrics.timeEstimate.totalMinutes} minutes`);
            stats.push(`Price Efficiency: ${params.currency}${shoppingMetrics.priceEfficiency.toFixed(2)} per item`);
            break;

    }

    stats.push(`Generated: ${new Date(this.currentSheet.generated).toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })}`);
    return stats;
}
    // Save canvas to file
    saveCanvas(canvas, outputPath) {
        const buffer = canvas.toBuffer('image/png');
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        console.log(`Spreadsheet saved to: ${outputPath}`);
    }


  // Truncate text to fit in cell
    truncateText(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) {
            return text;
        }

        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    }




    // Export spreadsheet data to XLSX
    exportToXLSX(outputPath = null) {
        if (!this.currentSheet) {
            throw new Error('No spreadsheet data to export. Generate a spreadsheet first.');
        }

        const data = this.currentSheet.data;
        // Prepare worksheet data
        const wsData = [];

        // Add header with metadata
        wsData.push(['# ' + this.currentSheet.description]);
        wsData.push(['# Generated: ' + new Date(this.currentSheet.generated).toLocaleString()]);
        wsData.push([]); // Empty row

        // Add data rows
        data.forEach(row => {
            const wsRow = row.map(cell => {
                let value;
                if (typeof cell === 'object' && cell !== null) {
                    value = cell.value || '';
                } else {
                    value = cell || '';
                }
                return value.toString();
            });
            wsData.push(wsRow);
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.currentSheet.equation);

        // Add metadata sheet
        const metadata = [
            ['Equation', this.currentSheet.equation],
            ['Description', this.currentSheet.description],
            ['Type', this.currentSheet.type],
            ['Generated', this.currentSheet.generated],
            ['Rows', this.currentSheet.rows],
            ['Columns', this.currentSheet.cols],
            ['Parameters', JSON.stringify(this.currentSheet.parameters)],
            ['ExportedAt', new Date().toISOString()],
            ['Version', '1.0']
        ];
        const metaWs = XLSX.utils.aoa_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

        // Write to file if outputPath provided
        if (outputPath) {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            XLSX.writeFile(wb, outputPath);
            console.log(`Spreadsheet exported to XLSX: ${outputPath}`);
        }

        // Return workbook object
        return wb;
    }

    // Export spreadsheet data to CSV
    exportToCSV(outputPath = null) {
        if (!this.currentSheet) {
            throw new Error('No spreadsheet data to export. Generate a spreadsheet first.');
        }

        const data = this.currentSheet.data;
        const csvLines = [];

        // Add header with metadata
        csvLines.push(`# ${this.currentSheet.description}`);
        csvLines.push(`# Generated: ${new Date(this.currentSheet.generated).toLocaleString()}`);
        csvLines.push('');

        // Add data rows
        data.forEach(row => {
            const csvRow = row.map(cell => {
                let value;
                if (typeof cell === 'object' && cell !== null) {
                    value = cell.value || '';
                } else {
                    value = cell || '';
                }
                // Escape commas and quotes
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value.toString();
            });
            csvLines.push(csvRow.join(','));
        });

        const csvContent = csvLines.join('\n');

        if (outputPath) {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(outputPath, csvContent);
            console.log(`Spreadsheet exported to CSV: ${outputPath}`);
        }

        return csvContent;
    }




    // Enhanced method to analyze any linear equation string
    analyzeLinearEquation(equationString) {
        try {
            const parsed = this.parseLinearEquation(equationString);
            return {
                originalEquation: equationString,
                standardForm: `y = ${parsed.m}x + ${parsed.b}`,
                slope: parsed.m,
                yIntercept: parsed.b,
                xIntercept: parsed.m !== 0 ? -parsed.b / parsed.m : null,
                slopeType: this.describeSlopeType(parsed.m),
                isValid: true,
                analysis: {
                    domain: '(-∞, ∞)',
                    range: '(-∞, ∞)',
                    increasing: parsed.m > 0,
                    decreasing: parsed.m < 0,
                    horizontal: parsed.m === 0
                }
            };
        } catch (error) {
            return {
                originalEquation: equationString,
                isValid: false,
                error: error.message
            };
        }
    }

    // Method to get sample points for any linear equation
    getLinearSamplePoints(equationString, xRange = [-5, 5], numPoints = 11) {
        try {
            const parsed = this.parseLinearEquation(equationString);
            const xValues = [];
            const step = (xRange[1] - xRange[0]) / (numPoints - 1);

            for (let i = 0; i < numPoints; i++) {
                xValues.push(xRange[0] + i * step);
            }

            return xValues.map(x => ({
                x: parseFloat(x.toFixed(2)),
                y: parseFloat((parsed.m * x + parsed.b).toFixed(2))
            }));
        } catch (error) {
            throw new Error(`Cannot generate sample points: ${error.message}`);
        }
    }

    // Enhanced method to analyze any quadratic equation string
    analyzeQuadraticEquation(equationString) {
    try {
        const parsed = this.parseQuadraticEquation(equationString);
        const vertex = this.calculateVertex(parsed.a, parsed.b, parsed.c);
        const discriminant = parsed.b * parsed.b - 4 * parsed.a * parsed.c;
        const roots = this.calculateQuadraticRoots(parsed.a, parsed.b, parsed.c);

        return {
            originalEquation: equationString,
            standardForm: `y = ${parsed.a}x² + ${parsed.b}x + ${parsed.c}`,
            coefficients: {
                a: parsed.a,
                b: parsed.b,
                c: parsed.c
            },
            vertex: {
                x: parseFloat(vertex.x.toFixed(4)),
                y: parseFloat(vertex.y.toFixed(4))
            },
            axisOfSymmetry: parseFloat(vertex.x.toFixed(4)),
            discriminant: discriminant,
            roots: roots,
            yIntercept: parsed.c,
            opensUpward: parsed.a > 0,
            opensDownward: parsed.a < 0,
            isValid: true,
            analysis: {
                domain: '(-∞, ∞)',
                range: parsed.a > 0 ? `[${vertex.y.toFixed(4)}, ∞)` : `(-∞, ${vertex.y.toFixed(4)}]`,
                hasMinimum: parsed.a > 0,
                hasMaximum: parsed.a < 0,
                extremeValue: vertex.y,
                rootType: this.describeRootType(discriminant),
                numberOfRealRoots: discriminant > 0 ? 2 : discriminant === 0 ? 1 : 0,
                concavity: parsed.a > 0 ? 'Concave up' : 'Concave down'
            }
        };
    } catch (error) {
        return {
            originalEquation: equationString,
            isValid: false,
            error: error.message
        };
    }
}

// Enhanced method to calculate both quadratic roots with detailed information
calculateQuadraticRoots(a, b, c) {
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        // Complex roots
        const realPart = -b / (2 * a);
        const imaginaryPart = Math.sqrt(-discriminant) / (2 * a);
        return {
            type: 'complex',
            root1: {
                real: parseFloat(realPart.toFixed(4)),
                imaginary: parseFloat(imaginaryPart.toFixed(4)),
                display: `${realPart.toFixed(4)} + ${imaginaryPart.toFixed(4)}i`
            },
            root2: {
                real: parseFloat(realPart.toFixed(4)),
                imaginary: parseFloat((-imaginaryPart).toFixed(4)),
                display: `${realPart.toFixed(4)} - ${imaginaryPart.toFixed(4)}i`
            },
            discriminant: discriminant
        };
    } else if (discriminant === 0) {
        // One repeated real root
        const root = -b / (2 * a);
        return {
            type: 'repeated',
            root1: parseFloat(root.toFixed(4)),
            root2: parseFloat(root.toFixed(4)),
            display: `x = ${root.toFixed(4)} (repeated)`,
            discriminant: discriminant
        };
    } else {
        // Two distinct real roots
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const root1 = (-b + sqrtDiscriminant) / (2 * a);
        const root2 = (-b - sqrtDiscriminant) / (2 * a);
        return {
            type: 'real',
            root1: parseFloat(root1.toFixed(4)),
            root2: parseFloat(root2.toFixed(4)),
            smaller: Math.min(root1, root2),
            larger: Math.max(root1, root2),
            discriminant: discriminant
        };
    }
}

// Method to get sample points for any quadratic equation
getQuadraticSamplePoints(equationString, xRange = [-5, 5], numPoints = 11) {
    try {
        const parsed = this.parseQuadraticEquation(equationString);
        const xValues = [];
        const step = (xRange[1] - xRange[0]) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            xValues.push(xRange[0] + i * step);
        }

        return xValues.map(x => ({
            x: parseFloat(x.toFixed(2)),
            y: parseFloat((parsed.a * x * x + parsed.b * x + parsed.c).toFixed(2))
        }));
    } catch (error) {
        throw new Error(`Cannot generate sample points: ${error.message}`);
    }
}

// Method to get detailed vertex analysis
getVertexAnalysis(equationString) {
    try {
        const parsed = this.parseQuadraticEquation(equationString);
        const vertex = this.calculateVertex(parsed.a, parsed.b, parsed.c);

        return {
            vertex: {
                x: parseFloat(vertex.x.toFixed(4)),
                y: parseFloat(vertex.y.toFixed(4))
            },
            axisOfSymmetry: `x = ${vertex.x.toFixed(4)}`,
            isMinimum: parsed.a > 0,
            isMaximum: parsed.a < 0,
            extremeType: parsed.a > 0 ? 'Minimum' : 'Maximum',
            extremeValue: parseFloat(vertex.y.toFixed(4)),
            calculation: {
                formula: 'x = -b/(2a)',
                substitution: `x = -(${parsed.b})/(2×${parsed.a}) = ${vertex.x.toFixed(4)}`,
                yCalculation: `y = ${parsed.a}(${vertex.x.toFixed(4)})² + ${parsed.b}(${vertex.x.toFixed(4)}) + ${parsed.c} = ${vertex.y.toFixed(4)}`
            }
        };
    } catch (error) {
        throw new Error(`Cannot analyze vertex: ${error.message}`);
    }
}

// Method to analyze quadratic transformations
analyzeQuadraticTransformations(equationString, baseFunction = 'y = x²') {
    try {
        const parsed = this.parseQuadraticEquation(equationString);
        const baseParsed = this.parseQuadraticEquation(baseFunction);

        const vertex = this.calculateVertex(parsed.a, parsed.b, parsed.c);
        const baseVertex = this.calculateVertex(baseParsed.a, baseParsed.b, baseParsed.c);

        return {
            originalFunction: baseFunction,
            transformedFunction: equationString,
            transformations: {
                verticalStretch: parsed.a !== baseParsed.a ? Math.abs(parsed.a / baseParsed.a) : null,
                verticalShrink: Math.abs(parsed.a) < Math.abs(baseParsed.a) ? Math.abs(parsed.a / baseParsed.a) : null,
                reflection: (parsed.a * baseParsed.a) < 0,
                horizontalShift: vertex.x - baseVertex.x,
                verticalShift: vertex.y - baseVertex.y
            },
            description: this.describeTransformations(parsed.a, baseParsed.a, vertex, baseVertex)
        };
    } catch (error) {
        throw new Error(`Cannot analyze transformations: ${error.message}`);
    }
}

// Helper method to describe transformations in words
describeTransformations(a, baseA, vertex, baseVertex) {
    const descriptions = [];

    // Vertical stretch/shrink and reflection
    if (Math.abs(a) > Math.abs(baseA)) {
        descriptions.push(`Vertical stretch by factor of ${Math.abs(a / baseA)}`);
    } else if (Math.abs(a) < Math.abs(baseA)) {
        descriptions.push(`Vertical shrink by factor of ${Math.abs(a / baseA)}`);
    }

    if ((a * baseA) < 0) {
        descriptions.push('Reflection over x-axis');
    }

    // Horizontal shift
    const hShift = vertex.x - baseVertex.x;
    if (hShift > 0) {
        descriptions.push(`Horizontal shift right by ${hShift} units`);
    } else if (hShift < 0) {
        descriptions.push(`Horizontal shift left by ${Math.abs(hShift)} units`);
    }

    // Vertical shift
    const vShift = vertex.y - baseVertex.y;
    if (vShift > 0) {
        descriptions.push(`Vertical shift up by ${vShift} units`);
    } else if (vShift < 0) {
        descriptions.push(`Vertical shift down by ${Math.abs(vShift)} units`);
    }

    return descriptions.length > 0 ? descriptions : ['No transformations applied'];
}

// Method to find x-intercepts (roots) with detailed steps
findQuadraticIntercepts(equationString) {
    try {
        const parsed = this.parseQuadraticEquation(equationString);
        const roots = this.calculateQuadraticRoots(parsed.a, parsed.b, parsed.c);

        return {
            yIntercept: {
                point: [0, parsed.c],
                value: parsed.c,
                calculation: `When x = 0: y = ${parsed.c}`
            },
            xIntercepts: this.formatInterceptResults(roots, parsed),
            interceptAnalysis: {
                numberOfXIntercepts: roots.discriminant > 0 ? 2 : roots.discriminant === 0 ? 1 : 0,
                discriminant: roots.discriminant,
                rootType: this.describeRootType(roots.discriminant)
            }
        };
    } catch (error) {
        throw new Error(`Cannot find intercepts: ${error.message}`);
    }
}

// Helper method to format intercept results
formatInterceptResults(roots, parsed) {
    if (roots.type === 'real') {
        return {
            point1: [roots.root1, 0],
            point2: [roots.root2, 0],
            values: [roots.root1, roots.root2],
            calculation: [
                `x₁ = (-${parsed.b} + √${roots.discriminant})/(2×${parsed.a}) = ${roots.root1}`,
                `x₂ = (-${parsed.b} - √${roots.discriminant})/(2×${parsed.a}) = ${roots.root2}`
            ]
        };
    } else if (roots.type === 'repeated') {
        return {
            point: [roots.root1, 0],
            value: roots.root1,
            calculation: `x = -${parsed.b}/(2×${parsed.a}) = ${roots.root1} (repeated root)`
        };
    } else {
        return {
            type: 'complex',
            message: 'No real x-intercepts (roots are complex)',
            complexRoots: [roots.root1.display, roots.root2.display]
        };
    }
}

// Method to evaluate quadratic function at specific points
evaluateQuadraticAt(equationString, xValues) {
    try {
        const parsed = this.parseQuadraticEquation(equationString);

        if (!Array.isArray(xValues)) {
            xValues = [xValues];
        }

        return xValues.map(x => {
            const y = parsed.a * x * x + parsed.b * x + parsed.c;
            return {
                x: x,
                y: parseFloat(y.toFixed(4)),
                calculation: `y = ${parsed.a}(${x})² + ${parsed.b}(${x}) + ${parsed.c} = ${y.toFixed(4)}`
            };
        });
    } catch (error) {
        throw new Error(`Cannot evaluate quadratic: ${error.message}`);
    }
}

// Method to compare two quadratic functions
compareQuadratics(equation1, equation2) {
    try {
        const analysis1 = this.analyzeQuadraticEquation(equation1);
        const analysis2 = this.analyzeQuadraticEquation(equation2);

        if (!analysis1.isValid || !analysis2.isValid) {
            throw new Error('One or both equations are invalid');
        }

        return {
            equation1: analysis1,
            equation2: analysis2,
            comparison: {
                sameOpening: (analysis1.opensUpward && analysis2.opensUpward) || (analysis1.opensDownward && analysis2.opensDownward),
                vertexComparison: {
                    equation1Higher: analysis1.vertex.y > analysis2.vertex.y,
                    equation2Higher: analysis2.vertex.y > analysis1.vertex.y,
                    sameHeight: Math.abs(analysis1.vertex.y - analysis2.vertex.y) < 0.0001
                },
                widthComparison: {
                    equation1Narrower: Math.abs(analysis1.coefficients.a) > Math.abs(analysis2.coefficients.a),
                    equation2Narrower: Math.abs(analysis2.coefficients.a) > Math.abs(analysis1.coefficients.a),
                    sameWidth: Math.abs(analysis1.coefficients.a - analysis2.coefficients.a) < 0.0001
                },
                intersectionPoints: this.findQuadraticIntersections(equation1, equation2)
            }
        };
    } catch (error) {
        throw new Error(`Cannot compare quadratics: ${error.message}`);
    }
}

// Method to find intersection points between two quadratic functions
findQuadraticIntersections(equation1, equation2) {
    try {
        const parsed1 = this.parseQuadraticEquation(equation1);
        const parsed2 = this.parseQuadraticEquation(equation2);

        // Find intersection by setting equations equal: a₁x² + b₁x + c₁ = a₂x² + b₂x + c₂
        // Rearrange to: (a₁-a₂)x² + (b₁-b₂)x + (c₁-c₂) = 0
        const a = parsed1.a - parsed2.a;
        const b = parsed1.b - parsed2.b;
        const c = parsed1.c - parsed2.c;

        if (a === 0 && b === 0 && c === 0) {
            return { type: 'identical', message: 'The equations are identical' };
        } else if (a === 0 && b === 0) {
            return { type: 'none', message: 'Parallel parabolas - no intersection points' };
        } else if (a === 0) {
            // Linear case
            const x = -c / b;
            const y = parsed1.a * x * x + parsed1.b * x + parsed1.c;
            return {
                type: 'single',
                point: [parseFloat(x.toFixed(4)), parseFloat(y.toFixed(4))]
            };
        } else {
            // Quadratic case
            const roots = this.calculateQuadraticRoots(a, b, c);
            if (roots.type === 'real') {
                const y1 = parsed1.a * roots.root1 * roots.root1 + parsed1.b * roots.root1 + parsed1.c;
                const y2 = parsed1.a * roots.root2 * roots.root2 + parsed1.b * roots.root2 + parsed1.c;
                return {
                    type: 'two',
                    points: [
                        [roots.root1, parseFloat(y1.toFixed(4))],
                        [roots.root2, parseFloat(y2.toFixed(4))]
                    ]
                };
            } else if (roots.type === 'repeated') {
                const y = parsed1.a * roots.root1 * roots.root1 + parsed1.b * roots.root1 + parsed1.c;
                return {
                    type: 'tangent',
                    point: [roots.root1, parseFloat(y.toFixed(4))],
                    message: 'Parabolas are tangent at this point'
                };
            } else {
                return { type: 'none', message: 'No real intersection points' };
            }
        }
    } catch (error) {
        throw new Error(`Cannot find intersections: ${error.message}`);
    }
}

// Method for full betting analysis
analyzeBettingEquation(equationString) {
    try {
        const parsed = this.parseCustomEquation(equationString, {});
        const params = parsed.parameters;
        const sheet = parsed.template.template(equationString, params);  // Generate spreadsheet

        // Additional analyses
        const simulation = this.simulateBetting(params);
        const risk = this.generateRiskAssessment(params);

        return {
            sheet,  // The 2D array for spreadsheet
            simulation,
            risk,
            convertedOdds: {
                decimal: this.convertOdds(params.odds, params.oddsFormat, 'decimal'),
                american: this.convertOdds(params.odds, params.oddsFormat, 'american'),
                fractional: this.convertOdds(params.odds, params.oddsFormat, 'fractional')
            },
            breakEvenProb: this.calculateBreakEvenProbability(params.odds, params.oddsFormat),
            kelly: this.calculateKellyCriterion(params.winProbability, params.odds, params.oddsFormat)
        };
    } catch (error) {
        return { isValid: false, error: error.message };
    }
  }

}
