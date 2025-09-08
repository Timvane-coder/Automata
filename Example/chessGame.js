import { Chess } from "chess.js";
import { Chessboard, Theme } from "../lib/chess.js";
import fs from "fs";
import path from "path";
import readline from "readline";

class ChessGame {
    constructor() {
        this.chess = new Chess();
        this.chessboard = new Chessboard({
            size: 480,
            style: Theme.Modern,
            flipped: false
        });
        this.moveCounter = 0;
        this.gameHistory = [];

        // Complete move annotations database
        this.moveAnnotations = {
            // White Pawn Moves - One Step Forward
            "a2-a3": "White advances the a-pawn one square forward",
            "b2-b3": "White advances the b-pawn one square forward",
            "c2-c3": "White advances the c-pawn one square forward",
            "d2-d3": "White advances the d-pawn one square forward",
            "e2-e3": "White advances the e-pawn (king's pawn) one square forward",
            "f2-f3": "White advances the f-pawn one square forward",
            "g2-g3": "White advances the g-pawn one square forward",
            "h2-h3": "White advances the h-pawn one square forward",

            // White Pawn Moves - Two Steps Forward
            "a2-a4": "White advances the a-pawn two squares on its first move",
            "b2-b4": "White advances the b-pawn two squares on its first move",
            "c2-c4": "White plays the English Opening, advancing the c-pawn two squares",
            "d2-d4": "White plays the Queen's Pawn opening, advancing the d-pawn two squares",
            "e2-e4": "White plays the King's Pawn opening, advancing the e-pawn two squares",
            "f2-f4": "White advances the f-pawn two squares (Bird's Opening)",
            "g2-g4": "White advances the g-pawn two squares (unusual and weakening)",
            "h2-h4": "White advances the h-pawn two squares (rare opening)",

            // Black Pawn Moves - One Step Forward
            "a7-a6": "Black advances the a-pawn one square forward",
            "b7-b6": "Black advances the b-pawn one square forward",
            "c7-c6": "Black advances the c-pawn one square forward (Caro-Kann setup)",
            "d7-d6": "Black advances the d-pawn one square forward",
            "e7-e6": "Black advances the e-pawn one square forward (French Defense setup)",
            "f7-f6": "Black advances the f-pawn one square forward (weakening move)",
            "g7-g6": "Black advances the g-pawn one square forward (fianchetto setup)",
            "h7-h6": "Black advances the h-pawn one square forward",

            // Black Pawn Moves - Two Steps Forward
            "a7-a5": "Black advances the a-pawn two squares on its first move",
            "b7-b5": "Black advances the b-pawn two squares on its first move",
            "c7-c5": "Black plays the Sicilian Defense setup, advancing the c-pawn two squares",
            "d7-d5": "Black advances the d-pawn two squares (Queen's Pawn defense)",
            "e7-e5": "Black advances the e-pawn two squares (King's Pawn defense)",
            "f7-f5": "Black advances the f-pawn two squares (Dutch Defense)",
            "g7-g5": "Black advances the g-pawn two squares (very unusual and weakening)",
            "h7-h5": "Black advances the h-pawn two squares (rare and aggressive)",

            // White Knight Moves
            "g1-f3": "White develops the kingside knight to f3, attacking e5 and d4",
            "g1-h3": "White moves the kingside knight to the rim (generally poor development)",
            "b1-a3": "White moves the queenside knight to a3 (rim move, usually poor)",
            "b1-c3": "White develops the queenside knight to c3, supporting d5 and e4",

            // Black Knight Moves
            "g8-f6": "Black develops the kingside knight to f6, defending e4 and d5",
            "g8-h6": "Black moves the kingside knight to the rim (generally poor development)",
            "b8-a6": "Black moves the queenside knight to a6 (rim move, usually poor)",
            "b8-c6": "Black develops the queenside knight to c6, supporting d4 and e5",

            // White Bishop Moves
            "c1-d2": "White moves the light-squared bishop one square diagonally",
            "c1-e3": "White develops the light-squared bishop to e3",
            "c1-f4": "White develops the light-squared bishop to f4, controlling key central squares",
            "c1-g5": "White develops the light-squared bishop to g5, often pinning the f6 knight",
            "c1-h6": "White moves the light-squared bishop to h6, attacking the black king's position",
            "c1-b2": "White fianchettoes the light-squared bishop to b2",
            "c1-a3": "White places the light-squared bishop on a3, often targeting f8",
            "f1-e2": "White develops the dark-squared bishop to e2",
            "f1-d3": "White develops the dark-squared bishop to d3, aiming at the kingside",
            "f1-c4": "White develops the dark-squared bishop to c4 (Italian Game setup)",
            "f1-b5": "White develops the dark-squared bishop to b5 (Spanish/Ruy Lopez Opening)",

            // Black Bishop Moves
            "c8-d7": "Black moves the light-squared bishop one square diagonally",
            "c8-e6": "Black develops the light-squared bishop to e6",
            "c8-f5": "Black develops the light-squared bishop to f5, controlling key central squares",
            "c8-g4": "Black develops the light-squared bishop to g4, often pinning the f3 knight",
            "c8-h3": "Black moves the light-squared bishop to h3, attacking the white king's position",
            "c8-b7": "Black fianchettoes the light-squared bishop to b7",
            "c8-a6": "Black places the light-squared bishop on a6, often targeting f1",
            "f8-e7": "Black develops the dark-squared bishop to e7",
            "f8-d6": "Black develops the dark-squared bishop to d6, aiming at the kingside",
            "f8-c5": "Black develops the dark-squared bishop to c5 (Italian Game setup)",
            "f8-b4": "Black develops the dark-squared bishop to b4 (Spanish Defense)",

            // Castling Moves
            "e1-g1": "White castles kingside (short castling): King moves 2 squares right, rook jumps over",
            "e1-c1": "White castles queenside (long castling): King moves 2 squares left, rook jumps over",
            "e8-g8": "Black castles kingside (short castling): King moves 2 squares right, rook jumps over",
            "e8-c8": "Black castles queenside (long castling): King moves 2 squares left, rook jumps over",

            // Queen Moves (sample key positions)
            "d1-d2": "White queen moves one square forward",
            "d1-d3": "White queen moves two squares forward",
            "d1-d4": "White queen moves to central d4 square",
            "d1-d5": "White queen advances to d5",
            "d1-h5": "White queen moves to h5, targeting f7 (Scholar's Mate threat)",
            "d8-d7": "Black queen moves one square forward",
            "d8-d6": "Black queen moves two squares forward",
            "d8-d5": "Black queen moves to central d5 square",
            "d8-d4": "Black queen advances to d4",
            "d8-h4": "Black queen moves to h4, targeting f2 (Scholar's Mate threat)"
        };
    }

