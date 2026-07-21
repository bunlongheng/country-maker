// Pure, framework-free flag logic - unit-testable without React.
import type { CSSProperties } from "react";

export type LayoutKey = "vertical" | "horizontal" | "vertical-bi" | "horizontal-bi" | "nordic" | "saltire" | "diagonal" | "chevron" | "disc" | "canton" | "quadrant" | "solid" | "stripes" | "star-stripes";

export const LAYOUTS: { key: LayoutKey; name: string; bands: number }[] = [
    { key: "vertical", name: "Vertical Tricolor", bands: 3 },
    { key: "horizontal", name: "Horizontal Tricolor", bands: 3 },
    { key: "vertical-bi", name: "Vertical Bicolor", bands: 2 },
    { key: "horizontal-bi", name: "Horizontal Bicolor", bands: 2 },
    { key: "stripes", name: "Stripes (USA)", bands: 2 },
    { key: "star-stripes", name: "Stars + Stripes", bands: 3 },
    { key: "nordic", name: "Nordic Cross", bands: 2 },
    { key: "saltire", name: "X Saltire", bands: 2 },
    { key: "diagonal", name: "Diagonal Split", bands: 2 },
    { key: "chevron", name: "Chevron", bands: 2 },
    { key: "disc", name: "Sun Disc (Japan)", bands: 2 },
    { key: "canton", name: "Canton + Field", bands: 3 },
    { key: "quadrant", name: "Quadrants", bands: 2 },
    { key: "solid", name: "Solid", bands: 1 },
];

export type FlagStyle = { baseStyle: CSSProperties; overlays: { clip: string; color: string }[] };

/** Map a layout + up to three band colors to a CSS background + optional clip-path overlays. Pure. */
export function buildFlagStyle(layout: LayoutKey, c1: string, c2: string, c3: string): FlagStyle {
    const stripes = `repeating-linear-gradient(to bottom, ${c1} 0 7.6923%, ${c2} 7.6923% 15.3846%)`;
    switch (layout) {
        case "solid":
            return { baseStyle: { background: c1 }, overlays: [] };
        case "vertical-bi":
            return { baseStyle: { background: `linear-gradient(to right, ${c1} 0 50%, ${c2} 50% 100%)` }, overlays: [] };
        case "horizontal-bi":
            return { baseStyle: { background: `linear-gradient(to bottom, ${c1} 0 50%, ${c2} 50% 100%)` }, overlays: [] };
        case "horizontal":
            return { baseStyle: { background: `linear-gradient(to bottom, ${c1} 0 33.34%, ${c2} 33.34% 66.67%, ${c3} 66.67% 100%)` }, overlays: [] };
        case "vertical":
            return { baseStyle: { background: `linear-gradient(to right, ${c1} 0 33.34%, ${c2} 33.34% 66.67%, ${c3} 66.67% 100%)` }, overlays: [] };
        case "stripes":
            return { baseStyle: { background: stripes }, overlays: [] };
        case "star-stripes":
            return { baseStyle: { background: `linear-gradient(${c3},${c3}) 0 0 / 40% 53.85% no-repeat, ${stripes}` }, overlays: [] };
        case "canton":
            return { baseStyle: { background: `linear-gradient(${c1}, ${c1}) 0 0 / 40% 100% no-repeat, linear-gradient(to bottom, ${c2} 0 50%, ${c3} 50% 100%)` }, overlays: [] };
        case "quadrant":
            return { baseStyle: { background: `linear-gradient(${c1},${c1}) 0 0/50% 50% no-repeat, linear-gradient(${c2},${c2}) 100% 0/50% 50% no-repeat, linear-gradient(${c2},${c2}) 0 100%/50% 50% no-repeat, linear-gradient(${c1},${c1}) 100% 100%/50% 50% no-repeat` }, overlays: [] };
        case "nordic":
            return { baseStyle: { background: `linear-gradient(${c2}, ${c2}) 0 50% / 100% 22% no-repeat, linear-gradient(${c2}, ${c2}) 32% 0 / 16% 100% no-repeat, ${c1}` }, overlays: [] };
        case "diagonal":
            return { baseStyle: { background: `linear-gradient(135deg, ${c1} 0 50%, ${c2} 50% 100%)` }, overlays: [] };
        case "disc":
            return { baseStyle: { background: `radial-gradient(circle at 50% 50%, ${c2} 0 33%, transparent 33.3%), ${c1}` }, overlays: [] };
        case "saltire":
            return {
                baseStyle: { background: c1 },
                overlays: [
                    { clip: "polygon(0% 0%, 15% 0%, 100% 82%, 100% 100%, 85% 100%, 0% 18%)", color: c2 },
                    { clip: "polygon(100% 0%, 100% 18%, 15% 100%, 0% 100%, 0% 82%, 85% 0%)", color: c2 },
                ],
            };
        case "chevron":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(0% 0%, 48% 50%, 0% 100%)", color: c2 }] };
        default:
            return { baseStyle: { background: c1 }, overlays: [] };
    }
}

