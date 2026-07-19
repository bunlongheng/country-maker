"use client";
import { FLAG_EMBLEMS } from "@/lib/flagEmblems";
import { LAYOUTS, buildFlagStyle, bandsForLayout, sanitizeFilename, sanitizeSvg, type LayoutKey, type Placed } from "@/lib/flag";
import { useEmblems } from "@/lib/useEmblems";
import { FlagPreview } from "@/components/FlagPreview";

import React, { useState, useRef, useMemo } from "react";

import ArrowDownTrayIcon from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import SunIcon from "@heroicons/react/24/outline/SunIcon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import BoltIcon from "@heroicons/react/24/outline/BoltIcon";
import FireIcon from "@heroicons/react/24/outline/FireIcon";
import ShieldCheckIcon from "@heroicons/react/24/outline/ShieldCheckIcon";
import GlobeAltIcon from "@heroicons/react/24/outline/GlobeAltIcon";
import HeartIcon from "@heroicons/react/24/outline/HeartIcon";
import KeyIcon from "@heroicons/react/24/outline/KeyIcon";
import RocketLaunchIcon from "@heroicons/react/24/outline/RocketLaunchIcon";
import TrophyIcon from "@heroicons/react/24/outline/TrophyIcon";
import CpuChipIcon from "@heroicons/react/24/outline/CpuChipIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import LightBulbIcon from "@heroicons/react/24/outline/LightBulbIcon";
import BuildingLibraryIcon from "@heroicons/react/24/outline/BuildingLibraryIcon";

const PRESET_COLORS = ["#D21034", "#CE1126", "#B22234", "#FF0000", "#F77F00", "#FFB700", "#FFD700", "#FCD116", "#009739", "#007A3D", "#00843D", "#008751", "#0055A4", "#003399", "#002868", "#00247D", "#39A9DB", "#75AADB", "#000000", "#FFFFFF"];

const EMBLEM_SIZE_MIN = 40;
const EMBLEM_SIZE_MAX = 240;
const EMBLEM_SIZE_DEFAULT = 100;
const CANVAS_MAX_PX = 1400; // cap html2canvas raster so huge emblems never blow up memory

type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type EmblemEntry = { name: string; slug: string; Icon?: SvgIcon; svg?: string };

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const EMBLEM_REGISTRY: EmblemEntry[] = [
    ...FLAG_EMBLEMS.map((e) => ({ name: e.name, slug: e.slug, svg: e.svg })),
    { name: "Sunburst", slug: "sun", Icon: SunIcon },
    { name: "Moon", slug: "moon", Icon: MoonIcon },
    { name: "Bolt", slug: "bolt", Icon: BoltIcon },
    { name: "Flame", slug: "fire", Icon: FireIcon },
    { name: "Guard", slug: "shield-check", Icon: ShieldCheckIcon },
    { name: "Globe", slug: "globe-alt", Icon: GlobeAltIcon },
    { name: "Heart", slug: "heart", Icon: HeartIcon },
    { name: "Key", slug: "key", Icon: KeyIcon },
    { name: "Spark", slug: "sparkles", Icon: SparklesIcon },
    { name: "Rocket", slug: "rocket-launch", Icon: RocketLaunchIcon },
    { name: "Trophy", slug: "trophy", Icon: TrophyIcon },
    { name: "Chip", slug: "cpu-chip", Icon: CpuChipIcon },
    { name: "Eye", slug: "eye", Icon: EyeIcon },
    { name: "Idea", slug: "light-bulb", Icon: LightBulbIcon },
    { name: "Star8", slug: "star", Icon: StarIcon },
    { name: "Temple2", slug: "building-library", Icon: BuildingLibraryIcon },
];

const EMBLEM_SUGGESTIONS = Array.from(new Set([...EMBLEM_REGISTRY.map((item) => item.slug), "academic-cap", "cloud", "flag", "gift", "hand-raised", "home", "language", "map-pin", "musical-note", "paper-airplane", "puzzle-piece", "scale", "user-group", "wrench"])).sort();

