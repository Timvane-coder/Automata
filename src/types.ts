// ./src/types.ts

export enum Theme {
    Standard = "standard",
    Dark = "dark",
    Scientific = "scientific"
}

export interface GraphOptions {
    /** The pixel size of the graph canvas */
    size?: number;
    /** Grid size for the graph */
    gridSize?: number;
    /** Minimum x-axis value */
    xMin?: number;
    /** Maximum x-axis value */
    xMax?: number;
    /** Minimum y-axis value */
    yMin?: number;
    /** Maximum y-axis value */
    yMax?: number;
    /** Background color of the graph */
    backgroundColor?: string;
    /** Grid line color */
    gridColor?: string;
    /** Axis color */
    axisColor?: string;
    /** Whether to show grid */
    showGrid?: boolean;
    /** Whether to show axes */
    showAxes?: boolean;
    /** The desired theme of the graph */
    theme?: Theme;
}

export interface BufferOptions {
    /** The delay between each frame for GIFs, 1000ms by default */
    delay?: number;
    /** Whether to show equation progression */
    showProgression?: boolean;
    /**
     * Specifies which equation number to display up to.
     * For example:
     * - If `equation` is `2`, it will show the first 2 equations plotted.
     * - If `equation` is `1`, it will show only the first equation.
     *
     * If an `image/gif` is provided, it will display a GIF showing the progression
     * of equations being plotted one by one.
     * For any other file type, it will show all equations up to the specified number.
     */
    equation?: number;
}

export interface GraphProps extends GraphOptions {
    /** Add an equation to the graph */
    addEquation: (equation: string) => boolean;
    /** Clear all equations from the graph */
    clearEquations: () => void;
    /** Remove the last equation added */
    removeLastEquation: () => void;
    /** Set the theme of the graph */
    setTheme: (theme: Theme) => void;
    /** Generate a buffer image of the current graph */
    buffer: (mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif", options?: BufferOptions) => Promise<Buffer>;
    /** Get all current equations */
    getEquations: () => string[];
    /** Get plot history with colors and types */
    getPlotHistory: () => Array<{equation: string, type: string, color: string}>;
}