/** Band-color pickers to show for a layout (1-3). */
export function bandsForLayout(layout: LayoutKey): number {
    return LAYOUTS.find((l) => l.key === layout)?.bands ?? 3;
}

/** Where to place the tap-to-recolor dots on the flag. Index i -> band color c(i+1). Pure. */
export function bandHotspots(layout: LayoutKey): { x: number; y: number }[] {
    switch (layout) {
        case "vertical":
            return [
                { x: 16, y: 50 },
                { x: 50, y: 50 },
                { x: 84, y: 50 },
            ];
        case "horizontal":
            return [
                { x: 50, y: 16 },
                { x: 50, y: 50 },
                { x: 50, y: 84 },
            ];
        case "vertical-bi":
            return [
                { x: 25, y: 50 },
                { x: 75, y: 50 },
            ];
        case "horizontal-bi":
            return [
                { x: 50, y: 25 },
                { x: 50, y: 75 },
            ];
        case "stripes":
            return [
                { x: 50, y: 12 },
                { x: 50, y: 20 },
            ];
        case "star-stripes":
            return [
                { x: 70, y: 15 },
                { x: 70, y: 23 },
                { x: 20, y: 25 },
            ];
        case "nordic":
            return [
                { x: 16, y: 22 },
                { x: 32, y: 50 },
            ];
        case "saltire":
            return [
                { x: 16, y: 16 },
                { x: 50, y: 50 },
            ];
        case "diagonal":
            return [
                { x: 75, y: 25 },
                { x: 25, y: 75 },
            ];
        case "chevron":
            return [
                { x: 78, y: 50 },
                { x: 12, y: 50 },
            ];
        case "disc":
            return [
                { x: 16, y: 16 },
                { x: 50, y: 50 },
            ];
        case "canton":
            return [
                { x: 20, y: 25 },
                { x: 75, y: 25 },
                { x: 75, y: 75 },
            ];
        case "quadrant":
            return [
                { x: 25, y: 25 },
                { x: 75, y: 25 },
            ];
        default:
            return [{ x: 50, y: 50 }];
    }
}

/** Turn a country name into a safe PNG filename. */
export function sanitizeFilename(name: string): string {
    return (
        (name || "flag")
            .toLowerCase()
            .replace(/[^a-z0-9-]/gi, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "flag"
    );
}

/** Add item if absent, remove if present. Pure - returns a new array. */
export function toggleInList<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

// ---- Placed emblems (each lives at its own x,y % on the flag) ----

export type Placed = { id: string; kind: "emblem" | "text"; ref: string; x: number; y: number };

/** Clamp a position value to the flag's 0-100% range. */
export const clampPos = (n: number): number => Math.min(100, Math.max(0, n));

/** How far to nudge a new emblem so it does not stack exactly on the centre. */
export function centerNudge(placed: Placed[]): number {
    const near = placed.filter((p) => Math.abs(p.x - 50) < 6 && Math.abs(p.y - 50) < 6).length;
    return Math.min(near * 7, 28);
}

/** Add an emblem at the centre (nudged if busy). Pure - returns the new list. */
export function addEmblemAt(placed: Placed[], id: string, ref: string): Placed[] {
    const off = centerNudge(placed);
    return [...placed, { id, kind: "emblem", ref, x: 50 + off, y: 50 + off }];
}

/** Create/update/remove the single text item to match the input. Pure. */
export function upsertText(placed: Placed[], text: string): Placed[] {
    if (!text.trim()) return placed.filter((p) => p.kind !== "text");
    if (placed.some((p) => p.kind === "text")) return placed.map((p) => (p.kind === "text" ? { ...p, ref: text } : p));
    return [...placed, { id: "text", kind: "text", ref: text, x: 50, y: 66 }];
}

/** Move one placed item to a new clamped position. Pure. */
export function moveItem(placed: Placed[], id: string, x: number, y: number): Placed[] {
    return placed.map((p) => (p.id === id ? { ...p, x: clampPos(x), y: clampPos(y) } : p));
}

/** Whitelist-sanitize an untrusted SVG string before it is injected as HTML. */
export function sanitizeSvg(raw: string): string {
    if (!raw.includes("<svg")) return "";
    return raw
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
        .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
        .replace(/(href|xlink:href)\s*=\s*"(?!#)[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
}
