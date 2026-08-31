"use client";
import { FLAG_EMBLEMS } from "@/lib/flagEmblems";
import { LAYOUTS, buildFlagStyle, bandsForLayout, bandRegions, sanitizeFilename, sanitizeSvg, EMBLEM_SIZE_MIN, EMBLEM_SIZE_MAX, EMBLEM_COLOR_DEFAULT, type LayoutKey, type Placed } from "@/lib/flag";
import { useEmblems } from "@/lib/useEmblems";
import { FlagPreview } from "@/components/FlagPreview";

import React, { useState, useRef, useMemo } from "react";

import ArrowDownTrayIcon from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import HeartIcon from "@heroicons/react/24/outline/HeartIcon";
import Squares2X2Icon from "@heroicons/react/24/outline/Squares2X2Icon";
import ArrowPathIcon from "@heroicons/react/24/outline/ArrowPathIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";

const PRESET_COLORS = ["#D21034", "#CE1126", "#B22234", "#FF0000", "#F77F00", "#FFB700", "#FFD700", "#FCD116", "#009739", "#007A3D", "#00843D", "#008751", "#0055A4", "#003399", "#002868", "#00247D", "#39A9DB", "#75AADB", "#000000", "#FFFFFF"];

const CANVAS_MAX_PX = 1400; // cap html2canvas raster so huge emblems never blow up memory

type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type EmblemEntry = { name: string; slug: string; Icon?: SvgIcon; svg?: string };
type Panel = "idle" | "shape" | "stickers" | "save";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const EMBLEM_REGISTRY: EmblemEntry[] = [...FLAG_EMBLEMS.map((e) => ({ name: e.name, slug: e.slug, svg: e.svg })), { name: "Star Outline", slug: "star", Icon: StarIcon }, { name: "Moon", slug: "moon", Icon: MoonIcon }, { name: "Heart", slug: "heart", Icon: HeartIcon }];

const EMBLEM_SUGGESTIONS = Array.from(new Set([...EMBLEM_REGISTRY.map((item) => item.slug), "academic-cap", "cloud", "flag", "gift", "hand-raised", "home", "language", "map-pin", "musical-note", "paper-airplane", "puzzle-piece", "scale", "user-group", "wrench"])).sort();

