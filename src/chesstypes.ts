import type { Square } from "chess.js";

export enum Theme {
        Modern = "modern",
        Wood = "wood"
}

export interface ChessboardOptions {
        /** The pixel length of desired image */
        size?: number;
        /** Color of light squares */
        light?: string;
        /** Color of dark squares */
        dark?: string;
        /** Color of highlight overlay */
        highlight?: string;
        /** Whether the board should be flipped */
        flipped?: boolean;
        /** The desired style of the chess pieces */
        style?: Theme;
}

export interface BufferOptions {
    /** The delay between each frame, 500 by default. */
        delay?: number;
        /** Whether to highlight the latest action made. */
        highlight?: boolean;
        /**
     * Specifies the move number in a PGN string to which the game should be played up to.
     * For example:
     * - If `move` is `2`, and the PGN string is "1. Nc3 Nf6 2. Ne4", the result should be "1. Nc3 Nf6".
     * - If `move` is `1`, the result should be "1. Nc3".
     *
     * The `move` number represents the move in the sequence of the game, where moves are counted from 1.
     *
     * If an `image/gif` is provided, it will display a GIF of the game up to the specified move.
     * For any other file type, only the immediate move image corresponding to the specified move will be shown.
     */
        move?: number;
}

export interface ChessboardProps extends ChessboardOptions {
        /** Loads PGN into Chess.js instance */
        loadPGN: (pgn: string) => void;
        /** Loads FEN into Chess.js instance */
        loadFEN: (fen: string) => void;
        /** The squares to highlight */
        highlightSquares: (...squares: Square[]) => void;
        /** Set the theme of the chessboard */
        setTheme: (theme: Theme) => void;
        buffer: (mime: "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "image/gif", options?: BufferOptions) => Promise<Buffer>;
}
