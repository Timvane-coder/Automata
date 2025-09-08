import type { BufferOptions, GraphOptions, GraphProps } from "./types";
import { Theme } from "./types"; // Import Theme as a value
import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { SKRSContext2D } from "@napi-rs/canvas";
import GIFEncoder from "gifencoder";
import path from "path";
import { PassThrough } from "stream";
import * as math from "mathjs";

// Class implementing a graphing calculator for plotting mathematical equations
class GraphingCalculator implements GraphProps {
    private equations: string[] = [];
    private plotHistory: Array<{ equation: string; type: string; color: string }> = [];
    private colors = ["rgb(255,0,0)", "rgb(0,255,0)", "rgb(0,0,255)", "rgb(255,165,0)", "rgb(128,0,128)"];
    private colorIndex = 0;

    public size = 480;
    public gridSize = 20;
    public xMin = -10;
    public xMax = 10;
    public yMin = -10;
    public yMax = 10;
    public backgroundColor = "rgb(255,255,255)";
    public gridColor = "rgb(200,200,200)";
    public axisColor = "rgb(0,0,0)";
    public theme = Theme.Standard;
    public showGrid = true;
    public showAxes = true;

    constructor(options?: GraphOptions) {
        if (options) {
            Object.assign(this, options);
        }
    }

    private get width() {
        return this.size;
    }

    private get height() {
        return this.size;
    }

    public setTheme(theme: Theme) {
        this.theme = theme;

        if (theme === Theme.Standard) {
            this.backgroundColor = "rgb(255,255,255)";
            this.gridColor = "rgb(200,200,200)";
            this.axisColor = "rgb(0,0,0)";
        } else if (theme === Theme.Dark) {
            this.backgroundColor = "rgb(30,30,30)";
            this.gridColor = "rgb(70,70,70)";
            this.axisColor = "rgb(255,255,255)";
        } else if (theme === Theme.Scientific) {
            this.backgroundColor = "rgb(240,248,255)";
            this.gridColor = "rgb(176,196,222)";
            this.axisColor = "rgb(25,25,112)";
        }
    }

    public addEquation(equation: string): boolean {
        try {
            const cleanEquation = this.cleanEquation(equation);
            if (!cleanEquation) return false;

            this.equations.push(cleanEquation);
            const equationType = this.detectEquationType(cleanEquation);
            // Use a default color if none available
            const color = this.colors[this.colorIndex % this.colors.length] ?? "rgb(0,0,0)";
            this.colorIndex++;
            this.plotHistory.push({
                equation: cleanEquation,
                type: equationType,
                color
            });

            return true;
        } catch (error) {
            console.error("Error adding equation:", error);
            return false;
        }
    }

    public clearEquations() {
        this.equations = [];
        this.plotHistory = [];
        this.colorIndex = 0;
    }

    public removeLastEquation() {
        if (this.equations.length > 0) {
            this.equations.pop();
            this.plotHistory.pop();
            this.colorIndex = Math.max(0, this.colorIndex - 1);
        }
    }

    private cleanEquation(equation: string): string {
        let cleaned = equation.replace(/\s/g, '');
        cleaned = cleaned.replace(/\^/g, '**'); // Convert ^ to **
        cleaned = cleaned.replace(/ln/g, 'log'); // Convert ln to log
        cleaned = cleaned.replace(/π/g, 'pi'); // Convert π to pi
        cleaned = cleaned.replace(/∞/g, 'Infinity'); // Convert ∞ to Infinity
        return cleaned;
    }

    private detectEquationType(equation: string): string {
        if (equation.includes('sin') || equation.includes('cos') || equation.includes('tan')) {
            return 'trigonometric';
        } else if (equation.includes('log') || equation.includes('ln')) {
            return 'logarithmic';
        } else if (equation.includes('**') && equation.includes('x**2')) {
            return 'quadratic';
        } else if (equation.includes('**')) {
            return 'exponential';
        } else if (equation.includes('abs') || equation.includes('|')) {
            return 'absolute';
        } else if (equation.includes('sqrt')) {
            return 'radical';
        } else if (equation.includes('x') && !equation.includes('**')) {
            return 'linear';
        }
        return 'constant';
    }

    private screenToGraph(screenX: number, screenY: number): [number, number] {
        const graphX = this.xMin + (screenX / this.size) * (this.xMax - this.xMin);
        const graphY = this.yMax - (screenY / this.size) * (this.yMax - this.yMin);
        return [graphX, graphY];
    }

    private graphToScreen(graphX: number, graphY: number): [number, number] {
        const screenX = ((graphX - this.xMin) / (this.xMax - this.xMin)) * this.size;
        const screenY = ((this.yMax - graphY) / (this.yMax - this.yMin)) * this.size;
        return [screenX, screenY];
    }

    private async drawGraph(ctx: SKRSContext2D, equationLimit?: number) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        if (this.showGrid) {
            this.drawGrid(ctx);
        }

        if (this.showAxes) {
            this.drawAxes(ctx);
        }

        const limit = equationLimit !== undefined ? Math.min(equationLimit, this.equations.length) : this.equations.length;
        for (let i = 0; i < limit; i++) {
            const equation = this.equations[i];
            const historyEntry = this.plotHistory[i];
            if (equation && historyEntry) {
                await this.plotEquation(ctx, equation, historyEntry.color);
            }
        }

