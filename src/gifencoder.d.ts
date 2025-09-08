declare module "gifencoder" {
    import { Stream } from "stream";

    class GIFEncoder {
        constructor(width: number, height: number);
        start(): void;
        setRepeat(repeat: number): void;
        setDelay(delay: number): void;
        createReadStream(): Stream;
        addFrame(ctx: unknown): void;
        finish(): void;
    }

    export = GIFEncoder;
}