// Big, kid-friendly color dots. Reused by the stripe picker and the sticker picker.
function ColorGrid({ value, onPick }: { value: string; onPick: (c: string) => void }) {
    return (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5">
            {PRESET_COLORS.map((color) => {
                const on = value?.toUpperCase() === color.toUpperCase();
                return (
                    <button
                        key={color}
                        onClick={() => onPick(color)}
                        aria-label={`Use color ${color}`}
                        className={cn("aspect-square w-full rounded-full transition-transform active:scale-90", on ? "scale-110 ring-[3px] ring-white ring-offset-2 ring-offset-[#1c1c1e]" : "ring-1 ring-white/15")}
                        style={{ backgroundColor: color, boxShadow: color === "#FFFFFF" ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : undefined }}
                    />
                );
            })}
            <label className="relative aspect-square w-full rounded-full ring-1 ring-white/25 cursor-pointer overflow-hidden" title="More colors" style={{ background: "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}>
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"} onChange={(e) => onPick(e.target.value)} aria-label="Pick a custom color" className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
        </div>
    );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
}

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
    const [exporting, setExporting] = useState(false);
    const [rounded, setRounded] = useState(false);
    const [activeBand, setActiveBand] = useState<number | null>(null);
    const [panel, setPanel] = useState<Panel>("idle");

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
    const regions = bandRegions(layout);
    const bandColors = [c1, c2, c3];
    const bandSetters = [setC1, setC2, setC3];

    const selected = em.placed.find((pl) => pl.id === em.selectedId) ?? null;

    // What the control panel is focused on right now (one thing at a time).
    const view: "stripe" | "shape" | "stickers" | "save" | "sticker" | "idle" = activeBand !== null ? "stripe" : panel === "shape" ? "shape" : panel === "stickers" ? "stickers" : panel === "save" ? "save" : selected ? "sticker" : "idle";

    const pickBand = (i: number) => {
        em.setSelectedId(null);
        setPanel("idle");
        setActiveBand(i);
    };
    const openPanel = (next: Panel) => {
        setActiveBand(null);
        em.setSelectedId(null);
        setPanel(next);
    };
    const chooseLayout = (key: LayoutKey) => {
        setLayout(key);
        setActiveBand(null);
        setPanel("idle");
    };
    const swipeLayout = (dir: 1 | -1) => {
        const i = LAYOUTS.findIndex((l) => l.key === layout);
        const next = LAYOUTS[(i + dir + LAYOUTS.length) % LAYOUTS.length].key;
        setLayout(next);
        setActiveBand(null);
        em.setSelectedId(null);
    };

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
            next.push({ id: em.nextId(), kind: "emblem", ref: EMBLEM_REGISTRY[Math.floor(Math.random() * EMBLEM_REGISTRY.length)].name, x: 35 + Math.random() * 30, y: 35 + Math.random() * 30, color: pick(), size: 80 + Math.floor(Math.random() * 80), rot: 0 });
        }
        em.resetTo(next);
        setActiveBand(null);
        em.setSelectedId(null);
        setPanel("idle");
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

    const ToolButton = ({ id, label, icon, onClick }: { id: string; label: string; icon: React.ReactNode; onClick: () => void }) => {
        const active = (id === "shape" && view === "shape") || (id === "stickers" && (view === "stickers" || view === "sticker")) || (id === "save" && view === "save");
        return (
            <button onClick={onClick} aria-label={label} className={cn("flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border transition active:scale-95", active ? "bg-white text-black border-white" : "border-white/10 text-zinc-300 hover:text-white hover:border-white/25")}>
                <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
                <span className="text-[11px] font-bold tracking-wide">{label}</span>
            </button>
        );
    };

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden bg-[#121212] text-white p-3 md:p-5 font-sans">
            <style>{`
                * { scrollbar-color: #36363f #0b0b0d; }
                *::-webkit-scrollbar { width: 10px; height: 10px; }
                *::-webkit-scrollbar-track { background: #0b0b0d; }
                *::-webkit-scrollbar-thumb { background: #36363f; border-radius: 9999px; border: 2px solid #0b0b0d; }
                *::-webkit-scrollbar-thumb:hover { background: #4a4a55; }
                @keyframes cmBandPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .cm-band-hl { animation: cmBandPulse 1.1s ease-in-out infinite; }
            `}</style>
            <h1 className="sr-only">Country Maker - design your own country flag</h1>
            <main className="lg:h-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)] gap-4 md:gap-5">
                <section aria-label="Flag preview" className="relative h-[52vh] min-h-[300px] lg:h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                    <FlagPreview
                        flagRef={flagRef}
                        exportRef={exportRef}
                        exporting={exporting}
                        rounded={rounded}
                        baseStyle={baseStyle}
                        overlays={overlays}
                        regions={regions}
                        activeBand={activeBand}
                        onPickBand={pickBand}
                        placed={em.placed}
                        selectedId={em.selectedId}
                        onSelectEmblem={() => {
                            setActiveBand(null);
                            if (panel !== "stickers") setPanel("idle");
                        }}
                        startDrag={em.startDrag}
                        moveDrag={em.moveDrag}
                        endDrag={em.endDrag}
                        removePlaced={em.removePlaced}
                        renderEmblem={(ref, style, key) => renderEmblem(ref, style, key)}
                        onSwipeLayout={swipeLayout}
                    />
                </section>

                <section className="lg:h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6">
                        {view === "idle" && (
                            <div className="h-full flex flex-col justify-center gap-4 py-8">
                                <div className="text-center">
                                    <div className="text-xl sm:text-2xl font-bold text-white mb-1">Make your flag</div>
                                    <div className="text-sm text-zinc-400">Tap the flag to change it</div>
                                </div>
                                <div className="space-y-2.5 max-w-sm mx-auto w-full">
                                    <div className="flex items-center gap-3 bg-black/25 rounded-2xl p-3.5">
                                        <span className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">🎨</span>
                                        <span className="text-sm text-zinc-200">Tap a stripe, then pick its color</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/25 rounded-2xl p-3.5">
                                        <span className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">⭐</span>
                                        <span className="text-sm text-zinc-200">Tap a sticker to color, size, or spin it</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/25 rounded-2xl p-3.5">
                                        <span className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">✋</span>
                                        <span className="text-sm text-zinc-200">Drag a sticker anywhere on the flag</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === "stripe" && activeBand !== null && (
                            <div>
                                <PanelHeader title={`Stripe ${activeBand + 1} color`} onClose={() => setActiveBand(null)} />
                                <ColorGrid value={bandColors[activeBand]} onPick={(color) => bandSetters[activeBand]?.(color)} />
                                <p className="text-xs text-zinc-500 mt-4">Tap another stripe on the flag to color it too.</p>
                            </div>
                        )}

                        {view === "sticker" && selected && (
                            <div>
                                <PanelHeader title="Your sticker" onClose={() => em.setSelectedId(null)} />
                                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Color</div>
                                <ColorGrid value={selected.color ?? EMBLEM_COLOR_DEFAULT} onPick={(color) => em.updateEmblem(selected.id, { color })} />

                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Size</span>
                                        <span className="text-xs font-mono text-zinc-400 tabular-nums">{selected.size ?? 100}px</span>
                                    </div>
                                    <input type="range" min={EMBLEM_SIZE_MIN} max={EMBLEM_SIZE_MAX} step={2} value={selected.size ?? 100} onChange={(e) => em.updateEmblem(selected.id, { size: Number(e.target.value) })} aria-label="Sticker size" className="w-full h-3 accent-white cursor-pointer" />
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Spin</span>
                                        <span className="text-xs font-mono text-zinc-400 tabular-nums">{selected.rot ?? 0}°</span>
                                    </div>
                                    <input type="range" min={-180} max={180} step={5} value={selected.rot ?? 0} onChange={(e) => em.updateEmblem(selected.id, { rot: Number(e.target.value) })} aria-label="Sticker rotation" className="w-full h-3 accent-white cursor-pointer" />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => em.updateEmblem(selected.id, { rot: 0 })} className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 hover:text-white px-3 py-1 rounded-full border border-white/10 transition">
                                            Straighten
                                        </button>
                                        <button onClick={() => em.updateEmblem(selected.id, { rot: (((selected.rot ?? 0) + 45 + 180) % 360) - 180 })} className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 hover:text-white px-3 py-1 rounded-full border border-white/10 transition">
                                            +45°
                                        </button>
                                    </div>
                                </div>

                                <button onClick={() => em.removePlaced(selected.id)} className="mt-7 w-full py-3 rounded-2xl bg-red-500/15 text-red-300 hover:bg-red-500/25 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition">
                                    <TrashIcon className="w-4 h-4" />
                                    Remove sticker
                                </button>
                                <p className="text-xs text-zinc-500 mt-4 text-center">Drag it on the flag to move it. Add more from Stickers.</p>
                            </div>
                        )}

                        {view === "shape" && (
                            <div>
                                <PanelHeader title="Pick a shape" onClose={() => setPanel("idle")} />
                                <p className="text-xs text-zinc-500 mb-3">Swipe and tap the one you like.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {LAYOUTS.map((l) => {
                                        const mini = buildFlagStyle(l.key, c1, c2, c3);
                                        const active = layout === l.key;
                                        return (
                                            <button key={l.key} onClick={() => chooseLayout(l.key)} aria-pressed={active} title={l.name} className={cn("p-1.5 rounded-xl border transition flex flex-col items-center gap-1.5 active:scale-95", active ? "bg-white border-white" : "border-zinc-700 hover:border-zinc-500")}>
                                                <div className="relative w-full rounded-md overflow-hidden ring-1 ring-black/10" style={{ aspectRatio: "3 / 2", ...mini.baseStyle }}>
                                                    {mini.overlays.map((ov, i) => (
                                                        <div key={i} style={{ position: "absolute", inset: 0, background: ov.color, clipPath: ov.clip }} />
                                                    ))}
                                                </div>
                                                <span className={cn("text-[10px] leading-tight text-center", active ? "text-black font-bold" : "text-zinc-400")}>{l.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {view === "stickers" && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base sm:text-lg font-bold text-white">Add a sticker</h2>
                                    <div className="flex items-center gap-2">
                                        <button onClick={em.clearAll} aria-label="Remove all emblems" className="h-9 px-3 rounded-full border border-white/10 text-zinc-400 hover:text-white text-[11px] font-bold uppercase transition">
                                            Clear
                                        </button>
                                        <button onClick={() => setPanel("idle")} aria-label="Done" className="h-9 px-3 rounded-full bg-white text-black text-[11px] font-bold uppercase transition">
                                            Done
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mb-3">{em.placed.length} on the flag. Tap one to add - then tap it on the flag to color, size, or spin it.</p>

                                <div className="max-h-[34dvh] lg:max-h-[38vh] overflow-y-auto p-2.5 bg-black/20 rounded-2xl border border-white/5 mb-3">
                                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                                        {filteredEmblems.map((item) => {
                                            const onFlag = em.placed.some((pl) => pl.ref === item.name);
                                            return (
                                                <button key={item.name} onClick={() => em.addEmblem(item.name)} aria-label={`Add ${item.name} emblem to flag`} title={`Add ${item.name}`} className={cn("aspect-square rounded-xl transition flex justify-center items-center active:scale-90", onFlag ? "bg-white/15 text-white ring-1 ring-white/40" : "bg-white/[0.03] text-zinc-300 hover:text-white")}>
                                                    {renderEmblem(item, { width: 22, height: 22, color: "currentColor" })}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <input value={searchTerm} placeholder="Search stickers" aria-label="Search emblems" onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-base focus:border-zinc-500 outline-none mb-3" />

                                <div className="mb-3">
                                    <label htmlFor="text-emblem" className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2 block">
                                        Add letters (中, 王, USA, ★)
                                    </label>
                                    <input id="text-emblem" value={em.textEmblem} maxLength={12} placeholder="Type letters or characters" onChange={(e) => em.updateText(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-base focus:border-zinc-500 outline-none" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="load-emblem" className="text-[11px] uppercase tracking-widest text-zinc-400 block">
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
                                                className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-base focus:border-zinc-500 outline-none"
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
                                                                    <div className="text-sm font-semibold truncate">{slug}</div>
                                                                    <div className="text-xs text-zinc-400 truncate">{item ? item.name : "Heroicon"}</div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => loadEmblemByName()} className="px-5 bg-white text-black text-xs font-bold uppercase rounded-xl hover:bg-zinc-200 transition">
                                            {customEmblemLoading ? "..." : "Add"}
                                        </button>
                                    </div>
                                    {customEmblemError && <div className="text-[11px] text-red-400 uppercase tracking-wide">{customEmblemError}</div>}
                                </div>
                            </div>
                        )}

                        {view === "save" && (
                            <div>
                                <PanelHeader title="Save your flag" onClose={() => setPanel("idle")} />
                                <label htmlFor="country-name" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                    Flag name
                                </label>
                                <input id="country-name" value={countryName} placeholder="Republic of ..." onChange={(e) => setCountryName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-base focus:border-zinc-500 outline-none mb-5" />

                                <div className="flex items-center justify-between bg-black/25 rounded-2xl p-3.5 mb-6">
                                    <span className="text-sm text-zinc-200">Rounded corners</span>
                                    <button onClick={() => setRounded((v) => !v)} aria-pressed={rounded} className={cn("px-4 py-1.5 text-[11px] font-bold uppercase rounded-full border transition", rounded ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400")}>
                                        {rounded ? "On" : "Off"}
                                    </button>
                                </div>

                                <button onClick={handleDownload} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.97] shadow-xl flex items-center justify-center gap-2">
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Download Flag
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 border-t border-white/5 p-2.5 grid grid-cols-4 gap-2">
                        <ToolButton id="shape" label="Shape" icon={<Squares2X2Icon className="w-6 h-6" />} onClick={() => openPanel("shape")} />
                        <ToolButton id="stickers" label="Stickers" icon={<SparklesIcon className="w-6 h-6" />} onClick={() => openPanel("stickers")} />
                        <ToolButton id="random" label="Surprise" icon={<ArrowPathIcon className="w-6 h-6" />} onClick={randomize} />
                        <ToolButton id="save" label="Save" icon={<ArrowDownTrayIcon className="w-6 h-6" />} onClick={() => openPanel("save")} />
                    </div>
                </section>
            </main>

            <footer className="py-5 text-center text-[11px] text-zinc-500">
                Original idea by{" "}
                <a href="https://github.com/nordenheng" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-300 hover:text-white underline underline-offset-2">
                    Norden Heng
                </a>
            </footer>
        </div>
    );
}
