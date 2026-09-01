// Pure, framework-free flag logic - unit-testable without React.
import type { CSSProperties } from "react";

export type LayoutKey =
    | "vertical"
    | "horizontal"
    | "vertical-bi"
    | "horizontal-bi"
    | "nordic"
    | "saltire"
    | "diagonal"
    | "chevron"
    | "disc"
    | "canton"
    | "quadrant"
    | "solid"
    | "stripes"
    | "star-stripes"
    | "v-stripes"
    | "pale"
    | "fess"
    | "cross"
    | "border"
    | "bend"
    | "diamond"
    | "triangle-hoist"
    | "pile"
    | "chevron-r"
    | "spanish"
    | "pale-wide"
    | "x-quad"
    | "bend-up"
    | "corner"
    | "bahrain"
    | "seychelles"
    | "belarus"
    | "chevron-up"
    | "cross-thin"
    | "corner-br"
    | "union"
    | "penta-h"
    | "penta-v"
    | "kiribati"
    | "nordic2"
    | "greece";

export const LAYOUTS: { key: LayoutKey; name: string; bands: number }[] = [
    { key: "vertical", name: "Vertical Tricolor", bands: 3 },
    { key: "horizontal", name: "Horizontal Tricolor", bands: 3 },
    { key: "vertical-bi", name: "Vertical Bicolor", bands: 2 },
    { key: "horizontal-bi", name: "Horizontal Bicolor", bands: 2 },
    { key: "stripes", name: "Stripes (USA)", bands: 2 },
    { key: "star-stripes", name: "Stars + Stripes", bands: 3 },
    { key: "nordic", name: "Nordic Cross", bands: 2 },
    { key: "nordic2", name: "Norway Cross", bands: 3 },
    { key: "greece", name: "Greece", bands: 2 },
    { key: "saltire", name: "X Saltire", bands: 2 },
    { key: "diagonal", name: "Diagonal Split", bands: 2 },
    { key: "chevron", name: "Chevron", bands: 2 },
    { key: "disc", name: "Sun Disc (Japan)", bands: 2 },
    { key: "canton", name: "Canton + Field", bands: 3 },
    { key: "solid", name: "Solid", bands: 1 },
    { key: "pale", name: "Center Pale", bands: 2 },
    { key: "fess", name: "Center Fess", bands: 2 },
    { key: "cross", name: "Centered Cross", bands: 2 },
    { key: "border", name: "Bordered", bands: 2 },
    { key: "bend", name: "Diagonal Bend", bands: 2 },
    { key: "diamond", name: "Diamond", bands: 2 },
    { key: "triangle-hoist", name: "Triangle", bands: 3 },
    { key: "spanish", name: "Spanish Fess", bands: 2 },
    { key: "pale-wide", name: "Wide Pale", bands: 2 },
    { key: "bend-up", name: "Rising Bend", bands: 2 },
    { key: "bahrain", name: "Serrated", bands: 2 },
    { key: "seychelles", name: "Rays", bands: 3 },
    { key: "belarus", name: "Ornament", bands: 3 },
    { key: "union", name: "Union Jack", bands: 3 },
    { key: "penta-h", name: "5 Stripes", bands: 3 },
    { key: "kiribati", name: "Kiribati", bands: 3 },
];

export type FlagStyle = { baseStyle: CSSProperties; overlays: { clip: string; color: string }[] };