export default function CountryMaker() {
    const flagRef = useRef<HTMLDivElement | null>(null);
    const exportRef = useRef<HTMLDivElement | null>(null);
    const em = useEmblems(flagRef);

    const [countryName, setCountryName] = useState("Republic of Norden");
    const [layout, setLayout] = useState<LayoutKey>("nordic");
    const [c1, setC1] = useState("#FFFFFF");
    const [c2, setC2] = useState("#4F93CE");
    const [c3, setC3] = useState("#D21034");

    const [searchTerm, setSearchTerm] = useState("");
    const [emblemName, setEmblemName] = useState("");
    const [customEmblemError, setCustomEmblemError] = useState("");
    const [customEmblemLoading, setCustomEmblemLoading] = useState(false);
    const [emblemColor, setEmblemColor] = useState("#F5A623");
    const [emblemSize, setEmblemSize] = useState(EMBLEM_SIZE_DEFAULT);
    const [exporting, setExporting] = useState(false);
    const [rounded, setRounded] = useState(true);

    const emblemEntryBySlug = useMemo(() => new Map(EMBLEM_REGISTRY.map((item) => [item.slug, item])), []);
    const emblemEntryByName = useMemo(() => new Map(EMBLEM_REGISTRY.map((item) => [item.name, item])), []);

    const filteredEmblems = useMemo(
        () =>
            EMBLEM_REGISTRY.filter((item) => {
                const query = searchTerm.toLowerCase();
                return item.name.toLowerCase().includes(query) || item.slug.includes(query);
            }),
        [searchTerm],
    );

    const activeBands = bandsForLayout(layout);
    const { baseStyle, overlays } = useMemo(() => buildFlagStyle(layout, c1, c2, c3), [layout, c1, c2, c3]);

    const normalizeEmblemName = (raw: string) =>
        raw
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    const normalizedEmblemQuery = normalizeEmblemName(emblemName);
    const emblemMatches = useMemo(() => {
        if (!normalizedEmblemQuery) return [];
        return EMBLEM_SUGGESTIONS.filter((slug) => slug.includes(normalizedEmblemQuery)).slice(0, 8);
    }, [normalizedEmblemQuery]);

    const highlightQuery = (value: string, query: string) => {
        if (!query) return value;
        const idx = value.indexOf(query);
        if (idx === -1) return value;
        return (
            <>
                <span className="text-zinc-400">{value.slice(0, idx)}</span>
                <span className="text-white">{value.slice(idx, idx + query.length)}</span>
                <span className="text-zinc-400">{value.slice(idx + query.length)}</span>
            </>
        );
    };

    const svgForRef = (ref: string): string | undefined => (ref.startsWith("custom:") ? em.customSvgs[ref.slice(7)] : emblemEntryByName.get(ref)?.svg);
    const iconForRef = (ref: string): SvgIcon | undefined => (ref.startsWith("custom:") ? undefined : emblemEntryByName.get(ref)?.Icon);

    // Single renderer for either a registry entry or a string ref (name / custom:slug).
    const renderEmblem = (source: EmblemEntry | string, style: React.CSSProperties, key?: React.Key) => {
        const svg = typeof source === "string" ? svgForRef(source) : source.svg;
        if (svg) return <div key={key} className="[&>svg]:w-full [&>svg]:h-full" style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
        const Icon = typeof source === "string" ? iconForRef(source) : source.Icon;
        return Icon ? <Icon key={key} style={style} /> : null;
    };

    const loadEmblemByName = async (explicitSlug?: string) => {
        const slug = explicitSlug || normalizeEmblemName(emblemName);
        if (!slug) {
            setCustomEmblemError("Enter emblem name, e.g. star");
            return;
        }
        const matched = EMBLEM_REGISTRY.find((item) => item.slug === slug && item.Icon);
        if (matched) {
            setEmblemName(slug);
            em.addEmblem(matched.name);
            setCustomEmblemError("");
            return;
        }
        setCustomEmblemLoading(true);
        setCustomEmblemError("");
        try {
            const res = await fetch(`https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/outline/${slug}.svg`);
            if (!res.ok) throw new Error(`Emblem not found: ${slug}`);
            const rawSvg = await res.text();
            if (!rawSvg.includes("<svg")) throw new Error("Invalid SVG");
            const normalizedSvg = sanitizeSvg(rawSvg)
                .replace(/width="[^"]*"/g, "")
                .replace(/height="[^"]*"/g, "")
                .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
                .replace(/fill="[^"]*"/g, 'fill="none"');
            if (!normalizedSvg) throw new Error("Unsafe or invalid SVG");
            em.addCustomSvg(slug, normalizedSvg);
            em.addEmblem(`custom:${slug}`);
        } catch (err: any) {
            setCustomEmblemError(err?.message || "Failed to load emblem");
        } finally {
            setCustomEmblemLoading(false);
        }
    };

    const randomize = () => {
        const pick = () => PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        const keys = LAYOUTS.map((l) => l.key);
        setLayout(keys[Math.floor(Math.random() * keys.length)]);
        setC1(pick());
        setC2(pick());
        setC3(pick());
        const count = 1 + Math.floor(Math.random() * 2);
        const next: Placed[] = [];
        for (let i = 0; i < count; i++) {
            next.push({ id: em.nextId(), kind: "emblem", ref: EMBLEM_REGISTRY[Math.floor(Math.random() * EMBLEM_REGISTRY.length)].name, x: 35 + Math.random() * 30, y: 35 + Math.random() * 30 });
        }
        em.resetTo(next);
    };

    const handleDownload = async () => {
        if (!exportRef.current) return;
        setExporting(true);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
        try {
            const { default: html2canvas } = await import("html2canvas");
            const el = exportRef.current;
            const scale = Math.min(3, CANVAS_MAX_PX / Math.max(el.offsetWidth, el.offsetHeight, 1));
            const canvas = await html2canvas(el, { backgroundColor: null, scale: Math.max(1, scale), useCORS: true });
            const link = document.createElement("a");
            link.download = `${sanitizeFilename(countryName)}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-[#121212] text-white p-3 md:p-6 font-sans">
            <style>{`
                * { scrollbar-color: #36363f #0b0b0d; }
                *::-webkit-scrollbar { width: 10px; height: 10px; }
                *::-webkit-scrollbar-track { background: #0b0b0d; }
                *::-webkit-scrollbar-thumb { background: #36363f; border-radius: 9999px; border: 2px solid #0b0b0d; }
                *::-webkit-scrollbar-thumb:hover { background: #4a4a55; }
            `}</style>
            <h1 className="sr-only">Country Maker - design your own country flag</h1>
            <main className="h-full max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 md:gap-6">
                <section aria-label="Flag preview" className="h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 shadow-2xl overflow-auto">
                    <FlagPreview
                        flagRef={flagRef}
                        exportRef={exportRef}
                        exporting={exporting}
                        rounded={rounded}
                        baseStyle={baseStyle}
                        overlays={overlays}
                        placed={em.placed}
                        selectedId={em.selectedId}
                        emblemColor={emblemColor}
                        emblemSize={emblemSize}
                        countryName={countryName}
                        setCountryName={setCountryName}
                        onDeselect={() => em.setSelectedId(null)}
                        startDrag={em.startDrag}
                        moveDrag={em.moveDrag}
                        endDrag={em.endDrag}
                        removePlaced={em.removePlaced}
                        renderEmblem={(ref, style, key) => renderEmblem(ref, style, key)}
                    />
                </section>

                <section className="h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6" role="group" aria-label="Flag controls">
                        <div>
                            <label htmlFor="country-name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">
                                Country Name (or tap the name under the flag)
                            </label>
                            <input id="country-name" value={countryName} placeholder="Republic of ..." onChange={(e) => setCountryName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Flag Layout - {LAYOUTS.length} types</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LAYOUTS.map((l) => (
                                    <button key={l.key} onClick={() => setLayout(l.key)} aria-pressed={layout === l.key} className={cn("px-3 py-2 text-xs rounded-xl border transition text-left", layout === l.key ? "bg-white text-black border-white font-bold" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Preset Colors</div>
                                <button onClick={randomize} aria-label="Randomize flag" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 transition">
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    Random
                                </button>
                            </div>
                            <div className="grid grid-cols-10 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setC1(color)}
                                        aria-label={`Set band 1 color to ${color}`}
                                        className={cn("aspect-square rounded-full transition-all active:scale-90 border-2", c1 === color ? "border-white scale-110 shadow-lg" : "border-transparent")}
                                        style={{ backgroundColor: color, boxShadow: color === "#FFFFFF" ? "inset 0 0 0 1px rgba(255,255,255,0.2)" : undefined }}
                                        title={`Set band 1 to ${color}`}
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2">Presets set band 1. Fine-tune each band below.</p>
                        </div>

                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Band Colors</div>
                            <div className="space-y-2.5">
                                {[
                                    { val: c1, set: setC1, label: "Band 1" },
                                    { val: c2, set: setC2, label: "Band 2" },
                                    { val: c3, set: setC3, label: "Band 3" },
                                ]
                                    .slice(0, activeBands)
                                    .map((band) => (
                                        <div key={band.label} className="flex items-center gap-3">
                                            <label className="relative w-10 h-10 rounded-full border-2 border-white/20 cursor-pointer transition hover:scale-105 shrink-0" style={{ backgroundColor: band.val }} title={`${band.label} color`}>
                                                <input type="color" value={band.val} onChange={(e) => band.set(e.target.value)} aria-label={`${band.label} color`} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </label>
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-400 w-14 shrink-0">{band.label}</span>
                                            <input type="text" value={band.val} onChange={(e) => band.set(e.target.value)} aria-label={`${band.label} hex value`} className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono focus:border-zinc-500 outline-none transition" />
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Emblems - tap to add, drag on flag</div>
                                <button onClick={em.clearAll} aria-label="Remove all emblems" className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition flex items-center gap-1", em.placed.length === 0 ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
                                    <XMarkIcon className="w-3 h-3" />
                                    None
                                </button>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3">{em.placed.length} on flag - drag each one where you want it.</p>

                            <div className="flex items-center gap-3 mb-3">
                                <label className="relative w-10 h-10 rounded-full border-2 border-white/20 cursor-pointer transition hover:scale-105" style={{ backgroundColor: emblemColor }} title="Emblem color">
                                    <input type="color" value={emblemColor} onChange={(e) => setEmblemColor(e.target.value)} aria-label="Emblem color" className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400">Emblem color</span>
                            </div>

                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="emblem-size" className="text-[10px] uppercase tracking-widest text-zinc-400">
                                        Emblem size
                                    </label>
                                    <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{emblemSize}px</span>
                                </div>
                                <input id="emblem-size" type="range" min={EMBLEM_SIZE_MIN} max={EMBLEM_SIZE_MAX} step={2} value={emblemSize} onChange={(e) => setEmblemSize(Number(e.target.value))} aria-label="Emblem size" className="w-full accent-white cursor-pointer" />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="text-emblem" className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2 block">
                                    Text / letters (中, 王, USA, ★)
                                </label>
                                <input id="text-emblem" value={em.textEmblem} maxLength={12} placeholder="type letters or characters" onChange={(e) => em.updateText(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none" />
                            </div>

                            <input value={searchTerm} placeholder="search emblems" aria-label="Search emblems" onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none mb-3" />
                            <div className="mb-3 space-y-2">
                                <label htmlFor="load-emblem" className="text-[10px] uppercase tracking-widest text-zinc-400 block">
                                    Load by Heroicons name
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            id="load-emblem"
                                            value={emblemName}
                                            placeholder="star"
                                            onChange={(e) => setEmblemName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") loadEmblemByName();
                                            }}
                                            className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none"
                                        />
                                        {emblemMatches.length > 0 && (
                                            <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#121216] shadow-2xl">
                                                {emblemMatches.map((slug) => {
                                                    const item = emblemEntryBySlug.get(slug);
                                                    const MatchIcon = item?.Icon;
                                                    return (
                                                        <button key={slug} onClick={() => loadEmblemByName(slug)} className="w-full px-3 py-2 text-left hover:bg-white/5 transition flex items-center gap-3">
                                                            <div className="w-5 h-5 shrink-0 flex items-center justify-center text-zinc-300">{MatchIcon ? <MatchIcon className="w-5 h-5" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />}</div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold truncate">{highlightQuery(slug, normalizedEmblemQuery)}</div>
                                                                <div className="text-xs text-zinc-400 truncate">{item ? item.name : "Heroicon"}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => loadEmblemByName()} className="px-4 bg-white text-black text-xs font-bold uppercase rounded-xl hover:bg-zinc-200 transition">
                                        {customEmblemLoading ? "..." : "Add"}
                                    </button>
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                    Need names?{" "}
                                    <a href="https://heroicons.com/" target="_blank" rel="noreferrer" className="text-zinc-300 underline underline-offset-2 hover:text-white">
                                        heroicons.com
                                    </a>
                                </div>
                                {customEmblemError && <div className="text-[10px] text-red-400 uppercase tracking-wide">{customEmblemError}</div>}
                            </div>
                            <div className="max-h-[30dvh] overflow-y-auto p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="grid grid-cols-6 sm:grid-cols-7 xl:grid-cols-6 gap-2">
                                    {filteredEmblems.map((item) => {
                                        const onFlag = em.placed.some((pl) => pl.ref === item.name);
                                        return (
                                            <button key={item.name} onClick={() => em.addEmblem(item.name)} aria-label={`Add ${item.name} emblem to flag`} title={`Add ${item.name}`} className={cn("p-2 rounded-lg transition flex justify-center items-center h-9", onFlag ? "bg-white/15 text-white ring-1 ring-white/40" : "text-zinc-400 hover:text-zinc-300")}>
                                                {renderEmblem(item, { width: 20, height: 20, color: "currentColor" })}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-1">
                            <button onClick={() => setRounded((v) => !v)} aria-pressed={rounded} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border transition", rounded ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400")}>
                                {rounded ? "Rounded" : "Square"}
                            </button>
                        </div>
                    </div>

                    <div className="p-5 md:p-6 border-t border-white/5">
                        <button onClick={handleDownload} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.97] shadow-xl flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download Flag
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
