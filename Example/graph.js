// ./graphingCalculatorGame.js - Enhanced Version with Vector and Triangle Plotting Functionality

import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { GraphingCalculator, Theme } from '../lib/graph.js';

class GraphingCalculatorGame {
    constructor() {
        // Initialize graphing calculator
        this.calculator = new GraphingCalculator({
            size: 480,
            theme: Theme.Standard,
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
            showGrid: true,
            showAxes: true
        });
        
        // Counters and history
        this.equationCounter = 0;
        this.triangleCounter = 0;
        this.vectorCounter = 0;
        this.equationHistory = [];
        this.triangleHistory = [];
        this.vectorHistory = [];

        // Vector-specific settings
        this.vectorSettings = {
            arrowSize: 12,
            arrowColor: '#ff6600',
            componentColor: '#0066ff',
            resultantColor: '#ff0000',
            showComponents: true,
            showMagnitude: true,
            showAngle: true,
            show3D: false
        };




        // Complete formula database with descriptions
        this.formulaDatabase = {
            // Basic Linear Functions
            "y=2x+3": "Linear function: slope = 2, y-intercept = 3",
            "y=x+1": "Linear function: slope = 1, y-intercept = 1",
            "y=-x+5": "Linear function: slope = -1, y-intercept = 5",
            "y=0.5x-2": "Linear function: slope = 0.5, y-intercept = -2",
            "y=3x": "Linear function through origin: slope = 3",

            // Quadratic Functions
            "y=x**2": "Basic parabola opening upward",
            "y=-x**2": "Inverted parabola opening downward",
            "y=x**2+2x+1": "Quadratic function: y = (x+1)²",
            "y=2x**2-4x+1": "Quadratic function with vertex form transformation",
            "y=-0.5x**2+3x-2": "Downward opening parabola",
            "y=(x-1)**2": "Vertex form parabola: vertex at (1,0)",
            "y=2(x-3)**2+5": "Vertex form parabola: vertex at (3,5)",

            // Cubic and Higher Polynomials
            "y=x**3": "Basic cubic function",
            "y=x**3-3x**2+2x": "Cubic polynomial with local extrema",
            "y=x**4-2x**2": "Fourth-degree polynomial (W-shaped)",

            // Exponential Functions
            "y=2**x": "Exponential growth function, base 2",
            "y=0.5**x": "Exponential decay function",
            "y=e**x": "Natural exponential function",
            "y=e**(-x)": "Negative exponential decay",
            "y=2*e**(0.5x)": "Scaled exponential growth",

            // Logarithmic Functions
            "y=log(x)": "Natural logarithm function",
            "y=log(x,2)": "Logarithm base 2",
            "y=log(x+1)": "Shifted logarithm function",
            "y=-log(x)": "Reflected logarithm function",

            // Trigonometric Functions
            "y=sin(x)": "Sine wave function",
            "y=cos(x)": "Cosine wave function",
            "y=tan(x)": "Tangent function with vertical asymptotes",
            "y=2sin(x)": "Amplitude-scaled sine function",
            "y=sin(2x)": "Frequency-doubled sine function",
            "y=sin(x-pi/2)": "Phase-shifted sine function",
            "y=sin(x)+cos(x)": "Sum of sine and cosine",

            // Inverse Trigonometric Functions
            "y=asin(x)": "Arcsine function (inverse sine)",
            "y=acos(x)": "Arccosine function (inverse cosine)",
            "y=atan(x)": "Arctangent function (inverse tangent)",

            // Absolute Value Functions
            "y=abs(x)": "Absolute value function (V-shape)",
            "y=abs(x-2)": "Shifted absolute value function",
            "y=abs(x)+abs(x-4)": "Sum of two absolute value functions",
            "y=-abs(x)+3": "Inverted and shifted absolute value",

            // Square Root Functions
            "y=sqrt(x)": "Square root function",
            "y=sqrt(x-1)": "Shifted square root function",
            "y=-sqrt(x)": "Reflected square root function",
            "y=2sqrt(x+3)": "Scaled and shifted square root",

            // Rational Functions
            "y=1/x": "Reciprocal function with vertical and horizontal asymptotes",
            "y=1/(x-1)": "Shifted reciprocal function",
            "y=(x+1)/(x-2)": "Rational function with oblique asymptote",
            "y=x**2/(x**2+1)": "Rational function approaching horizontal asymptote",

            // Piecewise and Special Functions
            "y=floor(x)": "Floor function (step function)",
            "y=ceil(x)": "Ceiling function",
            "y=sign(x)": "Sign function",
            "y=max(0,x)": "ReLU function (Rectified Linear Unit)",

            // Circle and Conic Equations (implicit forms)
            "x**2+y**2=25": "Circle with radius 5 centered at origin",
            "(x-2)**2+(y-1)**2=9": "Circle with radius 3 centered at (2,1)",

            // Complex Functions
            "y=x*sin(x)": "Product of linear and sine functions",
            "y=e**(-x)*cos(x)": "Damped cosine function",
            "y=x**2*sin(1/x)": "Rapidly oscillating function near origin",
            "y=sin(x)/x": "Sinc function",

            // Statistics and Probability
            "y=e**(-x**2/2)/sqrt(2*pi)": "Standard normal distribution",
            "y=x*e**(-x)": "Gamma distribution shape",

            // Parametric Examples (for reference)
            "x=cos(t),y=sin(t)": "Unit circle (parametric)",
            "x=t,y=t**2": "Parabola (parametric form)",

            // Polar Examples (for reference)
            "r=1": "Unit circle (polar)",
            "r=1+cos(theta)": "Cardioid (polar)",
            "r=sin(2*theta)": "Rose curve (polar)"
        };
    }


    // ==================== VECTOR METHODS ====================