    /**
     * Get move annotation
     */
    getMoveAnnotation(from, to) {
        const moveKey = `${from}-${to}`;
        return this.moveAnnotations[moveKey] || `Move from ${from} to ${to}`;
    }

    /**
     * Make a move for the human player (white)
     */
    makePlayerMove(from, to) {
        try {
            const move = this.chess.move({ from, to });
            if (move) {
                this.moveCounter++;
                this.gameHistory.push(`${this.moveCounter}. ${move.san}`);
                this.updateChessboard();
                this.saveCurrentPosition();

                // Display move annotation
                const annotation = this.getMoveAnnotation(from, to);
                console.log(`\n🔸 ${move.san}: ${annotation}`);
                console.log(`White plays: ${move.san}`);

                return true;
            }
            return false;
        } catch (error) {
            console.log("❌ Invalid move!");
            return false;
        }
    }

    /**
     * Simple computer AI - makes a random legal move
     */
    makeComputerMove() {
        if (this.chess.isGameOver()) {
            console.log("🏁 Game Over!");
            return null;
        }

        const possibleMoves = this.chess.moves({ verbose: true });
        if (possibleMoves.length === 0) return null;

        // Simple AI: prioritize captures, then random moves
        const captures = possibleMoves.filter(move => move.captured);
        const selectedMove = captures.length > 0
            ? captures[Math.floor(Math.random() * captures.length)]
            : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        const move = this.chess.move(selectedMove);
        if (move) {
            this.gameHistory[this.gameHistory.length - 1] += ` ${move.san}`;
            this.updateChessboard();
            this.saveCurrentPosition();

            // Display move annotation for computer move
            const annotation = this.getMoveAnnotation(selectedMove.from, selectedMove.to);
            console.log(`\n🔹 ${move.san}: ${annotation}`);
            console.log(`Black plays: ${move.san}`);
        }
        return move;
    }