        return ctx;
    }

    private drawGrid(ctx: SKRSContext2D) {
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 0.5;
        const xStep = (this.xMax - this.xMin) / 20;
        const yStep = (this.yMax - this.yMin) / 20;

        for (let x = this.xMin; x <= this.xMax; x += xStep) {
            const [screenX] = this.graphToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.height);
            ctx.stroke();
        }

        for (let y = this.yMin; y <= this.yMax; y += yStep) {
            const [, screenY] = this.graphToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.width, screenY);
            ctx.stroke();
        }
    }

    private drawAxes(ctx: SKRSContext2D) {
        ctx.strokeStyle = this.axisColor;
        ctx.lineWidth = 2;

        if (this.yMin <= 0 && this.yMax >= 0) {
            const [, yAxisScreenY] = this.graphToScreen(0, 0);
            ctx.beginPath();
            ctx.moveTo(0, yAxisScreenY);
            ctx.lineTo(this.width, yAxisScreenY);
            ctx.stroke();
        }

        if (this.xMin <= 0 && this.xMax >= 0) {
            const [xAxisScreenX] = this.graphToScreen(0, 0);
            ctx.beginPath();
            ctx.moveTo(xAxisScreenX, 0);
            ctx.lineTo(xAxisScreenX, this.height);
            ctx.stroke();
        }

        this.drawAxisLabels(ctx);
    }

    private drawAxisLabels(ctx: SKRSContext2D) {
        ctx.fillStyle = this.axisColor;
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const xStep = Math.ceil((this.xMax - this.xMin) / 10);
        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
            if (x !== 0) {
                const [screenX, yAxisScreenY] = this.graphToScreen(x, 0);
                if (screenX >= 0 && screenX <= this.width) {
                    ctx.fillText(x.toString(), screenX, Math.min(yAxisScreenY + 5, this.height - 15));
                }
            }
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const yStep = Math.ceil((this.yMax - this.yMin) / 10);
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            if (y !== 0) {
                const [xAxisScreenX, screenY] = this.graphToScreen(0, y);
                if (screenY >= 0 && screenY <= this.height) {
                    ctx.fillText(y.toString(), Math.max(xAxisScreenX - 5, 25), screenY);
                }
            }
        }
    }

    private async plotEquation(ctx: SKRSContext2D, equation: string, color: string) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = (this.xMax - this.xMin) / this.size;
        let firstPoint = true;

        try {
            for (let x = this.xMin; x <= this.xMax; x += step) {
                const expression = equation.replace(/y\s*=\s*/, '').replace(/x/g, x.toString());
                try {
                    const y = math.evaluate(expression);
                    if (typeof y === 'number' && isFinite(y) && y >= this.yMin && y <= this.yMax) {
                        const [screenX, screenY] = this.graphToScreen(x, y);
                        if (firstPoint) {
                            ctx.moveTo(screenX, screenY);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(screenX, screenY);
                        }
                    } else {
                        firstPoint = true;
                    }
                } catch {
                    firstPoint = true;
                }
            }
            ctx.stroke();
        } catch (error) {
            console.error("Error plotting equation:", equation, error);
        }
    }

    public async buffer(
        mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif" = "image/png",
        options?: BufferOptions
    ): Promise<Buffer> {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext("2d");

        if (mime !== "image/gif") {
            // For non-GIF formats, plot up to the specified equation number or all equations
            const equationLimit = options?.equation !== undefined ? options.equation : this.equations.length;
            await this.drawGraph(ctx, equationLimit);
            return canvas.toBuffer(mime as any);
        } else {
            // For GIF, create an animation if showProgression is true, up to equation number
            return new Promise((resolve, reject) => {
                const encoder = new GIFEncoder(this.width, this.height);
                const passThrough = new PassThrough();
                const chunks: Uint8Array[] = [];
                passThrough.on("data", chunk => chunks.push(chunk));
                passThrough.on("end", () => resolve(Buffer.concat(chunks)));
                passThrough.on(" error", reject);

                encoder.start();
                encoder.setRepeat(0);
                encoder.setDelay(options?.delay ?? 1000);
                encoder.createReadStream().pipe(passThrough);

                const createFrames = async () => {
                    const limit = options?.equation !== undefined ? Math.min(options.equation, this.equations.length) : this.equations.length;
                    const showProgression = options?.showProgression ?? true;

                    if (showProgression) {
                        // Create frames showing equations added one by one
                        for (let i = 0; i <= limit; i++) {
                            const tempCalc = new GraphingCalculator({
                                size: this.size,
                                xMin: this.xMin,
                                xMax: this.xMax,
                                yMin: this.yMin,
                                yMax: this.yMax,
                                backgroundColor: this.backgroundColor,
                                gridColor: this.gridColor,
                                axisColor: this.axisColor,
                                theme: this.theme,
                                showGrid: this.showGrid,
                                showAxes: this.showAxes
                            });

                            for (let j = 0; j < i; j++) {
                                const equation = this.equations[j];
                                if (equation) {
                                    tempCalc.addEquation(equation);
                                }
                            }

                            await tempCalc.drawGraph(ctx);
                            encoder.addFrame(ctx as any);
                        }
                    } else {
                        // Single frame with all equations up to limit
                        await this.drawGraph(ctx, limit);
                        encoder.addFrame(ctx as any);
                    }
                };

                createFrames()
                    .then(() => encoder.finish())
                    .catch(reject);
            });
        }
    }

    public getEquations(): string[] {
        return [...this.equations];
    }

    public getPlotHistory(): Array<{ equation: string; type: string; color: string }> {
        return [...this.plotHistory];
    }
}

export { GraphingCalculator, Theme };
