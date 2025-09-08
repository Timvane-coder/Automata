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

        // Complete formula database with descriptions (existing code)
        this.formulaDatabase = {
            // ... (existing formula database)
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
            const filepath = path.join('./vector_graphs', filename);

            if (!fs.existsSync('./vector_graphs')) {
                fs.mkdirSync('./vector_graphs', { recursive: true });
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
                        this