    /**
     * Update the chessboard with current position
     */
    updateChessboard() {
        this.chessboard.loadFEN(this.chess.fen());

        // Highlight the last move
        const history = this.chess.history({ verbose: true });
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            this.chessboard.highlightSquares(lastMove.from, lastMove.to);
        }
    }

    /**
     * Save current position as PNG
     */
    async saveCurrentPosition() {
        try {
            const buffer = await this.chessboard.buffer("image/png", {
                highlight: true
            });

            const filename = `move_${String(this.chess.history().length).padStart(3, '0')}.png`;
            const filepath = path.join('./chess_moves', filename);

            // Create directory if it doesn't exist
            if (!fs.existsSync('./chess_moves')) {
                fs.mkdirSync('./chess_moves', { recursive: true });
            }

            fs.writeFileSync(filepath, buffer);
            console.log(`💾 Saved position: ${filename}`);
        } catch (error) {
            console.error("❌ Error saving position:", error);
        }
    }

    /**
     * Display all possible moves with annotations
     */
    displayAllMoves() {
        console.log("\n" + "=".repeat(60));
        console.log("📋 COMPLETE CHESS MOVE ANNOTATIONS");
        console.log("=".repeat(60));

        const categories = [
            {
                title: "♟️ WHITE PAWN MOVES (One Step)",
                moves: ["a2-a3", "b2-b3", "c2-c3", "d2-d3", "e2-e3", "f2-f3", "g2-g3", "h2-h3"]
            },
            {
                title: "♟️ WHITE PAWN MOVES (Two Steps - Opening)",
                moves: ["a2-a4", "b2-b4", "c2-c4", "d2-d4", "e2-e4", "f2-f4", "g2-g4", "h2-h4"]
            },
            {
                title: "♟️ BLACK PAWN MOVES (One Step)",
                moves: ["a7-a6", "b7-b6", "c7-c6", "d7-d6", "e7-e6", "f7-f6", "g7-g6", "h7-h6"]
            },
            {
                title: "♟️ BLACK PAWN MOVES (Two Steps - Opening)",
                moves: ["a7-a5", "b7-b5", "c7-c5", "d7-d5", "e7-e5", "f7-f5", "g7-g5", "h7-h5"]
            },
            {
                title: "♞ KNIGHT MOVES",
                moves: ["g1-f3", "g1-h3", "b1-a3", "b1-c3", "g8-f6", "g8-h6", "b8-a6", "b8-c6"]
            },
            {
                title: "♝ BISHOP MOVES (Sample Key Moves)",
                moves: ["c1-d2", "c1-f4", "c1-g5", "f1-c4", "f1-d3", "c8-f5", "c8-g4", "f8-c5", "f8-d6"]
            },
            {
                title: "♚ CASTLING MOVES",
                moves: ["e1-g1", "e1-c1", "e8-g8", "e8-c8"]
            },
            {
                title: "♛ QUEEN MOVES (Sample Key Moves)",
                moves: ["d1-d2", "d1-d4", "d1-h5", "d8-d7", "d8-d5", "d8-h4"]
            }
        ];

        categories.forEach(category => {
            console.log(`\n${category.title}`);
            console.log("-".repeat(40));
            category.moves.forEach(move => {
                const annotation = this.moveAnnotations[move] || "No annotation available";
                console.log(`${move.padEnd(8)} → ${annotation}`);
            });
        });

        console.log("\n" + "=".repeat(60));
        console.log("📝 SPECIAL MOVES:");
        console.log("• En Passant: Capture pawn that just moved 2 squares (e.g., exd6 e.p.)");
        console.log("• Pawn Promotion: When pawn reaches end (e.g., a8=Q, a8=R, a8=B, a8=N)");
        console.log("• Captures: Add 'x' between squares (e.g., Nxd4, exf5)");
        console.log("• Check: Add '+' after move (e.g., Bb5+, Qh5+)");
        console.log("• Checkmate: Add '#' after move (e.g., Qf7#)");
        console.log("=".repeat(60));
    }

    /**
     * Display help menu
     */
    displayHelp() {
        console.log("\n" + "=".repeat(50));
        console.log("🎮 CHESS GAME COMMANDS");
        console.log("=".repeat(50));
        console.log("📖 moves  → Show all possible chess moves with annotations");
        console.log("♟️  board  → Display current board position");
        console.log("📜 history → Show game move history");
        console.log("💾 save   → Save current position as PNG");
        console.log("🔄 status → Show current game status");
        console.log("❓ help   → Show this help menu");
        console.log("🚪 quit   → Exit the game");
        console.log("=".repeat(50));
        console.log("🎯 To make a move: Use any format → 'a2-a3' or 'a2 a3' or 'a2a3'");
        console.log("=".repeat(50));
    }

    /**
     * Play the specific game sequence you mentioned
     */
    async playExampleGame() {
        console.log("♟️ Starting chess game...");
        console.log("White: pawn e2 → e4");
        console.log("Black: pawn e7 → e5");
        console.log("White: bishop f1 → c4");
        console.log("Black: bishop f8 → c5");
        console.log("");

        // Save initial position
        this.updateChessboard();
        await this.saveCurrentPosition();

        // Move 1: White e2-e4
        console.log("=== Move 1 ===");
        if (this.makePlayerMove("e2", "e4")) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Black e7-e5 (specific for this demo)
            const move = this.chess.move("e5");
            if (move) {
                this.gameHistory[this.gameHistory.length - 1] += ` ${move.san}`;
                this.updateChessboard();
                await this.saveCurrentPosition();
                const annotation = this.getMoveAnnotation("e7", "e5");
                console.log(`\n🔹 ${move.san}: ${annotation}`);
                console.log(`Black plays: ${move.san}`);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Move 2: White Bf1-c4
        console.log("\n=== Move 2 ===");
        if (this.makePlayerMove("f1", "c4")) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Black Bf8-c5 (specific for this demo)
            const move = this.chess.move("Bc5");
            if (move) {
                this.gameHistory[this.gameHistory.length - 1] += ` ${move.san}`;
                this.updateChessboard();
                await this.saveCurrentPosition();
                const annotation = this.getMoveAnnotation("f8", "c5");
                console.log(`\n🔹 ${move.san}: ${annotation}`);
                console.log(`Black plays: ${move.san}`);
            }
        }

        console.log("\n🏁 Game sequence completed!");
        console.log("📜 Move history:", this.gameHistory.join(" "));

        // Create GIF
        await this.createGameGIF();
    }

    /**
     * Interactive game mode
     */
    async startInteractiveGame() {
        console.log("🎮 Starting interactive chess game!");
        console.log("🏳️ You are playing as White. Enter moves in any format:");
        console.log("   • a2-a3  (with dash) • a2 a3  (with space) • a2a3  (compact)");
        console.log("📖 Type 'moves' to see all possible moves, 'help' for commands");
        console.log("♟️  Type 'board' to see current position, 'quit' to exit");

        // Save initial position
        this.updateChessboard();
        await this.saveCurrentPosition();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const promptMove = () => {
            if (this.chess.isGameOver()) {
                console.log("\n🏁 Game Over!");
                if (this.chess.isCheckmate()) {
                    console.log(`👑 Checkmate! ${this.chess.turn() === 'w' ? 'Black' : 'White'} wins!`);
                } else if (this.chess.isDraw()) {
                    console.log("🤝 Draw!");
                }
                rl.close();
                return;
            }

            console.log(`\n${this.getGameStatus()}`);
            rl.question('🎯 Enter your move (or command): ', async (input) => {
                const inputStr = input.trim().toLowerCase();

                // Handle commands
                switch (inputStr) {
                    case 'quit':
                    case 'exit':
                        console.log("👋 Thanks for playing!");
                        rl.close();
                        return;

                    case 'board':
                        this.displayBoard();
                        promptMove();
                        return;

                    case 'moves':
                        this.displayAllMoves();
                        promptMove();
                        return;

                    case 'help':
                        this.displayHelp();
                        promptMove();
                        return;

                    case 'history':
                        console.log("\n📜 Game History:");
                        console.log(this.gameHistory.join(" "));
                        promptMove();
                        return;

                    case 'save':
                        await this.saveCurrentPosition();
                        promptMove();
                        return;

                    case 'status':
                        console.log(`\n📊 ${this.getGameStatus()}`);
                        console.log(`📈 Moves played: ${this.chess.history().length}`);
                        console.log(`🎯 Current turn: ${this.chess.turn() === 'w' ? 'White' : 'Black'}`);
                        promptMove();
                        return;
                }

                // Handle move input - support multiple formats
                let from, to;

                // Parse different move formats
                if (inputStr.includes('-')) {
                    // Format: a2-a3, e2-e4
                    [from, to] = inputStr.split('-');
                } else if (inputStr.includes(' ')) {
                    // Format: a2 a3, e2 e4
                    [from, to] = inputStr.split(' ');
                } else if (inputStr.length === 4) {
                    // Format: a2a3, e2e4
                    from = inputStr.substring(0, 2);
                    to = inputStr.substring(2, 4);
                } else {
                    console.log("❌ Invalid move format! Use one of these formats:");
                    console.log("   • a2-a3  (with dash)");
                    console.log("   • a2 a3  (with space)");
                    console.log("   • a2a3   (no separator)");
                    console.log("💡 Type 'help' for all commands");
                    promptMove();
                    return;
                }

                if (!from || !to || from.length !== 2 || to.length !== 2) {
                    console.log("❌ Invalid squares! Use format like: a2-a3, e2-e4, d1-h5");
                    console.log("💡 Type 'moves' to see all possible moves");
                    promptMove();
                    return;
                }

                if (this.makePlayerMove(from, to)) {
                    // Computer makes its move
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    this.makeComputerMove();
                    promptMove();
                } else {
                    console.log("❌ Invalid move! Try again.");
                    console.log("💡 Type 'moves' to see all possible moves");
                    promptMove();
                }
            });
        };

        promptMove();
    }

    /**
     * Create an animated GIF of the game
     */
    async createGameGIF() {
        try {
            console.log("🎬 Creating game GIF...");
            this.chessboard.loadPGN(this.chess.pgn());
            const buffer = await this.chessboard.buffer("image/gif", {
                delay: 1500,
                highlight: true
            });

            fs.writeFileSync('./chess_game.gif', buffer);
            console.log("🎬 Game GIF created: chess_game.gif");
        } catch (error) {
            console.error("❌ Error creating GIF:", error);
        }
    }

    /**
     * Get current game status
     */
    getGameStatus() {
        if (this.chess.isCheckmate()) {
            return `👑 Checkmate! ${this.chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
        } else if (this.chess.isCheck()) {
            return `⚠️  ${this.chess.turn() === 'w' ? 'White' : 'Black'} is in check!`;
        } else if (this.chess.isDraw()) {
            return "🤝 Draw!";
        } else {
            return `🎯 ${this.chess.turn() === 'w' ? 'White' : 'Black'} to move`;
        }
    }

    /**
     * Display current board position in ASCII
     */
    displayBoard() {
        console.log("\n" + "=".repeat(40));
        console.log("♟️  CURRENT BOARD POSITION");
        console.log("=".repeat(40));
        console.log(this.chess.ascii());
        console.log("\n" + this.getGameStatus());
        console.log("=".repeat(40));
    }
}

// Example usage
async function main() {
    const game = new ChessGame();

    // Check command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--interactive') || args.includes('-i')) {
        await game.startInteractiveGame();
    } else {
        // Play the specific sequence you mentioned
        await game.playExampleGame();
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { ChessGame };
export default ChessGame;