// A horizontal wavy band centred at yc% with height h%, sinusoidal top/bottom edges.
function waveBand(yc: number, h: number, amp: number, waves: number): string {
    const steps = 20;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * 100;
        pts.push(`${x.toFixed(1)}% ${(yc - h / 2 + amp * Math.sin((x / 100) * waves * 2 * Math.PI)).toFixed(1)}%`);
    }
    for (let i = steps; i >= 0; i--) {
        const x = (i / steps) * 100;
        pts.push(`${x.toFixed(1)}% ${(yc + h / 2 + amp * Math.sin((x / 100) * waves * 2 * Math.PI)).toFixed(1)}%`);
    }
    return `polygon(${pts.join(", ")})`;
}

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
        case "v-stripes":
            return { baseStyle: { background: `repeating-linear-gradient(to right, ${c1} 0 7.6923%, ${c2} 7.6923% 15.3846%)` }, overlays: [] };
        case "pale":
            return { baseStyle: { background: `linear-gradient(${c2}, ${c2}) 50% 0 / 33.34% 100% no-repeat, ${c1}` }, overlays: [] };
        case "fess":
            return { baseStyle: { background: `linear-gradient(${c2}, ${c2}) 0 50% / 100% 33.34% no-repeat, ${c1}` }, overlays: [] };
        case "cross":
            return { baseStyle: { background: `linear-gradient(${c2}, ${c2}) 0 50% / 100% 22% no-repeat, linear-gradient(${c2}, ${c2}) 50% 0 / 16% 100% no-repeat, ${c1}` }, overlays: [] };
        case "border":
            return { baseStyle: { background: `linear-gradient(${c1}, ${c1}) 50% 50% / 80% 70% no-repeat, ${c2}` }, overlays: [] };
        case "bend":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(0% 0%, 22% 0%, 100% 78%, 100% 100%, 78% 100%, 0% 22%)", color: c2 }] };
        case "diamond":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(50% 8%, 92% 50%, 50% 92%, 8% 50%)", color: c2 }] };
        case "triangle-hoist":
            return { baseStyle: { background: `linear-gradient(to bottom, ${c2} 0 50%, ${c3} 50% 100%)` }, overlays: [{ clip: "polygon(0 0, 55% 50%, 0 100%)", color: c1 }] };
        case "pile":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(0 0, 100% 0, 50% 62%)", color: c2 }] };
        case "chevron-r":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(100% 0, 52% 50%, 100% 100%)", color: c2 }] };
        case "spanish":
            return { baseStyle: { background: `linear-gradient(to bottom, ${c1} 0 25%, ${c2} 25% 75%, ${c1} 75% 100%)` }, overlays: [] };
        case "pale-wide":
            return { baseStyle: { background: `linear-gradient(to right, ${c1} 0 25%, ${c2} 25% 75%, ${c1} 75% 100%)` }, overlays: [] };
        case "x-quad":
            return {
                baseStyle: { background: c1 },
                overlays: [
                    { clip: "polygon(0 0, 50% 50%, 0 100%)", color: c2 },
                    { clip: "polygon(100% 0, 50% 50%, 100% 100%)", color: c2 },
                ],
            };
        case "bend-up":
            return { baseStyle: { background: `linear-gradient(45deg, ${c1} 0 50%, ${c2} 50% 100%)` }, overlays: [] };
        case "corner":
            return { baseStyle: { background: c2 }, overlays: [{ clip: "polygon(0 0, 46% 0, 0 66%)", color: c1 }] };
        case "bahrain":
            return { baseStyle: { background: c2 }, overlays: [{ clip: "polygon(0 0, 30% 0, 45% 10%, 30% 20%, 45% 30%, 30% 40%, 45% 50%, 30% 60%, 45% 70%, 30% 80%, 45% 90%, 30% 100%, 0 100%)", color: c1 }] };
        case "seychelles":
            return { baseStyle: { background: `conic-gradient(from 0deg at 0% 100%, ${c1} 0 30deg, ${c2} 30deg 60deg, ${c3} 60deg 100%)` }, overlays: [] };
        case "belarus":
            return {
                baseStyle: {
                    background: `repeating-linear-gradient(45deg, ${c1} 0 2px, transparent 2px 8px) 0 0 / 14% 100% no-repeat, repeating-linear-gradient(-45deg, ${c1} 0 2px, transparent 2px 8px) 0 0 / 14% 100% no-repeat, linear-gradient(${c2}, ${c2}) 0 0 / 14% 100% no-repeat, linear-gradient(to bottom, ${c1} 0 66.6%, ${c3} 66.6% 100%)`,
                },
                overlays: [],
            };
        case "chevron-up":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(0 100%, 100% 100%, 50% 38%)", color: c2 }] };
        case "cross-thin":
            return { baseStyle: { background: `linear-gradient(${c2}, ${c2}) 0 50% / 100% 12% no-repeat, linear-gradient(${c2}, ${c2}) 50% 0 / 8% 100% no-repeat, ${c1}` }, overlays: [] };
        case "corner-br":
            return { baseStyle: { background: c1 }, overlays: [{ clip: "polygon(100% 100%, 54% 100%, 100% 34%)", color: c2 }] };
        case "union":
            // Union Jack: blue field, white then red saltire (X), then white then red upright cross (+).
            return {
                baseStyle: { background: c1 },
                overlays: [
                    { clip: "polygon(0% 0%, 15% 0%, 100% 78%, 100% 100%, 85% 100%, 0% 22%)", color: c2 },
                    { clip: "polygon(100% 0%, 100% 22%, 15% 100%, 0% 100%, 0% 78%, 85% 0%)", color: c2 },
                    { clip: "polygon(0% 0%, 8% 0%, 100% 84%, 100% 100%, 92% 100%, 0% 16%)", color: c3 },
                    { clip: "polygon(100% 0%, 100% 16%, 8% 100%, 0% 100%, 0% 84%, 92% 0%)", color: c3 },
                    { clip: "polygon(40% 0, 60% 0, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0 60%, 0 40%, 40% 40%)", color: c2 },
                    { clip: "polygon(45% 0, 55% 0, 55% 45%, 100% 45%, 100% 55%, 55% 55%, 55% 100%, 45% 100%, 45% 55%, 0 55%, 0 45%, 45% 45%)", color: c3 },
                ],
            };
        case "penta-h":
            return { baseStyle: { background: `linear-gradient(to bottom, ${c1} 0 20%, ${c2} 20% 40%, ${c3} 40% 60%, ${c2} 60% 80%, ${c1} 80% 100%)` }, overlays: [] };
        case "penta-v":
            return { baseStyle: { background: `linear-gradient(to right, ${c1} 0 20%, ${c2} 20% 40%, ${c3} 40% 60%, ${c2} 60% 80%, ${c1} 80% 100%)` }, overlays: [] };
        case "kiribati":
            // Base for the Kiribati flag: red top (add the bird sticker), wavy sea below (white with blue waves).
            return {
                baseStyle: { background: `linear-gradient(to bottom, ${c1} 0 50%, ${c2} 50% 100%)` },
                overlays: [
                    { clip: waveBand(57, 8.5, 2.5, 4), color: c3 },
                    { clip: waveBand(73, 8.5, 2.5, 4), color: c3 },
                    { clip: waveBand(89, 8.5, 2.5, 4), color: c3 },
                ],
            };
        case "nordic2":
            // Norway/Iceland: a coloured cross (c3) fimbriated in white (c2) on a coloured field (c1).
            return {
                baseStyle: {
                    background: `linear-gradient(${c3},${c3}) 0 50% / 100% 12% no-repeat, linear-gradient(${c3},${c3}) 32.95% 0 / 12% 100% no-repeat, linear-gradient(${c2},${c2}) 0 50% / 100% 24% no-repeat, linear-gradient(${c2},${c2}) 30.26% 0 / 24% 100% no-repeat, ${c1}`,
                },
                overlays: [],
            };
        case "greece":
            // Greece: 9 blue/white stripes with a blue canton carrying a white cross.
            return {
                baseStyle: {
                    background: `linear-gradient(${c1},${c1}) 16% 0 / 7.4% 55.55% no-repeat, linear-gradient(${c1},${c1}) 0 25% / 37% 11.11% no-repeat, linear-gradient(${c2},${c2}) 0 0 / 37% 55.55% no-repeat, repeating-linear-gradient(to bottom, ${c2} 0 11.111%, ${c1} 11.111% 22.222%)`,
                },
                overlays: [],
            };
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
        case "v-stripes":
            return [
                { x: 8, y: 50 },
                { x: 16, y: 50 },
            ];
        case "pale":
            return [
                { x: 16, y: 50 },
                { x: 50, y: 50 },
            ];
        case "fess":
            return [
                { x: 16, y: 16 },
                { x: 50, y: 50 },
            ];
        case "cross":
            return [
                { x: 16, y: 20 },
                { x: 50, y: 50 },
            ];
        case "border":
            return [
                { x: 50, y: 50 },
                { x: 6, y: 50 },
            ];
        case "bend":
            return [
                { x: 78, y: 22 },
                { x: 40, y: 62 },
            ];
        case "diamond":
            return [
                { x: 14, y: 14 },
                { x: 50, y: 50 },
            ];
        default:
            return [{ x: 50, y: 50 }];
    }
}