    /**
     * Parse vector input from various formats
     */
    parseVectorInput(input) {
        const cleanInput = input.replace(/\s/g, '').toLowerCase();

        // Pattern 1: vector A(x1,y1) B(x2,y2) - displacement vector
        const pattern1 = /vector\s*a\(([^,]+),([^)]+)\)\s*b\(([^,]+),([^)]+)\)/i;
        const match1 = input.match(pattern1);
        if (match1) {
            return {
                type: 'displacement',
                points: [
                    { x: parseFloat(match1[1]), y: parseFloat(match1[2]), label: 'A' },
                    { x: parseFloat(match1[3]), y: parseFloat(match1[4]), label: 'B' }
                ]
            };
        }

        // Pattern 2: vector (x1,y1) (x2,y2) - displacement vector
        const pattern2 = /vector\s*\(([^,]+),([^)]+)\)\s*\(([^,]+),([^)]+)\)/i;
        const match2 = input.match(pattern2);
        if (match2) {
            return {
                type: 'displacement',
                points: [
                    { x: parseFloat(match2[1]), y: parseFloat(match2[2]), label: 'Start' },
                    { x: parseFloat(match2[3]), y: parseFloat(match2[4]), label: 'End' }
                ]
            };
        }

        // Pattern 3: vectors A(x1,y1) B(x2,y2) C(x3,y3) - multiple vectors
        const pattern3 = /vectors?\s*a\(([^,]+),([^)]+)\)\s*b\(([^,]+),([^)]+)\)\s*c\(([^,]+),([^)]+)\)/i;
        const match3 = input.match(pattern3);
        if (match3) {
            return {
                type: 'multiple',
                points: [
                    { x: parseFloat(match3[1]), y: parseFloat(match3[2]), label: 'A' },
                    { x: parseFloat(match3[3]), y: parseFloat(match3[4]), label: 'B' },
                    { x: parseFloat(match3[5]), y: parseFloat(match3[6]), label: 'C' }
                ]
            };
        }

        // Pattern 4: vector <x,y> - component form
        const pattern4 = /vector\s*<([^,]+),([^>]+)>/i;
        const match4 = input.match(pattern4);
        if (match4) {
            return {
                type: 'component',
                components: { x: parseFloat(match4[1]), y: parseFloat(match4[2]) }
            };
        }

        // Pattern 5: 3D vector A(x1,y1,z1) B(x2,y2,z2)
        const pattern5 = /vector\s*a\(([^,]+),([^,]+),([^)]+)\)\s*b\(([^,]+),([^,]+),([^)]+)\)/i;
        const match5 = input.match(pattern5);
        if (match5) {
            return {
                type: 'displacement3d',
                points: [
                    { x: parseFloat(match5[1]), y: parseFloat(match5[2]), z: parseFloat(match5[3]), label: 'A' },
                    { x: parseFloat(match5[4]), y: parseFloat(match5[5]), z: parseFloat(match5[6]), label: 'B' }
                ]
            };
        }

        return null;
    }

    /**
     * Calculate displacement vector from two points
     */
    calculateDisplacementVector(point1, point2) {
        const vector = {
            components: {
                x: point2.x - point1.x,
                y: point2.y - point1.y,
                z: point2.z !== undefined ? point2.z - point1.z : undefined
            },
            startPoint: point1,
            endPoint: point2,
            is3D: point1.z !== undefined && point2.z !== undefined
        };

        // Calculate magnitude
        if (vector.is3D) {
            vector.magnitude = Math.sqrt(
                vector.components.x ** 2 +
                vector.components.y ** 2 +
                vector.components.z ** 2
            );
        } else {
            vector.magnitude = Math.sqrt(
                vector.components.x ** 2 +
                vector.components.y ** 2
            );
        }

        // Calculate direction angles
        vector.direction = this.calculateVectorDirection(vector.components, vector.is3D);

        // Calculate unit vector
        vector.unitVector = {
            x: vector.components.x / vector.magnitude,
            y: vector.components.y / vector.magnitude,
            z: vector.is3D ? vector.components.z / vector.magnitude : undefined
        };

        return vector;
    }

    /**
     * Calculate direction angles for vector
     */
    calculateVectorDirection(components, is3D = false) {
        const direction = {};

        if (is3D) {
            // Direction cosines and angles for 3D
            const magnitude = Math.sqrt(components.x ** 2 + components.y ** 2 + components.z ** 2);

            direction.cosines = {
                alpha: components.x / magnitude,
                beta: components.y / magnitude,
                gamma: components.z / magnitude
            };

            direction.angles = {
                alpha: Math.acos(direction.cosines.alpha) * (180 / Math.PI),
                beta: Math.acos(direction.cosines.beta) * (180 / Math.PI),
                gamma: Math.acos(direction.cosines.gamma) * (180 / Math.PI)
            };
        } else {
            // 2D direction
            direction.angle = Math.atan2(components.y, components.x) * (180 / Math.PI);
            direction.bearing = this.calculateBearing(components.x, components.y);

            // Quadrant
            if (components.x >= 0 && components.y >= 0) direction.quadrant = "I";
            else if (components.x < 0 && components.y >= 0) direction.quadrant = "II";
            else if (components.x < 0 && components.y < 0) direction.quadrant = "III";
            else direction.quadrant = "IV";
        }

        return direction;
    }

    /**
     * Calculate bearing (navigation angle)
     */
    calculateBearing(x, y) {
        let bearing = Math.atan2(x, y) * (180 / Math.PI);
        if (bearing < 0) bearing += 360;

        // Convert to compass bearing
        const compassQuadrant = Math.floor(bearing / 90);
        const compassAngle = bearing % 90;

        switch (compassQuadrant) {
            case 0: return `N${compassAngle.toFixed(1)}°E`;
            case 1: return `S${(90 - compassAngle).toFixed(1)}°E`;
            case 2: return `S${compassAngle.toFixed(1)}°W`;
            case 3: return `N${(90 - compassAngle).toFixed(1)}°W`;
            default: return `${bearing.toFixed(1)}°`;
        }
    }

    /**
     * Add two vectors
     */
    addVectors(vector1, vector2) {
        return {
            x: vector1.components.x + vector2.components.x,
            y: vector1.components.y + vector2.components.y,
            z: vector1.is3D && vector2.is3D ? (vector1.components.z || 0) + (vector2.components.z || 0) : undefined
        };
    }

    /**
     * Subtract two vectors
     */
    subtractVectors(vector1, vector2) {
        return {
            x: vector1.components.x - vector2.components.x,
            y: vector1.components.y - vector2.components.y,
            z: vector1.is3D && vector2.is3D ? (vector1.components.z || 0) - (vector2.components.z || 0) : undefined
        };
    }

    /**
     * Scalar multiplication
     */
    scalarMultiply(vector, scalar) {
        return {
            x: vector.components.x * scalar,
            y: vector.components.y * scalar,
            z: vector.is3D ? (vector.components.z || 0) * scalar : undefined
        };
    }

    /**
     * Dot product of two vectors
     */
    dotProduct(vector1, vector2) {
        let dot = vector1.components.x * vector2.components.x +
                  vector1.components.y * vector2.components.y;

        if (vector1.is3D && vector2.is3D) {
            dot += (vector1.components.z || 0) * (vector2.components.z || 0);
        }

        return dot;
    }

    /**
     * Cross product of two vectors (2D gives scalar, 3D gives vector)
     */
    crossProduct(vector1, vector2) {
        if (vector1.is3D && vector2.is3D) {
            // 3D cross product
            return {
                x: (vector1.components.y || 0) * (vector2.components.z || 0) -
                   (vector1.components.z || 0) * (vector2.components.y || 0),
                y: (vector1.components.z || 0) * (vector2.components.x || 0) -
                   (vector1.components.x || 0) * (vector2.components.z || 0),
                z: (vector1.components.x || 0) * (vector2.components.y || 0) -
                   (vector1.components.y || 0) * (vector2.components.x || 0)
            };
        } else {
            // 2D cross product (scalar)
            return vector1.components.x * vector2.components.y -
                   vector1.components.y * vector2.components.x;
        }
    }

    /**
     * Check if vectors are orthogonal
     */
    areVectorsOrthogonal(vector1, vector2, tolerance = 1e-10) {
        return Math.abs(this.dotProduct(vector1, vector2)) < tolerance;
    }

    /**
     * Check if vectors are parallel
     */
    areVectorsParallel(vector1, vector2, tolerance = 1e-10) {
        const cross = this.crossProduct(vector1, vector2);
        if (typeof cross === 'number') {
            return Math.abs(cross) < tolerance;
        } else {
            const crossMagnitude = Math.sqrt(cross.x ** 2 + cross.y ** 2 + cross.z ** 2);
            return crossMagnitude < tolerance;
        }
    }

    /**
     * Calculate angle between two vectors
     */
    angleBetweenVectors(vector1, vector2) {
        const dot = this.dotProduct(vector1, vector2);
        const angle = Math.acos(dot / (vector1.magnitude * vector2.magnitude));
        return angle * (180 / Math.PI);
    }

    /**
     * Draw vector arrow
     */
    drawVectorArrow(ctx, startScreen, endScreen, color = '#ff6600', label = '', showComponents = false) {
        const [startX, startY] = startScreen;
        const [endX, endY] = endScreen;

        // Calculate arrow direction
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length < 1) return; // Too small to draw

        const unitX = dx / length;
        const unitY = dy / length;

        // Draw main line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const arrowLength = this.vectorSettings.arrowSize;
        const arrowAngle = Math.PI / 6; // 30 degrees

        const arrow1X = endX - arrowLength * Math.cos(Math.atan2(dy, dx) - arrowAngle);
        const arrow1Y = endY - arrowLength * Math.sin(Math.atan2(dy, dx) - arrowAngle);
        const arrow2X = endX - arrowLength * Math.cos(Math.atan2(dy, dx) + arrowAngle);
        const arrow2Y = endY - arrowLength * Math.sin(Math.atan2(dy, dx) + arrowAngle);

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(arrow1X, arrow1Y);
        ctx.moveTo(endX, endY);
        ctx.lineTo(arrow2X, arrow2Y);
        ctx.stroke();

        // Draw label
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            ctx.fillText(label, midX + 15, midY - 5);
        }

        // Draw components if requested
        if (showComponents && this.vectorSettings.showComponents) {
            this.drawVectorComponents(ctx, startScreen, endScreen);
        }
    }

    /**
     * Draw vector components (x and y projections)
     */
    drawVectorComponents(ctx, startScreen, endScreen) {
        const [startX, startY] = startScreen;
        const [endX, endY] = endScreen;

        // X component (horizontal)
        ctx.strokeStyle = this.vectorSettings.componentColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, startY);
        ctx.stroke();

        // Y component (vertical)
        ctx.beginPath();
        ctx.moveTo(endX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.setLineDash([]); // Reset line dash

        // Component labels
        ctx.fillStyle = this.vectorSettings.componentColor;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';

        // X component label
        const xCompMid = (startX + endX) / 2;
        ctx.fillText(`x: ${(endX - startX).toFixed(1)}`, xCompMid, startY - 5);

        // Y component label
        const yCompMid = (startY + endY) / 2;
        ctx.save();
        ctx.translate(endX + 15, yCompMid);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`y: ${(endY - startY).toFixed(1)}`, 0, 0);
        ctx.restore();
    }

    /**
     * Draw complete vector analysis
     */
    drawVectorAnalysis(ctx, vectorData) {
        const { vectors, resultant, operations } = vectorData;

        // Draw grid using the calculator's method
        this.calculator.drawGrid(ctx);

        // Draw individual vectors
        vectors.forEach((vector, index) => {
            const colors = ['#ff6600', '#00aa00', '#0066ff', '#ff0066'];
            const color = colors[index % colors.length];

            const startScreen = this.calculator.graphToScreen(vector.startPoint.x, vector.startPoint.y);
            const endScreen = this.calculator.graphToScreen(vector.endPoint.x, vector.endPoint.y);

            this.drawVectorArrow(ctx, startScreen, endScreen, color,
                `v${index + 1}`, this.vectorSettings.showComponents);

            // Draw start and end points
            this.drawVectorPoint(ctx, startScreen, vector.startPoint.label || `Start${index + 1}`, '#333');
            this.drawVectorPoint(ctx, endScreen, vector.endPoint.label || `End${index + 1}`, color);
        });

        // Draw resultant if multiple vectors
        if (resultant) {
            const resultantStart = this.calculator.graphToScreen(0, 0);
            const resultantEnd = this.calculator.graphToScreen(resultant.x, resultant.y);
            this.drawVectorArrow(ctx, resultantStart, resultantEnd,
                this.vectorSettings.resultantColor, 'Resultant', false);
        }

        // Draw analysis information
        this.drawVectorInfo(ctx, vectorData);
    }

    /**
     * Draw point with label
     */
    drawVectorPoint(ctx, screen, label, color = '#333') {
        const [x, y] = screen;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 10);
    }

    /**
     * Draw vector information panel
     */
    drawVectorInfo(ctx, vectorData) {
        const { vectors, operations } = vectorData;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(10, 10, 280, vectors.length * 60 + 40);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(10, 10, 280, vectors.length * 60 + 40);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Vector Analysis', 20, 30);

        ctx.font = '11px Arial';
        let yOffset = 50;

        vectors.forEach((vector, index) => {
            const info = [
                `Vector ${index + 1}: <${vector.components.x.toFixed(2)}, ${vector.components.y.toFixed(2)}${vector.is3D ? `, ${vector.components.z.toFixed(2)}` : ''}>`,
                `Magnitude: ${vector.magnitude.toFixed(3)} units`,
                vector.is3D
                    ? `Angles: α=${vector.direction.angles.alpha.toFixed(1)}°, β=${vector.direction.angles.beta.toFixed(1)}°, γ=${vector.direction.angles.gamma.toFixed(1)}°`
                    : `Direction: ${vector.direction.angle?.toFixed(1)}°`,
                vector.is3D ? '' : `Bearing: ${vector.direction.bearing || 'N/A'}`
            ];

            info.forEach((line, lineIndex) => {
                if (line) ctx.fillText(line, 20, yOffset + lineIndex * 12);
            });

            yOffset += 60;
        });

        // Draw operations results
        if (operations && Object.keys(operations).length > 0) {
            ctx.font = 'bold 11px Arial';
            ctx.fillText('Operations:', 20, yOffset);
            yOffset += 15;

            ctx.font = '10px Arial';
            Object.entries(operations).forEach(([op, result]) => {
                if (typeof result === 'object' && result.x !== undefined) {
                    ctx.fillText(`${op}: <${result.x.toFixed(2)}, ${result.y.toFixed(2)}${result.z !== undefined ? `, ${result.z.toFixed(2)}` : ''}>`, 20, yOffset);
                } else if (typeof result === 'number') {
                    ctx.fillText(`${op}: ${result.toFixed(3)}${op.includes('Angle') ? '°' : ''}`, 20, yOffset);
                } else if (typeof result === 'boolean') {
                    ctx.fillText(`${op}: ${result ? 'Yes' : 'No'}`, 20, yOffset);
                }
                yOffset += 12;
            });
        }
    }

    /**
     * Process vector input and create analysis
     */
    addVector(input) {
        const parsed = this.parseVectorInput(input);

        if (!parsed) {
            console.log("❌ Invalid vector format!");
            console.log("💡 Examples:");
            console.log("  • vector A(1,2) B(5,4)  → Displacement vector");
            console.log("  • vector (0,0) (3,4)   → Simple displacement");
            console.log("  • vector <3,4>          → Component form");
            console.log("  • vectors A(1,1) B(4,3) C(6,5)  → Multiple vectors");
            console.log("  • vector A(1,2,3) B(4,5,6)      → 3D vector");
            return false;
        }

        // Validate coordinates
        if (parsed.points) {
            if (parsed.points.some(p => isNaN(p.x) || isNaN(p.y) || (parsed.type === 'displacement3d' && isNaN(p.z)))) {
                console.log("❌ Invalid coordinates! Please use numbers only.");
                return false;
            }
        } else if (parsed.components) {
            if (isNaN(parsed.components.x) || isNaN(parsed.components.y)) {
                console.log("❌ Invalid components! Please use numbers only.");
                return false;
            }
        }

        let vectorData = { vectors: [], operations: {} };

        if (parsed.type === 'displacement' || parsed.type === 'displacement3d') {
            const vector = this.calculateDisplacementVector(parsed.points[0], parsed.points[1]);
            vectorData.vectors.push(vector);

        } else if (parsed.type === 'component') {
            const vector = {
                components: parsed.components,
                startPoint: { x: 0, y: 0, label: 'Origin' },
                endPoint: { x: parsed.components.x, y: parsed.components.y, label: 'End' },
                magnitude: Math.sqrt(parsed.components.x ** 2 + parsed.components.y ** 2),
                is3D: false
            };
            vector.direction = this.calculateVectorDirection(vector.components);
            vector.unitVector = {
                x: vector.components.x / vector.magnitude,
                y: vector.components.y / vector.magnitude
            };
            vectorData.vectors.push(vector);

        } else if (parsed.type === 'multiple') {
            // Create vectors from consecutive points
            for (let i = 0; i < parsed.points.length - 1; i++) {
                const vector = this.calculateDisplacementVector(parsed.points[i], parsed.points[i + 1]);
                vectorData.vectors.push(vector);
            }

            // Calculate vector operations for multiple vectors
            if (vectorData.vectors.length >= 2) {
                const v1 = vectorData.vectors[0];
                const v2 = vectorData.vectors[1];

                vectorData.operations = {
                    'Sum': this.addVectors(v1, v2),
                    'Difference': this.subtractVectors(v1, v2),
                    'Dot Product': this.dotProduct(v1, v2),
                    'Cross Product': this.crossProduct(v1, v2),
                    'Angle Between': this.angleBetweenVectors(v1, v2),
                    'Orthogonal': this.areVectorsOrthogonal(v1, v2),
                    'Parallel': this.areVectorsParallel(v1, v2)
                };

                // Calculate resultant
                vectorData.resultant = vectorData.operations['Sum'];
            }
        }

        this.vectorCounter++;
        this.vectorHistory.push({
            id: this.vectorCounter,
            input: input,
            data: vectorData
        });

        // Display analysis
        this.displayVectorAnalysis(vectorData);

        // Save graph
        this.saveVectorGraph(vectorData);

        return true;
    }

    /**
     * Display comprehensive vector analysis
     */
    displayVectorAnalysis(vectorData) {
        const { vectors, operations, resultant } = vectorData;

        console.log(`\n➡️  VECTOR ANALYSIS`);
        console.log("=".repeat(60));

        vectors.forEach((vector, index) => {
            console.log(`\n📐 Vector ${index + 1}:`);
            console.log(`   From: ${vector.startPoint.label}(${vector.startPoint.x}, ${vector.startPoint.y}${vector.is3D ? `, ${vector.startPoint.z}` : ''})`);
            console.log(`   To:   ${vector.endPoint.label}(${vector.endPoint.x}, ${vector.endPoint.y}${vector.is3D ? `, ${vector.endPoint.z}` : ''})`);
            console.log(`   Components: <${vector.components.x.toFixed(3)}, ${vector.components.y.toFixed(3)}${vector.is3D ? `, ${vector.components.z.toFixed(3)}` : ''}>`);
            console.log(`   Magnitude: ${vector.magnitude.toFixed(4)} units`);

            if (vector.is3D) {
                console.log(`   Direction Angles: α=${vector.direction.angles.alpha.toFixed(1)}°, β=${vector.direction.angles.beta.toFixed(1)}°, γ=${vector.direction.angles.gamma.toFixed(1)}°`);
                console.log(`   Direction Cosines: <${vector.direction.cosines.alpha.toFixed(4)}, ${vector.direction.cosines.beta.toFixed(4)}, ${vector.direction.cosines.gamma.toFixed(4)}>`);
            } else {
                console.log(`   Direction: ${vector.direction.angle.toFixed(1)}° (${vector.direction.quadrant})`);
                console.log(`   Bearing: ${vector.direction.bearing}`);
            }

            console.log(`   Unit Vector: <${vector.unitVector.x.toFixed(4)}, ${vector.unitVector.y.toFixed(4)}${vector.is3D ? `, ${vector.unitVector.z.toFixed(4)}` : ''}>`);
        });

        if (operations && Object.keys(operations).length > 0) {
            console.log(`\n🔧 Vector Operations:`);
            Object.entries(operations).forEach(([op, result]) => {
                if (typeof result === 'object' && result.x !== undefined) {
                    console.log(`   ${op}: <${result.x.toFixed(3)}, ${result.y.toFixed(3)}${result.z !== undefined ? `, ${result.z.toFixed(3)}` : ''}>`);
                } else if (typeof result === 'number') {
                    console.log(`   ${op}: ${result.toFixed(4)}${op.includes('Angle') ? '°' : ''}`);
                } else if (typeof result === 'boolean') {
                    console.log(`   ${op}: ${result ? '✓ Yes' : '✗ No'}`);
                }
            });
        }

        if (resultant) {
            const resultantMag = Math.sqrt(resultant.x ** 2 + resultant.y ** 2 + (resultant.z || 0) ** 2);
            console.log(`\n📍 Resultant Vector:`);
            console.log(`   Components: <${resultant.x.toFixed(3)}, ${resultant.y.toFixed(3)}${resultant.z !== undefined ? `, ${resultant.z.toFixed(3)}` : ''}>`);
            console.log(`   Magnitude: ${resultantMag.toFixed(4)} units`);
        }

        console.log("=".repeat(60));
    }

    /**
     * Save vector graph
     */
    async saveVectorGraph(vectorData) {
        try {
            const canvas = createCanvas(this.calculator.width, this.calculator.height);
            const ctx = canvas.getContext('2d');

            this.drawVectorAnalysis(ctx, vectorData);

            const filename = `vector_${String(this.vectorCounter).padStart(3, '0')}_analysis.png`;
            const filepath = path.join('./temp', filename);

            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }

            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filepath, buffer);

            console.log(`💾 Vector graph saved: ${filename}`);
        } catch (error) {
            console.error("❌ Error saving vector graph:", error);
        }
    }

    /**
     * Display vector history
     */
    displayVectorHistory() {
        console.log(`\n📜 Vector History (${this.vectorCounter} vectors)`);
        console.log("=".repeat(50));

        if (this.vectorHistory.length === 0) {
            console.log("No vectors added yet.");
            return;
        }

        this.vectorHistory.forEach(entry => {
            const { vectors } = entry.data;
            console.log(`${entry.id}. ${entry.input}`);
            vectors.forEach((vector, index) => {
                console.log(`   Vector ${index + 1}: <${vector.components.x.toFixed(2)}, ${vector.components.y.toFixed(2)}${vector.is3D ? `, ${vector.components.z.toFixed(2)}` : ''}> | Mag: ${vector.magnitude.toFixed(2)}`);
            });
            console.log("");
        });
    }

    /**
     * Toggle vector display settings
     */
    toggleVectorSettings() {
        console.log("\n🎛️ Vector Display Settings:");
        console.log(`   Show Components: ${this.vectorSettings.showComponents ? '✓ Enabled' : '✗ Disabled'}`);
        console.log(`   Show Magnitude: ${this.vectorSettings.showMagnitude ? '✓ Enabled' : '✗ Disabled'}`);
        console.log(`   Show Angle: ${this.vectorSettings.showAngle ? '✓ Enabled' : '✗ Disabled'}`);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Enter setting to toggle (components/magnitude/angle) or 'cancel': ", (input) => {
            switch (input.toLowerCase()) {
                case 'components':
                    this.vectorSettings.showComponents = !this.vectorSettings.showComponents;
                    console.log(`Components display ${this.vectorSettings.showComponents ? 'enabled' : 'disabled'}`);
                    break;
                case 'magnitude':
                    this.vectorSettings.showMagnitude = !this.vectorSettings.showMagnitude;
                    console.log(`Magnitude display ${this.vectorSettings.showMagnitude ? 'enabled' : 'disabled'}`);
                    break;
                case 'angle':
                    this.vectorSettings.showAngle = !this.vectorSettings.showAngle;
                    console.log(`Angle display ${this.vectorSettings.showAngle ? 'enabled' : 'disabled'}`);
                    break;
                case 'cancel':
                    console.log("No changes made.");
                    break;
                default:
                    console.log("❌ Invalid setting. Use 'components', 'magnitude', 'angle', or 'cancel'.");
            }
            rl.close();
        });
    }

    /**
     * Parse triangle input from various formats
     */
    parseTriangleInput(input) {
        // Remove spaces and convert to lowercase for parsing
        const cleanInput = input.replace(/\s/g, '').toLowerCase();

        // Pattern 1: triangle A(x1,y1) B(x2,y2) C(x3,y3)
        const pattern1 = /triangle\s*a\(([^,]+),([^)]+)\)\s*b\(([^,]+),([^)]+)\)\s*c\(([^,]+),([^)]+)\)/i;
        const match1 = input.match(pattern1);

        if (match1) {
            return {
                A: { x: parseFloat(match1[1]), y: parseFloat(match1[2]) },
                B: { x: parseFloat(match1[3]), y: parseFloat(match1[4]) },
                C: { x: parseFloat(match1[5]), y: parseFloat(match1[6]) }
            };
        }

        // Pattern 2: triangle (x1,y1) (x2,y2) (x3,y3)
        const pattern2 = /triangle\s*\(([^,]+),([^)]+)\)\s*\(([^,]+),([^)]+)\)\s*\(([^,]+),([^)]+)\)/i;
        const match2 = input.match(pattern2);

        if (match2) {
            return {
                A: { x: parseFloat(match2[1]), y: parseFloat(match2[2]) },
                B: { x: parseFloat(match2[3]), y: parseFloat(match2[4]) },
                C: { x: parseFloat(match2[5]), y: parseFloat(match2[6]) }
            };
        }

        // Pattern 3: Simple coordinate list: triangle 0,0 4,0 2,3
        const pattern3 = /triangle\s*([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/i;
        const match3 = input.match(pattern3);

        if (match3) {
            return {
                A: { x: parseFloat(match3[1]), y: parseFloat(match3[2]) },
                B: { x: parseFloat(match3[3]), y: parseFloat(match3[4]) },
                C: { x: parseFloat(match3[5]), y: parseFloat(match3[6]) }
            };
        }

        return null;
    }

    /**
     * Check if three points are collinear
     */
    areCollinear(A, B, C) {
        // Using cross product method: points are collinear if cross product is 0
        const crossProduct = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
        return Math.abs(crossProduct) < 1e-10; // Account for floating point precision
    }

    /**
     * Calculate distance between two points
     */
    calculateDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    /**
     * Calculate angle using law of cosines
     */
    calculateAngle(a, b, c) {
        // Using law of cosines: cos(C) = (a² + b² - c²) / (2ab)
        const cosAngle = (a * a + b * b - c * c) / (2 * a * b);
        // Clamp to [-1, 1] to handle floating point errors
        const clampedCos = Math.max(-1, Math.min(1, cosAngle));
        return Math.acos(clampedCos) * (180 / Math.PI); // Convert to degrees
    }

    /**
     * Classify triangle by sides
     */
    classifyBySides(sideA, sideB, sideC) {
        const sides = [sideA, sideB, sideC].sort((a, b) => a - b);
        const tolerance = 1e-10;

        if (Math.abs(sides[0] - sides[1]) < tolerance && Math.abs(sides[1] - sides[2]) < tolerance) {
            return "Equilateral";
        } else if (Math.abs(sides[0] - sides[1]) < tolerance ||
                   Math.abs(sides[1] - sides[2]) < tolerance ||
                   Math.abs(sides[0] - sides[2]) < tolerance) {
            return "Isosceles";
        } else {
            return "Scalene";
        }
    }

    /**
     * Classify triangle by angles
     */
    classifyByAngles(angleA, angleB, angleC) {
        const angles = [angleA, angleB, angleC];
        const tolerance = 1;

        if (angles.some(angle => Math.abs(angle - 90) < tolerance)) {
            return "Right";
        } else if (angles.every(angle => angle < 90)) {
            return "Acute";
        } else {
            return "Obtuse";
        }
    }

    /**
     * Calculate triangle properties
     */
    calculateTriangleProperties(A, B, C) {
        // Calculate side lengths
        const sideAB = this.calculateDistance(A, B); // side c
        const sideBC = this.calculateDistance(B, C); // side a
        const sideCA = this.calculateDistance(C, A); // side b

        // Calculate angles using law of cosines
        const angleA = this.calculateAngle(sideBC, sideCA, sideAB); // angle at A
        const angleB = this.calculateAngle(sideCA, sideAB, sideBC); // angle at B
        const angleC = this.calculateAngle(sideAB, sideBC, sideCA); // angle at C

        // Calculate area using cross product formula
        const area = 0.5 * Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y));

        // Calculate perimeter
        const perimeter = sideAB + sideBC + sideCA;

        // Classify triangle
        const sideClassification = this.classifyBySides(sideAB, sideBC, sideCA);
        const angleClassification = this.classifyByAngles(angleA, angleB, angleC);

        return {
            vertices: { A, B, C },
            sides: {
                AB: sideAB,
                BC: sideBC,
                CA: sideCA
            },
            angles: {
                A: angleA,
                B: angleB,
                C: angleC
            },
            area,
            perimeter,
            classifications: {
                sides: sideClassification,
                angles: angleClassification,
                full: `${sideClassification} ${angleClassification}`
            }
        };
    }

    /**
     * Add triangle to the calculator
     */
    addTriangle(input) {
        const points = this.parseTriangleInput(input);

        if (!points) {
            console.log("❌ Invalid triangle format!");
            console.log("💡 Examples:");
            console.log("  • triangle A(0,0) B(4,0) C(2,3)");
            console.log("  • triangle (0,0) (4,0) (2,3)");
            console.log("  • triangle 0,0 4,0 2,3");
            return false;
        }

        const { A, B, C } = points;

        // Check if points are valid numbers
        if ([A.x, A.y, B.x, B.y, C.x, C.y].some(val => isNaN(val))) {
            console.log("❌ Invalid coordinates! Please use numbers only.");
            return false;
        }

        // Check if points are collinear
        if (this.areCollinear(A, B, C)) {
            console.log("❌ Points are collinear! Cannot form a triangle.");
            console.log(`Points: A(${A.x}, ${A.y}), B(${B.x}, ${B.y}), C(${C.x}, ${C.y})`);
            return false;
        }

        // Calculate triangle properties
        const triangleProps = this.calculateTriangleProperties(A, B, C);

        this.triangleCounter++;
        this.triangleHistory.push({
            id: this.triangleCounter,
            input: input,
            properties: triangleProps
        });

        // Display triangle analysis
        this.displayTriangleAnalysis(triangleProps);

        // Create individual triangle graph
        this.saveIndividualTriangle(triangleProps);

        return true;
    }

    /**
     * Display detailed triangle analysis
     */
    displayTriangleAnalysis(props) {
        const { vertices, sides, angles, area, perimeter, classifications } = props;

        console.log(`\n🔺 TRIANGLE ANALYSIS`);
        console.log("=".repeat(50));

        // Vertices
        console.log(`📍 Vertices:`);
        console.log(`   A: (${vertices.A.x}, ${vertices.A.y})`);
        console.log(`   B: (${vertices.B.x}, ${vertices.B.y})`);
        console.log(`   C: (${vertices.C.x}, ${vertices.C.y})`);

        // Side lengths
        console.log(`\n📏 Side Lengths:`);
        console.log(`   AB = ${sides.AB.toFixed(3)} units`);
        console.log(`   BC = ${sides.BC.toFixed(3)} units`);
        console.log(`   CA = ${sides.CA.toFixed(3)} units`);

        // Angles
        console.log(`\n📐 Angles:`);
        console.log(`   ∠A = ${angles.A.toFixed(1)}°`);
        console.log(`   ∠B = ${angles.B.toFixed(1)}°`);
        console.log(`   ∠C = ${angles.C.toFixed(1)}°`);
        console.log(`   Sum = ${(angles.A + angles.B + angles.C).toFixed(1)}° ✓`);

        // Properties
        console.log(`\n📊 Properties:`);
        console.log(`   Area: ${area.toFixed(3)} square units`);
        console.log(`   Perimeter: ${perimeter.toFixed(3)} units`);

        // Classification
        console.log(`\n🏷️ Classification:`);
        console.log(`   By sides: ${classifications.sides} Triangle`);
        console.log(`   By angles: ${classifications.angles} Triangle`);
        console.log(`   Overall: ${classifications.full} Triangle`);

        // Special properties
        this.displaySpecialProperties(props);

        console.log("=".repeat(50));
    }

    /**
     * Display special triangle properties
     */
    displaySpecialProperties(props) {
        const { sides, angles, classifications } = props;
        const specialProps = [];

        // Check for right triangle properties
        if (classifications.angles === "Right") {
            const sortedSides = Object.values(sides).sort((a, b) => a - b);
            const [a, b, c] = sortedSides;
            const pythagorean = Math.abs(c * c - (a * a + b * b));

            if (pythagorean < 0.001) {
                specialProps.push(`✓ Pythagorean theorem: ${a.toFixed(2)}² + ${b.toFixed(2)}² = ${c.toFixed(2)}²`);
            }
        }

        // Check for special right triangles
        if (classifications.angles === "Right") {
            const sortedSides = Object.values(sides).sort((a, b) => a - b);
            const [a, b, c] = sortedSides;

            // 45-45-90 triangle
            if (Math.abs(a - b) < 0.001 && Math.abs(c - a * Math.sqrt(2)) < 0.001) {
                specialProps.push("🔺 Special: 45-45-90 Triangle");
            }

            // 30-60-90 triangle
            const ratio1 = c / a;
            const ratio2 = b / a;
            if (Math.abs(ratio1 - 2) < 0.001 && Math.abs(ratio2 - Math.sqrt(3)) < 0.001) {
                specialProps.push("🔺 Special: 30-60-90 Triangle");
            }
        }

        // Check for equilateral properties
        if (classifications.sides === "Equilateral") {
            specialProps.push("✓ All angles are 60°");
            specialProps.push("✓ All sides are equal");
        }

        // Check for isosceles properties
        if (classifications.sides === "Isosceles") {
            const anglesArray = Object.values(angles);
            const baseAngles = anglesArray.filter((angle, index, arr) =>
                arr.findIndex(a => Math.abs(a - angle) < 0.001) !== index ||
                arr.filter(a => Math.abs(a - angle) < 0.001).length > 1
            );
            if (baseAngles.length >= 2) {
                specialProps.push(`✓ Base angles: ${baseAngles[0].toFixed(1)}°`);
            }
        }

        if (specialProps.length > 0) {
            console.log(`\n⭐ Special Properties:`);
            specialProps.forEach(prop => console.log(`   ${prop}`));
        }
    }

    /**
     * Save individual triangle graph
     */
    async saveIndividualTriangle(triangleProps) {
        try {
            const buffer = await this.createTriangleGraph(triangleProps);
            const { vertices } = triangleProps;

            const filename = `triangle_${String(this.triangleCounter).padStart(3, '0')}_A${vertices.A.x}_${vertices.A.y}_B${vertices.B.x}_${vertices.B.y}_C${vertices.C.x}_${vertices.C.y}.png`;
            const filepath = path.join('./temp', filename);

            // Create directory if it doesn't exist
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }

            fs.writeFileSync(filepath, buffer);
            console.log(`💾 Triangle graph saved: ${filename}`);
        } catch (error) {
            console.error("❌ Error saving triangle graph:", error);
        }
    }

    /**
     * Create triangle graph with all details
     */
    async createTriangleGraph(triangleProps) {
        const canvas = createCanvas(this.calculator.width, this.calculator.height);
        const ctx = canvas.getContext("2d");

        // Draw basic grid and axes
        await this.calculator.drawGraph(ctx);

        // Draw triangle
        this.drawTriangle(ctx, triangleProps);

        return canvas.toBuffer("image/png");
    }

    /**
     * Draw triangle with all annotations
     */
    drawTriangle(ctx, triangleProps) {
        const { vertices, sides, angles, classifications } = triangleProps;
        const { A, B, C } = vertices;

        // Convert coordinates to screen coordinates
        const screenA = this.calculator.graphToScreen(A.x, A.y);
        const screenB = this.calculator.graphToScreen(B.x, B.y);
        const screenC = this.calculator.graphToScreen(C.x, C.y);

        // Draw triangle outline
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenA[0], screenA[1]);
        ctx.lineTo(screenB[0], screenB[1]);
        ctx.lineTo(screenC[0], screenC[1]);
        ctx.closePath();
        ctx.stroke();

        // Draw vertices as circles
        const drawVertex = (screen, label, color = '#0066ff') => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screen[0], screen[1], 6, 0, 2 * Math.PI);
            ctx.fill();

            // Label
            ctx.fillStyle = 'black';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, screen[0], screen[1] - 15);
        };

        drawVertex(screenA, `A(${A.x}, ${A.y})`, '#ff0000');
        drawVertex(screenB, `B(${B.x}, ${B.y})`, '#00aa00');
        drawVertex(screenC, `C(${C.x}, ${C.y})`, '#0066ff');

        // Draw side length labels
        this.drawSideLabels(ctx, screenA, screenB, screenC, sides);

        // Draw angle labels
        this.drawAngleLabels(ctx, screenA, screenB, screenC, angles);

        // Draw title and classification
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${classifications.full} Triangle`, 10, 25);

        // Draw properties
        ctx.font = '12px Arial';
        const props = [
            `Area: ${triangleProps.area.toFixed(2)} sq units`,
            `Perimeter: ${triangleProps.perimeter.toFixed(2)} units`,
            `Sides: AB=${sides.AB.toFixed(2)}, BC=${sides.BC.toFixed(2)}, CA=${sides.CA.toFixed(2)}`,
            `Angles: ∠A=${angles.A.toFixed(1)}°, ∠B=${angles.B.toFixed(1)}°, ∠C=${angles.C.toFixed(1)}°`
        ];

        props.forEach((prop, index) => {
            ctx.fillText(prop, 10, 50 + index * 15);
        });
    }

    /**
     * Draw side length labels
     */
    drawSideLabels(ctx, screenA, screenB, screenC, sides) {
        const drawSideLabel = (screen1, screen2, length, label) => {
            const midX = (screen1[0] + screen2[0]) / 2;
            const midY = (screen1[1] + screen2[1]) / 2;

            ctx.fillStyle = '#666666';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${label}: ${length.toFixed(2)}`, midX, midY - 5);
        };

        drawSideLabel(screenA, screenB, sides.AB, 'AB');
        drawSideLabel(screenB, screenC, sides.BC, 'BC');
        drawSideLabel(screenC, screenA, sides.CA, 'CA');
    }

    /**
     * Draw angle labels
     */
    drawAngleLabels(ctx, screenA, screenB, screenC, angles) {
        ctx.fillStyle = '#333333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';

        // Angle at A
        ctx.fillText(`${angles.A.toFixed(1)}°`, screenA[0] + 15, screenA[1] + 5);

        // Angle at B
        ctx.fillText(`${angles.B.toFixed(1)}°`, screenB[0] + 15, screenB[1] + 5);

        // Angle at C
        ctx.fillText(`${angles.C.toFixed(1)}°`, screenC[0] + 15, screenC[1] + 5);
    }

    /**
     * Get formula description
     */
    getFormulaDescription(equation) {
        const cleanEq = equation.replace(/\s/g, '');
        return this.formulaDatabase[cleanEq] || `Mathematical function: ${equation}`;
    }

    /**
     * Create a new calculator instance for each equation
     */
    createFreshCalculator() {
        return new GraphingCalculator({
            size: 480,
            theme: this.calculator.theme,
            xMin: this.calculator.xMin,
            xMax: this.calculator.xMax,
            yMin: this.calculator.yMin,
            yMax: this.calculator.yMax,
            showGrid: this.calculator.showGrid,
            showAxes: this.calculator.showAxes,
            backgroundColor: this.calculator.backgroundColor,
            gridColor: this.calculator.gridColor,
            axisColor: this.calculator.axisColor
        });
    }

    /**
     * Parse linear equation to extract slope and intercept
     */
    parseLinear(equation) {
        const cleanEq = equation.replace(/\s/g, '').replace('y=', '');

        const patterns = [
            /^([+-]?\d*\.?\d*)\*?x([+-]\d+\.?\d*)?$/,
            /^x([+-]\d+\.?\d*)?$/,
            /^([+-]?\d*\.?\d*)\*?x$/,
            /^x$/,
            /^([+-]?\d+\.?\d*)$/
        ];

        for (let pattern of patterns) {
            const match = cleanEq.match(pattern);
            if (match) {
                let slope, intercept;

                if (pattern.source.includes('x')) {
                    slope = match[1] !== undefined ? match[1] : '1';
                    if (slope === '' || slope === '+') slope = '1';
                    if (slope === '-') slope = '-1';
                    slope = parseFloat(slope);

                    intercept = match[2] ? parseFloat(match[2]) : 0;
                } else {
                    slope = 0;
                    intercept = parseFloat(match[1]);
                }

                return { slope, intercept, isLinear: true };
            }
        }

        return { isLinear: false };
    }

    /**
     * Parse quadratic equation to extract coefficients
     */
    parseQuadratic(equation) {
        const cleanEq = equation.replace(/\s/g, '').replace('y=', '');

        // Vertex form pattern: a(x-h)**2+k or a(x+h)**2+k
        const vertexPattern = /^([+-]?\d*\.?\d*)\(x([+-]\d+\.?\d*)\)\*\*2([+-]\d+\.?\d*)?$/;
        const vertexMatch = cleanEq.match(vertexPattern);

        if (vertexMatch) {
            let a = vertexMatch[1] || '1';
            if (a === '' || a === '+') a = '1';
            if (a === '-') a = '-1';
            a = parseFloat(a);

            const h = -parseFloat(vertexMatch[2]); // Note: negative because (x-h) form
            const k = vertexMatch[3] ? parseFloat(vertexMatch[3]) : 0;

            return { a, h, k, isQuadratic: true, form: 'vertex' };
        }

        // Standard form pattern: ax**2+bx+c
        const standardPatterns = [
            // Full form: ax**2+bx+c
            /^([+-]?\d*\.?\d*)\*?x\*\*2([+-]\d*\.?\d*)\*?x([+-]\d+\.?\d*)?$/,
            // No linear term: ax**2+c
            /^([+-]?\d*\.?\d*)\*?x\*\*2([+-]\d+\.?\d*)?$/,
            // Just x**2 with terms: x**2+bx+c
            /^x\*\*2([+-]\d*\.?\d*)\*?x([+-]\d+\.?\d*)?$/,
            // Just x**2 with constant: x**2+c
            /^x\*\*2([+-]\d+\.?\d*)?$/,
            // Just x**2
            /^x\*\*2$/
        ];

        for (let pattern of standardPatterns) {
            const match = cleanEq.match(pattern);
            if (match) {
                let a, b, c;

                if (pattern.source === '^x\\*\\*2$') {
                    // Just x**2
                    a = 1; b = 0; c = 0;
                } else if (pattern.source.includes('bx')) {
                    // Has linear term
                    a = match[1] || '1';
                    if (a === '' || a === '+') a = '1';
                    if (a === '-') a = '-1';
                    a = parseFloat(a);

                    b = match[2] || '0';
                    if (b === '+' || b === '') b = '1';
                    if (b === '-') b = '-1';
                    b = parseFloat(b);

                    c = match[3] ? parseFloat(match[3]) : 0;
                } else {
                    // No linear term or simple forms
                    if (match[1] !== undefined) {
                        a = match[1] || '1';
                        if (a === '' || a === '+') a = '1';
                        if (a === '-') a = '-1';
                        a = parseFloat(a);

                        b = 0;
                        c = match[2] ? parseFloat(match[2]) : 0;
                    } else {
                        // x**2 + constant form
                        a = 1;
                        b = 0;
                        c = match[1] ? parseFloat(match[1]) : 0;
                    }
                }

                // Convert to vertex form: h = -b/(2a), k = c - b²/(4a)
                const h = b !== 0 ? -b / (2 * a) : 0;
                const k = c - (b * b) / (4 * a);

                return { a, b, c, h, k, isQuadratic: true, form: 'standard' };
            }
        }

        return { isQuadratic: false };
    }

    /**
     * Add an equation to the calculator
     */
    addEquation(equation) {
        try {
            // Test if equation is valid by creating a fresh calculator
            const testCalc = this.createFreshCalculator();
            if (testCalc.addEquation(equation)) {
                this.equationCounter++;
                this.equationHistory.push(`${this.equationCounter}. ${equation}`);

                // Create individual graph for this equation
                this.saveIndividualGraph(equation, testCalc);

                // Display equation description
                const description = this.getFormulaDescription(equation);
                console.log(`\n📈 ${equation}: ${description}`);
                console.log(`Added equation: ${equation}`);

                // Show calculated key points based on function type
                this.analyzeAndShowKeyPoints(equation);

                return true;
            }
            return false;
        } catch (error) {
            console.log("❌ Invalid equation!");
            return false;
        }
    }

    /**
     * Analyze equation type and show appropriate key points
     */
    analyzeAndShowKeyPoints(equation) {
        // Check for quadratic first
        const quadraticInfo = this.parseQuadratic(equation);
        if (quadraticInfo.isQuadratic) {
            this.showQuadraticPoints(equation, quadraticInfo);
            return;
        }

        // Check for linear
        const linearInfo = this.parseLinear(equation);
        if (linearInfo.isLinear) {
            this.showLinearPoints(equation, linearInfo);
            return;
        }

        // For other functions, show general analysis
        console.log(`📊 Function Analysis: ${equation}`);
        console.log(`📍 General function - check individual graph for visualization`);
    }

    /**
     * Show key points for linear equations
     */
    showLinearPoints(equation, { slope, intercept }) {
        console.log(`📊 Linear Function Analysis:`);
        console.log(`   Slope (m) = ${slope}`);
        console.log(`   Y-intercept (c) = ${intercept}`);

        if (slope === 0) {
            console.log(`   Type: Horizontal line`);
        } else if (slope > 0) {
            console.log(`   Type: Increasing line`);
        } else {
            console.log(`   Type: Decreasing line`);
        }

        console.log(`📍 Key Points:`);

        // Calculate key points
        const keyXValues = [-3, -2, -1, 0, 1, 2, 3];
        keyXValues.forEach(x => {
            const y = slope * x + intercept;
            if (y >= this.calculator.yMin && y <= this.calculator.yMax &&
                x >= this.calculator.xMin && x <= this.calculator.xMax) {
                const marker = x === 0 ? ' ← Y-intercept' : '';
                console.log(`   (${x}, ${y})${marker}`);
            }
        });

        // Show y-intercept specifically
        console.log(`🎯 Y-intercept: (0, ${intercept})`);

        // Show x-intercept if it exists and is reasonable
        if (slope !== 0) {
            const xIntercept = -intercept / slope;
            if (xIntercept >= this.calculator.xMin && xIntercept <= this.calculator.xMax) {
                console.log(`🎯 X-intercept: (${xIntercept.toFixed(2)}, 0)`);
            }
        }
    }

    /**
     * Show key points for quadratic equations
     */
    showQuadraticPoints(equation, { a, h, k, form }) {
        console.log(`📊 Quadratic Function Analysis:`);
        console.log(`📐 Form: ${form === 'vertex' ? 'Vertex' : 'Standard'} form`);
        console.log(`📊 Coefficient a = ${a} (opens ${a > 0 ? 'upward' : 'downward'})`);
        console.log(`🎯 Vertex: (${h}, ${k})`);
        console.log(`📏 Axis of symmetry: x = ${h}`);
        console.log(`📍 Key Points:`);

        // Calculate key points around the vertex
        const keyXOffsets = [-2, -1, 0, 1, 2];
        keyXOffsets.forEach(offset => {
            const x = h + offset;
            const y = a * (x - h) * (x - h) + k;

            if (x >= this.calculator.xMin && x <= this.calculator.xMax &&
                y >= this.calculator.yMin && y <= this.calculator.yMax) {
                const marker = offset === 0 ? ' ← Vertex' : '';
                console.log(`   (${x}, ${y})${marker}`);
            }
        });

        // Show range information
        if (a > 0) {
            console.log(`📈 Range: y ≥ ${k} (minimum value: ${k})`);
        } else {
            console.log(`📈 Range: y ≤ ${k} (maximum value: ${k})`);
        }

        // Show discriminant info if in standard form
        if (form === 'standard') {
            const discriminant = (4 * a) * k - (h * h * 4 * a * a);
            if (discriminant > 0) {
                console.log(`🔄 X-intercepts: Two real roots`);
            } else if (discriminant === 0) {
                console.log(`🔄 X-intercept: One real root (touches x-axis)`);
            } else {
                console.log(`🔄 X-intercepts: No real roots (doesn't touch x-axis)`);
            }
        }
    }

    /**
     * Save individual graph for single equation with coordinate points marked
     */
    async saveIndividualGraph(equation, calculator) {
        try {
            // Create a custom version that marks coordinate points
            const buffer = await this.createGraphWithPoints(equation, calculator);

            const filename = `equation_${String(this.equationCounter).padStart(3, '0')}_${this.sanitizeFilename(equation)}.png`;
            const filepath = path.join('./temp', filename);

            // Create directory if it doesn't exist
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }

            fs.writeFileSync(filepath, buffer);
            console.log(`💾 Individual graph saved: ${filename}`);
        } catch (error) {
            console.error("❌ Error saving individual graph:", error);
        }
    }

    /**
     * Create graph with coordinate points marked and proper line drawing
     */
    async createGraphWithPoints(equation, calculator) {
        const canvas = createCanvas(calculator.width, calculator.height);
        const ctx = canvas.getContext("2d");

        // Draw the basic graph
        await calculator.drawGraph(ctx);

        // Add coordinate points and enhanced line drawing
        this.markCoordinatePoints(ctx, equation, calculator);

        return canvas.toBuffer("image/png");
    }

    /**
     * Mark coordinate points on the graph with proper line connections
     */
    markCoordinatePoints(ctx, equation, calculator) {
        // Check for quadratic first
        const quadraticInfo = this.parseQuadratic(equation);
        if (quadraticInfo.isQuadratic) {
            this.drawQuadraticPoints(ctx, equation, quadraticInfo, calculator);
            return;
        }

        // Check for linear
        const linearInfo = this.parseLinear(equation);
        if (linearInfo.isLinear) {
            this.drawLinearPoints(ctx, equation, linearInfo, calculator);
            return;
        }

        // For other functions, just draw the standard curve without special marking
        console.log(`📊 Standard function visualization for: ${equation}`);
    }

    /**
     * Draw linear function points with connecting line
     */
    drawLinearPoints(ctx, equation, { slope, intercept }, calculator) {
        // Generate points across the viewing window
        const points = [];
        const xMin = calculator.xMin;
        const xMax = calculator.xMax;

        // Create more points for smoother line
        const numPoints = 50;
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + (xMax - xMin) * i / numPoints;
            const y = slope * x + intercept;

            if (y >= calculator.yMin && y <= calculator.yMax) {
                const [screenX, screenY] = calculator.graphToScreen(x, y);
                points.push({ x, y, screenX, screenY });
            }
        }

        // Draw the connecting line first
        if (points.length > 1) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].screenX, points[0].screenY);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].screenX, points[i].screenY);
            }
            ctx.stroke();
        }

        // Mark specific coordinate points
        const keyXValues = [-3, -2, -1, 0, 1, 2, 3];
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        keyXValues.forEach(x => {
            const y = slope * x + intercept;

            if (x >= calculator.xMin && x <= calculator.xMax &&
                y >= calculator.yMin && y <= calculator.yMax) {

                const [screenX, screenY] = calculator.graphToScreen(x, y);

                // Draw point circle
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 4, 0, 2 * Math.PI);
                ctx.fill();

                // Draw coordinate label
                ctx.fillStyle = 'black';
                ctx.fillText(`(${x},${y})`, screenX, screenY - 15);
            }
        });

        // Highlight y-intercept with different color
        if (intercept >= calculator.yMin && intercept <= calculator.yMax &&
            0 >= calculator.xMin && 0 <= calculator.xMax) {
            const [screenX, screenY] = calculator.graphToScreen(0, intercept);
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = 'blue';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`Y-int: (0,${intercept})`, screenX, screenY - 20);
        }
    }

    /**
     * Draw quadratic function points with parabola curve
     */
    drawQuadraticPoints(ctx, equation, { a, h, k }, calculator) {
        // Generate points for smooth parabola
        const points = [];
        const xMin = calculator.xMin;
        const xMax = calculator.xMax;

        const numPoints = 100;
        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + (xMax - xMin) * i / numPoints;
            const y = a * (x - h) * (x - h) + k;

            if (y >= calculator.yMin && y <= calculator.yMax) {
                const [screenX, screenY] = calculator.graphToScreen(x, y);
                points.push({ x, y, screenX, screenY });
            }
        }

        // Draw the parabola curve
        if (points.length > 1) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].screenX, points[0].screenY);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].screenX, points[i].screenY);
            }
            ctx.stroke();
        }

        // Mark specific coordinate points around vertex
        const keyXOffsets = [-2, -1, 0, 1, 2];
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        keyXOffsets.forEach(offset => {
            const x = h + offset;
            const y = a * (x - h) * (x - h) + k;

            if (x >= calculator.xMin && x <= calculator.xMax &&
                y >= calculator.yMin && y <= calculator.yMax) {

                const [screenX, screenY] = calculator.graphToScreen(x, y);

                // Color coding: purple for vertex, green for others
                if (offset === 0) {
                    // Vertex point
                    ctx.fillStyle = 'purple';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = 'purple';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText(`Vertex: (${x},${y})`, screenX, screenY - 20);
                } else {
                    // Regular points
                    ctx.fillStyle = 'green';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 4, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = 'black';
                    ctx.font = '12px Arial';
                    ctx.fillText(`(${x},${y})`, screenX, screenY - 15);
                }
            }
        });

        // Draw axis of symmetry
        if (h >= calculator.xMin && h <= calculator.xMax) {
            const [axisScreenX1, axisScreenY1] = calculator.graphToScreen(h, calculator.yMin);
            const [axisScreenX2, axisScreenY2] = calculator.graphToScreen(h, calculator.yMax);

            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(axisScreenX1, axisScreenY1);
            ctx.lineTo(axisScreenX2, axisScreenY2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    /**
     * Sanitize filename for saving
     */
    sanitizeFilename(equation) {
        return equation
            .replace(/[^a-zA-Z0-9+\-=]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 20);
    }

    /**
     * Update the graph with current equations (now for display only)
     */
    updateGraph() {
        // This is now just for status display
        console.log(`🎨 Individual graph created for equation`);
    }

    /**
     * Save current graph as PNG (legacy - now creates summary)
     */
    async saveCurrentGraph() {
        try {
            // Create a summary graph showing the current state
            const buffer = await this.calculator.buffer("image/png");

            const filename = `summary_${String(this.equationCounter).padStart(3, '0')}.png`;
            const filepath = path.join('./temp', filename);

            // Create directory if it doesn't exist
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp', { recursive: true });
            }

            fs.writeFileSync(filepath, buffer);
            console.log(`💾 Summary graph saved: ${filename}`);
        } catch (error) {
            console.error("❌ Error saving summary graph:", error);
        }
    }

    /**
     * Display all available formulas with descriptions
     */
    displayAllFormulas() {
        console.log("\n" + "=".repeat(80));
        console.log("📊 COMPLETE MATHEMATICAL FORMULA REFERENCE");
        console.log("=".repeat(80));

        const categories = [
            {
                title: "📏 LINEAR FUNCTIONS (y = mx + c)",
                formulas: ["y=2x+3", "y=x+1", "y=-x+5", "y=0.5x-2", "y=3x"]
            },
            {
                title: "📈 QUADRATIC FUNCTIONS",
                formulas: ["y=x**2", "y=-x**2", "y=x**2+2x+1", "y=2x**2-4x+1", "y=-0.5x**2+3x-2"]
            },
            {
                title: "🔄 CUBIC & POLYNOMIAL FUNCTIONS",
                formulas: ["y=x**3", "y=x**3-3x**2+2x", "y=x**4-2x**2"]
            },
            {
                title: "📊 EXPONENTIAL FUNCTIONS",
                formulas: ["y=2**x", "y=0.5**x", "y=e**x", "y=e**(-x)", "y=2*e**(0.5x)"]
            },
            {
                title: "📉 LOGARITHMIC FUNCTIONS",
                formulas: ["y=log(x)", "y=log(x,2)", "y=log(x+1)", "y=-log(x)"]
            },
            {
                title: "🌊 TRIGONOMETRIC FUNCTIONS",
                formulas: ["y=sin(x)", "y=cos(x)", "y=tan(x)", "y=2sin(x)", "y=sin(2x)", "y=sin(x-pi/2)"]
            },
            {
                title: "🔄 INVERSE TRIG FUNCTIONS",
                formulas: ["y=asin(x)", "y=acos(x)", "y=atan(x)"]
            },
            {
                title: "📐 ABSOLUTE VALUE FUNCTIONS",
                formulas: ["y=abs(x)", "y=abs(x-2)", "y=abs(x)+abs(x-4)", "y=-abs(x)+3"]
            },
            {
                title: "√ SQUARE ROOT FUNCTIONS",
                formulas: ["y=sqrt(x)", "y=sqrt(x-1)", "y=-sqrt(x)", "y=2sqrt(x+3)"]
            },
            {
                title: "➗ RATIONAL FUNCTIONS",
                formulas: ["y=1/x", "y=1/(x-1)", "y=(x+1)/(x-2)", "y=x**2/(x**2+1)"]
            },
            {
                title: "⭕ CIRCLE & CONIC SECTIONS",
                formulas: ["x**2+y**2=25", "(x-2)**2+(y-1)**2=9"]
            },
            {
                title: "🔧 SPECIAL FUNCTIONS",
                formulas: ["y=floor(x)", "y=ceil(x)", "y=sign(x)", "y=max(0,x)"]
            },
            {
                title: "🔺 TRIANGLE FUNCTIONS",
                formulas: ["triangle A(0,0) B(4,0) C(2,3)", "triangle (0,0) (4,0) (2,3)", "triangle 0,0 4,0 2,3"]
            }
        ];

        categories.forEach(category => {
            console.log(`\n${category.title}`);
            console.log("-".repeat(50));
            category.formulas.forEach(formula => {
                const description = this.formulaDatabase[formula] || (formula.includes('triangle') ? "Triangle plotting command" : "Mathematical function");
                console.log(`${formula.padEnd(20)} → ${description}`);
            });
        });

        console.log("\n" + "=".repeat(80));
        console.log("📝 EQUATION INPUT EXAMPLES:");
        console.log("• Linear:          y=2x+3, y=-0.5x+1, y=3x-2");
        console.log("• Quadratic:       y=x**2+2x+1, y=-2x**2+4x");
        console.log("• Exponential:     y=2**x, y=e**(-x)");
        console.log("• Trigonometric:   y=sin(x), y=cos(2x), y=tan(x)");
        console.log("• Logarithmic:     y=log(x), y=log(x,2)");
        console.log("• Absolute Value:  y=abs(x-1), y=-abs(x)+3");
        console.log("• Square Root:     y=sqrt(x), y=sqrt(x+2)");
        console.log("• Rational:        y=1/x, y=(x+1)/(x-1)");
        console.log("• Triangles:       triangle A(0,0) B(4,0) C(2,3)");
        console.log("=".repeat(80));
        console.log("🎯 NEW: Each equation creates its own individual graph with coordinate points marked!");
        console.log("🔺 NEW: Triangle plotting with complete geometric analysis!");
        console.log("📁 Check './temp/' folder for equation graphs");
        console.log("📁 Check './temp/' folder for triangle analysis graphs");
        console.log("=".repeat(80));
    }


        // ==================== EXISTING METHODS (with updates) ====================

    // All existing methods for equations and triangles remain the same
    // Only the interactive session and help methods need updating

    /**
     * Display help menu (updated with vector commands)
     */
    displayHelp() {
        console.log("\n" + "=".repeat(60));
        console.log("🧮 GRAPHING CALCULATOR COMMANDS");
        console.log("=".repeat(60));
        console.log("📊 formulas → Show all available mathematical formulas");
        console.log("📈 graph    → Display current graph visualization");
        console.log("📜 history  → Show equation and triangle history");
        console.log("📜 vhistory → Show vector history");
        console.log("💾 save     → Save current summary graph as PNG");
        console.log("🔄 status   → Show current calculator status");
        console.log("🎨 theme    → Change graph theme (standard/dark/scientific)");
        console.log("📏 zoom     → Adjust viewing window (xmin xmax ymin ymax)");
        console.log("🗑️  clear   → Clear all equations, triangles and vectors");
        console.log("⬅️  undo    → Remove last equation, triangle or vector");
        console.log("🔺 triangles→ Show triangle history");
        console.log("➡️  vectors → Show vector history");
        console.log("🎛️  vtoggle → Toggle vector display options");
        console.log("❓ help     → Show this help menu");
        console.log("🚪 quit     → Exit the calculator");
        console.log("=".repeat(60));
        console.log("🎯 To add equation: Just type it → 'y=x**2', 'y=sin(x)', 'y=2x+3'");
        console.log("🔺 To add triangle: triangle A(0,0) B(4,0) C(2,3)");
        console.log("➡️ To add vector: vector A(1,2) B(5,4) or vector <3,4>");
        console.log("📁 Individual graphs saved to respective folders");
        console.log("📍 Coordinate points automatically marked on functions");
        console.log("🔍 Complete geometric analysis for triangles and vectors");
        console.log("=".repeat(60));
    }

    /**
     * Get current calculator status (updated with vector count)
     */
    getCalculatorStatus() {
        return `📊 Calculator Status | Equations: ${this.equationCounter} | Triangles: ${this.triangleCounter} | Vectors: ${this.vectorCounter}`;
    }

    /**
     * Interactive calculator mode (updated with vector handling)
     */
    async startInteractiveSession() {
        console.log("🧮 Starting interactive graphing calculator!");
        console.log("📈 Enter mathematical equations to plot them on individual graphs.");
        console.log("🔺 Enter triangles to analyze their geometric properties.");
        console.log("➡️ Enter vectors to analyze vector operations and properties.");
        console.log("📊 Type 'formulas' to see all available functions and examples");
        console.log("❓ Type 'help' for all commands, 'quit' to exit");
        console.log("🎯 NEW: Each equation gets its own graph with coordinate points!");
        console.log("🔺 NEW: Triangle analysis with complete geometric calculations!");
        console.log("➡️ NEW: Vector analysis with operations and visualizations!");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const promptInput = () => {
            console.log(`\n${this.getCalculatorStatus()}`);
            rl.question('🎯 Enter equation, triangle, vector, or command: ', async (input) => {
                const inputStr = input.trim().toLowerCase();

                // Handle commands
                switch (inputStr) {
                    case 'quit':
                    case 'exit':
                        console.log("👋 Thanks for using the graphing calculator!");
                        console.log("📁 Your graphs are saved in respective folders");
                        rl.close();
                        return;

                    case 'graph':
                        this.displayCurrentGraph();
                        promptInput();
                        return;

                    case 'formulas':
                        this.displayAllFormulas();
                        promptInput();
                        return;

                    case 'help':
                        this.displayHelp();
                        promptInput();
                        return;

                    case 'history':
                        console.log("\n📜 Equation History:");
                        this.equationHistory.forEach(eq => console.log(`  ${eq}`));
                        console.log("\n🔺 Triangle History:");
                        this.triangleHistory.forEach(tri => console.log(`  ${tri.id}. ${tri.input}`));
                        console.log("\n➡️ Vector History:");
                        this.vectorHistory.forEach(vec => console.log(`  ${vec.id}. ${vec.input}`));
                        promptInput();
                        return;

                    case 'vhistory':
                        this.displayVectorHistory();
                        promptInput();
                        return;

                    case 'triangles':
                        console.log("\n🔺 Triangle History:");
                        this.triangleHistory.forEach(tri => {
                            console.log(`  ${tri.id}. ${tri.input}`);
                            console.log(`     Type: ${tri.properties.classifications.full} Triangle`);
                            console.log(`     Area: ${tri.properties.area.toFixed(3)} sq units`);
                        });
                        promptInput();
                        return;

                    case 'vectors':
                        this.displayVectorHistory();
                        promptInput();
                        return;

                    case 'save':
                        await this.saveCurrentGraph();
                        promptInput();
                        return;

                    case 'status':
                        console.log(`\n📊 ${this.getCalculatorStatus()}`);
                        console.log(`📈 Equations processed: ${this.equationCounter}`);
                        console.log(`🔺 Triangles analyzed: ${this.triangleCounter}`);
                        console.log(`➡️ Vectors analyzed: ${this.vectorCounter}`);
                        console.log(`🎨 Current theme: ${this.calculator.theme}`);
                        console.log(`📏 Viewing window: x[${this.calculator.xMin}, ${this.calculator.xMax}], y[${this.calculator.yMin}, ${this.calculator.yMax}]`);
                        console.log(`📁 Individual graphs: ./temp/ folder`);
                        console.log(`📁 Triangle graphs: ./temp/ folder`);
                        console.log(`📁 Vector graphs: ./temp/ folder`);
                        promptInput();
                        return;

                    case 'clear':
                        this.calculator.clearEquations();
                        this.equationHistory = [];
                        this.triangleHistory = [];
                        this.vectorHistory = [];
                        this.equationCounter = 0;
                        this.triangleCounter = 0;
                        this.vectorCounter = 0;
                        console.log("🗑️ All equations, triangles and vectors cleared!");
                        promptInput();
                        return;

                    case 'undo':
                        if (this.equationHistory.length === 0 && this.triangleHistory.length === 0 && this.vectorHistory.length === 0) {
                            console.log("❌ Nothing to undo!");
                        } else {
                            // Remove the most recent item (equation, triangle, or vector)
                            const lastEquationId = this.equationHistory.length > 0 ? parseInt(this.equationHistory[this.equationHistory.length - 1].split('.')[0]) : 0;
                            const lastTriangleId = this.triangleHistory.length > 0 ? this.triangleHistory[this.triangleHistory.length - 1].id : 0;
                            const lastVectorId = this.vectorHistory.length > 0 ? this.vectorHistory[this.vectorHistory.length - 1].id : 0;

                            if (lastVectorId > Math.max(lastEquationId, lastTriangleId)) {
                                const removed = this.vectorHistory.pop();
                                this.vectorCounter--;
                                console.log(`⬅️ Removed vector: ${removed.input}`);
                            } else if (lastTriangleId > lastEquationId) {
                                const removed = this.triangleHistory.pop();
                                this.triangleCounter--;
                                console.log(`⬅️ Removed triangle: ${removed.input}`);
                            } else if (this.equationHistory.length > 0) {
                                const removed = this.equationHistory.pop();
                                this.equationCounter--;
                                console.log(`⬅️ Removed equation: ${removed}`);
                            }
                        }
                        promptInput();
                        return;

                    case 'vtoggle':
                        this.toggleVectorSettings();
                        promptInput();
                        return;

                    default:
                        // Handle theme changes
                        if (inputStr.startsWith('theme ')) {
                            const themeName = inputStr.replace('theme ', '');
                            if (this.changeTheme(themeName)) {
                                console.log(`🎨 Theme changed to: ${themeName}`);
                            } else {
                                console.log("❌ Invalid theme! Available themes: standard, dark, scientific");
                            }
                            promptInput();
                            return;
                        }

                        // Handle zoom changes
                        if (inputStr.startsWith('zoom ')) {
                            const zoomParams = inputStr.replace('zoom ', '').split(' ');
                            if (zoomParams.length === 4) {
                                const [xMin, xMax, yMin, yMax] = zoomParams.map(parseFloat);
                                if (this.setViewingWindow(xMin, xMax, yMin, yMax)) {
                                    console.log(`📏 Viewing window updated: x[${xMin}, ${xMax}], y[${yMin}, ${yMax}]`);
                                } else {
                                    console.log("❌ Invalid zoom parameters! Use: zoom xMin xMax yMin yMax");
                                }
                            } else {
                                console.log("❌ Invalid zoom format! Use: zoom xMin xMax yMin yMax (e.g., zoom -5 5 -5 5)");
                            }
                            promptInput();
                            return;
                        }

                        // Try to parse as vector first
                        if (input.toLowerCase().includes('vector')) {
                            if (this.addVector(input)) {
                                console.log("✅ Vector added successfully!");
                            } else {
                                console.log("❌ Failed to add vector. Check the format and try again.");
                            }
                        }
                        // Then try to parse as triangle
                        else if (input.toLowerCase().includes('triangle')) {
                            if (this.addTriangle(input)) {
                                console.log("✅ Triangle added successfully!");
                            } else {
                                console.log("❌ Failed to add triangle. Check the format and try again.");
                            }
                        }
                        // Finally try to parse as equation
                        else {
                            if (this.addEquation(input)) {
                                console.log("✅ Equation added successfully!");
                            } else {
                                console.log("❌ Invalid input! Try 'help' for available commands or 'formulas' for equation examples.");
                            }
                        }
                        promptInput();
                }
            });
        };

        promptInput();
    }

    /**
     * Display current graph info (updated with vector info)
     */
    displayCurrentGraph() {
        console.log("\n🎨 Graph Display Information:");
        console.log("=".repeat(50));
        console.log(`📊 Total equations processed: ${this.equationCounter}`);
        console.log(`🔺 Total triangles analyzed: ${this.triangleCounter}`);
        console.log(`➡️ Total vectors analyzed: ${this.vectorCounter}`);
        console.log(`🎨 Current theme: ${this.calculator.theme}`);
        console.log(`📏 Viewing window: x[${this.calculator.xMin}, ${this.calculator.xMax}], y[${this.calculator.yMin}, ${this.calculator.yMax}]`);

        console.log("\n📁 Individual Graph Files:");
        if (this.equationHistory.length > 0) {
            console.log("📈 Equation Graphs:");
            this.equationHistory.forEach((eq, index) => {
                const filename = `equation_${String(index + 1).padStart(3, '0')}_${this.sanitizeFilename(eq.replace(/^\d+\.\s*/, ''))}.png`;
                console.log(`  • ${filename}`);
            });
        }

        if (this.triangleHistory.length > 0) {
            console.log("🔺 Triangle Graphs:");
            this.triangleHistory.forEach((tri, index) => {
                const { vertices } = tri.properties;
                const filename = `triangle_${String(index + 1).padStart(3, '0')}_A${vertices.A.x}_${vertices.A.y}_B${vertices.B.x}_${vertices.B.y}_C${vertices.C.x}_${vertices.C.y}.png`;
                console.log(`  • ${filename}`);
            });
        }

        if (this.vectorHistory.length > 0) {
            console.log("➡️ Vector Graphs:");
            this.vectorHistory.forEach((vec, index) => {
                const filename = `vector_${String(index + 1).padStart(3, '0')}_analysis.png`;
                console.log(`  • ${filename}`);
            });
        }

        if (this.equationCounter === 0 && this.triangleCounter === 0 && this.vectorCounter === 0) {
            console.log("📝 No graphs generated yet. Add some equations, triangles or vectors!");
        }

        console.log("\n💡 Tips:");
        console.log("  • Each equation creates its own detailed graph");
        console.log("  • Each triangle creates a complete geometric analysis");
        console.log("  • Each vector creates a visual analysis with operations");
        console.log("  • All files are saved automatically in respective folders");
        console.log("=".repeat(50));
    }



}


// Export the class as default
export default GraphingCalculatorGame;
