// Pure, framework-free flag logic - unit-testable without React.
import type { CSSProperties } from "react";

export type LayoutKey =
    | "vertical" | "horizontal" | "vertical-bi" | "horizontal-bi"
    | "nordic" | "saltire" | "diagonal" | "chevron"
    | "disc" | "canton" | "quadrant" | "solid"
    | "stripes" | "star-stripes";

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

/** Turn a country name into a safe PNG filename. */
export function sanitizeFilename(name: string): string {
    return (name || "flag").toLowerCase().replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "flag";
}

/** Add item if absent, remove if present. Pure - returns a new array. */
export function toggleInList<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
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