// A highlightable region on the flag: a plain rectangle (left/top/width/height %) or a clip-path shape.
export type BandShape = { rect: [number, number, number, number] } | { clip: string };
const WHOLE: BandShape = { rect: [0, 0, 100, 100] };

const STRIPE = 100 / 13; // 13 alternating stripes (USA-style), ~7.6923% each
const horizStripes = (even: boolean): BandShape[] =>
    Array.from({ length: 13 }, (_, i) => i)
        .filter((i) => i % 2 === (even ? 0 : 1))
        .map((i) => ({ rect: [0, i * STRIPE, 100, STRIPE] }) as BandShape);
const vertStripes = (even: boolean): BandShape[] =>
    Array.from({ length: 13 }, (_, i) => i)
        .filter((i) => i % 2 === (even ? 0 : 1))
        .map((i) => ({ rect: [i * STRIPE, 0, STRIPE, 100] }) as BandShape);

/** The actual area(s) each band's color fills, so the picker can light up the whole stripe (not a tiny dot). */
export function bandRegions(layout: LayoutKey): BandShape[][] {
    switch (layout) {
        case "vertical":
            return [[{ rect: [0, 0, 33.34, 100] }], [{ rect: [33.33, 0, 33.34, 100] }], [{ rect: [66.67, 0, 33.33, 100] }]];
        case "horizontal":
            return [[{ rect: [0, 0, 100, 33.34] }], [{ rect: [0, 33.33, 100, 33.34] }], [{ rect: [0, 66.67, 100, 33.33] }]];
        case "vertical-bi":
            return [[{ rect: [0, 0, 50, 100] }], [{ rect: [50, 0, 50, 100] }]];
        case "horizontal-bi":
            return [[{ rect: [0, 0, 100, 50] }], [{ rect: [0, 50, 100, 50] }]];
        case "stripes":
            return [horizStripes(true), horizStripes(false)];
        case "star-stripes":
            return [horizStripes(true), horizStripes(false), [{ rect: [0, 0, 40, 53.85] }]];
        case "nordic":
            // Vertical bar sits at 26.88%-42.88% (background 32% pos, 16% wide); horizontal bar 39%-61%.
            return [[WHOLE], [{ clip: "polygon(26.88% 0, 42.88% 0, 42.88% 39%, 100% 39%, 100% 61%, 42.88% 61%, 42.88% 100%, 26.88% 100%, 26.88% 61%, 0 61%, 0 39%, 26.88% 39%)" }]];
        case "saltire":
            return [[WHOLE], [{ clip: "polygon(0% 0%, 15% 0%, 100% 82%, 100% 100%, 85% 100%, 0% 18%)" }, { clip: "polygon(100% 0%, 100% 18%, 15% 100%, 0% 100%, 0% 82%, 85% 0%)" }]];
        case "diagonal":
            return [[{ clip: "polygon(0 0, 100% 0, 0 100%)" }], [{ clip: "polygon(100% 0, 100% 100%, 0 100%)" }]];
        case "chevron":
            return [[WHOLE], [{ clip: "polygon(0% 0%, 48% 50%, 0% 100%)" }]];
        case "disc":
            return [[WHOLE], [{ clip: "ellipse(22% 33% at 50% 50%)" }]];
        case "canton":
            return [[{ rect: [0, 0, 40, 100] }], [{ rect: [40, 0, 60, 50] }], [{ rect: [40, 50, 60, 50] }]];
        case "quadrant":
            return [
                [{ rect: [0, 0, 50, 50] }, { rect: [50, 50, 50, 50] }],
                [{ rect: [50, 0, 50, 50] }, { rect: [0, 50, 50, 50] }],
            ];
        case "v-stripes":
            return [vertStripes(true), vertStripes(false)];
        case "pale":
            return [[WHOLE], [{ rect: [33.33, 0, 33.34, 100] }]];
        case "fess":
            return [[WHOLE], [{ rect: [0, 33.33, 100, 33.34] }]];
        case "cross":
            return [[WHOLE], [{ clip: "polygon(42% 0, 58% 0, 58% 39%, 100% 39%, 100% 61%, 58% 61%, 58% 100%, 42% 100%, 42% 61%, 0 61%, 0 39%, 42% 39%)" }]];
        case "border":
            return [[{ rect: [10, 15, 80, 70] }], [WHOLE]];
        case "bend":
            return [[WHOLE], [{ clip: "polygon(0% 0%, 22% 0%, 100% 78%, 100% 100%, 78% 100%, 0% 22%)" }]];
        case "diamond":
            return [[WHOLE], [{ clip: "polygon(50% 8%, 92% 50%, 50% 92%, 8% 50%)" }]];
        case "triangle-hoist":
            return [[{ clip: "polygon(0 0, 55% 50%, 0 100%)" }], [{ rect: [0, 0, 100, 50] }], [{ rect: [0, 50, 100, 50] }]];
        case "pile":
            return [[WHOLE], [{ clip: "polygon(0 0, 100% 0, 50% 62%)" }]];
        case "chevron-r":
            return [[WHOLE], [{ clip: "polygon(100% 0, 52% 50%, 100% 100%)" }]];
        case "spanish":
            return [[{ rect: [0, 0, 100, 25] }, { rect: [0, 75, 100, 25] }], [{ rect: [0, 25, 100, 50] }]];
        case "pale-wide":
            return [[{ rect: [0, 0, 25, 100] }, { rect: [75, 0, 25, 100] }], [{ rect: [25, 0, 50, 100] }]];
        case "x-quad":
            return [
                [{ clip: "polygon(0 0, 100% 0, 50% 50%)" }, { clip: "polygon(0 100%, 100% 100%, 50% 50%)" }],
                [{ clip: "polygon(0 0, 50% 50%, 0 100%)" }, { clip: "polygon(100% 0, 50% 50%, 100% 100%)" }],
            ];
        case "bend-up":
            return [[{ clip: "polygon(0 0, 100% 100%, 0 100%)" }], [{ clip: "polygon(0 0, 100% 0, 100% 100%)" }]];
        case "corner":
            return [[WHOLE], [{ clip: "polygon(0 0, 46% 0, 0 66%)" }]];
        case "bahrain":
            return [[{ clip: "polygon(0 0, 30% 0, 45% 10%, 30% 20%, 45% 30%, 30% 40%, 45% 50%, 30% 60%, 45% 70%, 30% 80%, 45% 90%, 30% 100%, 0 100%)" }], [WHOLE]];
        case "seychelles":
            return [[{ rect: [2, 2, 30, 34] }], [{ rect: [28, 30, 34, 40] }], [{ rect: [55, 60, 43, 38] }]];
        case "belarus":
            return [[{ rect: [14, 0, 86, 66.6] }], [{ rect: [0, 0, 14, 100] }], [{ rect: [14, 66.6, 86, 33.4] }]];
        case "chevron-up":
            return [[WHOLE], [{ clip: "polygon(0 100%, 100% 100%, 50% 38%)" }]];
        case "cross-thin":
            return [[WHOLE], [{ clip: "polygon(46% 0, 54% 0, 54% 44%, 100% 44%, 100% 56%, 54% 56%, 54% 100%, 46% 100%, 46% 56%, 0 56%, 0 44%, 46% 44%)" }]];
        case "corner-br":
            return [[WHOLE], [{ clip: "polygon(100% 100%, 54% 100%, 100% 34%)" }]];
        case "union":
            return [[{ rect: [3, 3, 15, 14] }], [{ rect: [20, 6, 12, 9] }], [{ rect: [46, 2, 8, 12] }]];
        case "penta-h":
            return [[{ rect: [0, 0, 100, 20] }, { rect: [0, 80, 100, 20] }], [{ rect: [0, 20, 100, 20] }, { rect: [0, 60, 100, 20] }], [{ rect: [0, 40, 100, 20] }]];
        case "penta-v":
            return [[{ rect: [0, 0, 20, 100] }, { rect: [80, 0, 20, 100] }], [{ rect: [20, 0, 20, 100] }, { rect: [60, 0, 20, 100] }], [{ rect: [40, 0, 20, 100] }]];
        case "kiribati":
            return [[{ rect: [0, 0, 100, 50] }], [{ rect: [0, 50, 100, 5] }, { rect: [0, 64, 100, 5] }, { rect: [0, 96, 100, 4] }], [{ rect: [0, 55, 100, 6] }, { rect: [0, 71, 100, 6] }, { rect: [0, 87, 100, 6] }]];
        case "nordic2":
            // White fimbriation band (c2) either side of the coloured cross; picker lights the cross area.
            return [[WHOLE], [{ clip: "polygon(24.26% 0, 48.26% 0, 48.26% 38%, 100% 38%, 100% 62%, 48.26% 62%, 48.26% 100%, 24.26% 100%, 24.26% 62%, 0 62%, 0 38%, 24.26% 38%)" }], [{ clip: "polygon(30.26% 0, 42.26% 0, 42.26% 44%, 100% 44%, 100% 56%, 42.26% 56%, 42.26% 100%, 30.26% 100%, 30.26% 56%, 0 56%, 0 44%, 30.26% 44%)" }]];
        case "greece":
            // Band 1 = white (odd stripes + cross), band 2 = blue (even stripes + canton).
            return [
                [{ rect: [37, 11.11, 63, 11.11] }, { rect: [37, 33.33, 63, 11.11] }, { rect: [14.8, 22.2, 22.2, 11.11] }],
                [{ rect: [0, 0, 37, 55.55] }, { rect: [37, 0, 63, 11.11] }, { rect: [37, 22.22, 63, 11.11] }],
            ];
        default:
            return [[WHOLE]];
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

// ---- Placed emblems (each lives at its own x,y % on the flag, with its own color/size/rotation) ----

export const EMBLEM_SIZE_MIN = 40;
export const EMBLEM_SIZE_MAX = 240;
export const EMBLEM_SIZE_DEFAULT = 100;
export const EMBLEM_COLOR_DEFAULT = "#FFC400";

export type Placed = { id: string; kind: "emblem" | "text"; ref: string; x: number; y: number; color?: string; size?: number; rot?: number };

/** Clamp a position value to the flag's 0-100% range. */
export const clampPos = (n: number): number => Math.min(100, Math.max(0, n));

/** How far to nudge a new emblem so it does not stack exactly on the centre. */
export function centerNudge(placed: Placed[]): number {
    const near = placed.filter((p) => Math.abs(p.x - 50) < 6 && Math.abs(p.y - 50) < 6).length;
    return Math.min(near * 7, 28);
}

/** Add an emblem at the centre (nudged if busy), with its own color/size/rotation. Pure. */
export function addEmblemAt(placed: Placed[], id: string, ref: string, color: string = EMBLEM_COLOR_DEFAULT, size: number = EMBLEM_SIZE_DEFAULT): Placed[] {
    const off = centerNudge(placed);
    return [...placed, { id, kind: "emblem", ref, x: 50 + off, y: 50 + off, color, size, rot: 0 }];
}

/** Create/update/remove the single text item to match the input. Pure. */
export function upsertText(placed: Placed[], text: string): Placed[] {
    if (!text.trim()) return placed.filter((p) => p.kind !== "text");
    if (placed.some((p) => p.kind === "text")) return placed.map((p) => (p.kind === "text" ? { ...p, ref: text } : p));
    return [...placed, { id: "text", kind: "text", ref: text, x: 50, y: 66, color: EMBLEM_COLOR_DEFAULT, size: EMBLEM_SIZE_DEFAULT, rot: 0 }];
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
