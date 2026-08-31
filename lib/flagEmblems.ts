// Filled, flag-worthy emblems (Japan disc, Argentina Sol de Mayo, Bhutan-style
// dragon, crescent + star, etc.). Rendered via dangerouslySetInnerHTML with the
// container's `color` mapped to `currentColor`, so a single emblem color drives fill.

import { ANGKOR_WAT_SVG, DRUK_SVG, ERITREA_WREATH_SVG, FRIGATEBIRD_SVG, EAGLE_SVG, KYRGYZ_SUN_SVG, MACEDONIA_SUN_SVG } from "@/lib/emblemSvgs";

export type FlagEmblem = { name: string; slug: string; svg: string };

// Sol de Mayo style sun: alternating long/short triangular rays around a disc.
function buildSun(): string {
    const cx = 50,
        cy = 50,
        r1 = 19,
        discR = 20,
        N = 16;
    let rays = "";
    for (let i = 0; i < N * 2; i++) {
        const a = (i / (N * 2)) * Math.PI * 2;
        const r2 = i % 2 === 0 ? 47 : 39;
        const w = 0.16; // half-width in radians at the base
        const apex = [cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)];
        const b1 = [cx + r1 * Math.cos(a - w), cy + r1 * Math.sin(a - w)];
        const b2 = [cx + r1 * Math.cos(a + w), cy + r1 * Math.sin(a + w)];
        const f = (n: number) => n.toFixed(2);
        rays += `M${f(apex[0])} ${f(apex[1])} L${f(b1[0])} ${f(b1[1])} L${f(b2[0])} ${f(b2[1])} Z `;
    }
    return `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${rays}"/><circle cx="${cx}" cy="${cy}" r="${discR}"/></svg>`;
}

const wrap = (viewBox: string, d: string) => `<svg viewBox="${viewBox}" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;

// Compass "north star": a sharp 4-point star with smaller diagonal points.
function buildNorthStar(): string {
    const cx = 50,
        cy = 50;
    const star = (pts: number, rO: number, rI: number, rot: number) => {
        let d = "";
        for (let i = 0; i < pts * 2; i++) {
            const a = rot + (i * Math.PI) / pts;
            const r = i % 2 === 0 ? rO : rI;
            d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
        }
        return d + "Z ";
    };
    const up = -Math.PI / 2;
    return `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${star(4, 48, 9, up) + star(4, 24, 7, up + Math.PI / 4)}"/></svg>`;
}

// One star centred in the box, `pts` points, outer radius rO, inner ratio.
const starPath = (cx: number, cy: number, pts: number, rO: number, ratio = 0.42) => {
    let d = "";
    const up = -Math.PI / 2;
    for (let i = 0; i < pts * 2; i++) {
        const a = up + (i * Math.PI) / pts;
        const r = i % 2 === 0 ? rO : rO * ratio;
        d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)} `;
    }
    return d + "Z ";
};
const buildStar = (pts: number, rO = 46, ratio = 0.42) => `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${starPath(50, 50, pts, rO, ratio)}"/></svg>`;
// Southern Cross (flag of Australia): four 7-point stars + one small 5-point star.
const buildSouthernCross = () => `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${starPath(50, 84, 7, 13) + starPath(24, 52, 7, 13) + starPath(50, 16, 7, 13) + starPath(74, 42, 7, 13) + starPath(61, 63, 5, 7)}"/></svg>`;

export const FLAG_EMBLEMS: FlagEmblem[] = [
    { name: "Sun", slug: "sun-rays", svg: buildSun() },
    { name: "Star 5", slug: "star-5", svg: buildStar(5) },
    { name: "Star 6", slug: "star-6", svg: buildStar(6) },
    { name: "Star 7", slug: "star-7", svg: buildStar(7, 46, 0.44) },
    { name: "Star 8", slug: "star-8", svg: buildStar(8) },
    { name: "Southern Cross", slug: "southern-cross", svg: buildSouthernCross() },
    { name: "Star of David", slug: "star-of-david", svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M50 6 L88.1 72 L11.9 72 Z"/><path d="M50 94 L88.1 28 L11.9 28 Z"/></svg>` },
    { name: "Yin Yang", slug: "yin-yang", svg: `<svg viewBox="0 0 100 100" fill="currentColor" fill-rule="evenodd" xmlns="http://www.w3.org/2000/svg"><path d="M50 5a45 45 0 100 90 22.5 22.5 0 010-45 22.5 22.5 0 000-45z m0 25.5a3.6 3.6 0 100 7.2 3.6 3.6 0 000-7.2z"/><circle cx="50" cy="69" r="3.6"/></svg>` },
    { name: "Plus", slug: "plus", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M42 8h16v34h34v16H58v34H42V58H8V42h34z"/></svg>` },
    { name: "Wreath", slug: "wreath", svg: ERITREA_WREATH_SVG },
    { name: "Bird", slug: "bird", svg: FRIGATEBIRD_SVG },
    { name: "Eagle", slug: "eagle", svg: EAGLE_SVG },
    { name: "Sun Wheel", slug: "kyrgyz-sun", svg: KYRGYZ_SUN_SVG },
    { name: "Sun Burst", slug: "macedonia-sun", svg: MACEDONIA_SUN_SVG },
    { name: "Nordic Cross", slug: "nordic-cross", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 40 H100 V60 H0 Z M26 0 H46 V100 H26 Z"/></svg>` },
    { name: "North Star", slug: "north-star", svg: buildNorthStar() },
    { name: "Fir Tree", slug: "fir-tree", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M50 8 L64 40 L36 40 Z M50 30 L74 64 L26 64 Z M50 54 L84 88 L16 88 Z M44 88 L56 88 L56 97 L44 97 Z"/></svg>` },
    { name: "Hammer", slug: "mjolnir", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M42 6 H58 V20 H42 Z M47 18 H53 V56 H47 Z M20 52 H80 V66 H20 Z M20 52 H34 V90 H20 Z M66 52 H80 V90 H66 Z"/></svg>` },
    { name: "Sun Cross", slug: "sun-cross", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="9"/><path d="M45.5 8 H54.5 V92 H45.5 Z M8 45.5 H92 V54.5 H8 Z"/></svg>` },
    { name: "Angkor Wat", slug: "angkor-wat", svg: ANGKOR_WAT_SVG },
    { name: "Triangle", slug: "triangle", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M50 12 L88 84 L12 84 Z"/></svg>` },
    { name: "Dragon", slug: "dragon", svg: DRUK_SVG },
    {
        name: "Crescent",
        slug: "crescent-star",
        svg: wrap(
            "0 0 512 512",
            "M0 256C0 114.6 114.6 0 256 0c33 0 64.6 6.3 93.6 17.7c7.4 2.9 11.5 10.7 9.8 18.4s-8.8 13-16.7 12.4c-4.8-.3-9.7-.5-14.6-.5c-114.9 0-208 93.1-208 208s93.1 208 208 208c4.9 0 9.8-.2 14.6-.5c7.9-.5 15 4.7 16.7 12.4s-2.4 15.5-9.8 18.4C320.6 505.7 289 512 256 512C114.6 512 0 397.4 0 256zM375.4 137.4c3.5-7.1 13.7-7.1 17.2 0l31.5 63.8c1.4 2.8 4.1 4.8 7.2 5.3l70.4 10.2c7.9 1.1 11 10.8 5.3 16.4l-50.9 49.6c-2.3 2.2-3.3 5.4-2.8 8.5l12 70.1c1.3 7.8-6.9 13.8-13.9 10.1l-63-33.1c-2.8-1.5-6.1-1.5-8.9 0l-63 33.1c-7 3.7-15.3-2.3-13.9-10.1l12-70.1c.5-3.1-.5-6.3-2.8-8.5L261 233.1c-5.7-5.6-2.6-15.2 5.3-16.4l70.4-10.2c3.1-.5 5.8-2.4 7.2-5.3l31.5-63.8z",
        ),
    },
    { name: "Disc", slug: "disc", svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="34"/></svg>` },
    {
        name: "Star",
        slug: "star-solid",
        svg: wrap("0 0 576 512", "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"),
    },
    {
        name: "Crown",
        slug: "crown",
        svg: wrap(
            "0 0 576 512",
            "M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z",
        ),
    },
    {
        name: "Shield",
        slug: "shield-solid",
        svg: wrap("0 0 512 512", "M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"),
    },
    {
        name: "Maple",
        slug: "maple-leaf",
        svg: wrap(
            "0 0 512 512",
            "M383.8 351.7c2.5-2.5 105.2-92.4 105.2-92.4l-17.5-7.5c-10-4.9-7.4-11.5-5-17.4 2.4-7.6 20.1-67.3 20.1-67.3s-47.7 10-57.7 12.5c-7.5 2.4-10-2.5-12.5-7.5s-15-32.4-15-32.4-52.6 59.9-55.1 62.3c-10 7.5-20.1 0-17.6-10 0-10 27.6-129.6 27.6-129.6s-30.1 17.4-40.1 22.4c-7.5 5-12.6 5-17.6-5C293.5 72.3 255.9 0 255.9 0s-37.5 72.3-42.5 79.8c-5 10-10 10-17.6 5-10-5-40.1-22.4-40.1-22.4S183.3 182 183.3 192c2.5 10-7.5 17.5-17.6 10-2.5-2.5-55.1-62.3-55.1-62.3S98.1 167 95.6 172s-5 9.9-12.5 7.5C73 177 25.4 167 25.4 167s17.6 59.7 20.1 67.3c2.4 6 5 12.5-5 17.4L23 259.3s102.6 89.9 105.2 92.4c5.1 5 10 7.5 5.1 22.5-5.1 15-10.1 35.1-10.1 35.1s95.2-20.1 105.3-22.6c8.7-.9 18.3 2.5 18.3 12.5S241 512 241 512h30s-5.8-102.7-5.8-112.8 9.5-13.4 18.4-12.5c10 2.5 105.2 22.6 105.2 22.6s-5-20.1-10-35.1 0-17.5 5-22.5z",
        ),
    },
];
