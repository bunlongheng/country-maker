"use client";
import { FLAG_EMBLEMS } from "@/lib/flagEmblems";
import { LAYOUTS, buildFlagStyle, bandsForLayout, bandRegions, sanitizeFilename, sanitizeSvg, EMBLEM_COLOR_DEFAULT, type LayoutKey, type Placed } from "@/lib/flag";
import { useEmblems } from "@/lib/useEmblems";
import { FlagPreview } from "@/components/FlagPreview";

import React, { useState, useRef, useMemo, useEffect } from "react";

import ArrowDownTrayIcon from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import StarIcon from "@heroicons/react/24/outline/StarIcon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import HeartIcon from "@heroicons/react/24/outline/HeartIcon";
import Squares2X2Icon from "@heroicons/react/24/outline/Squares2X2Icon";
import ArrowPathIcon from "@heroicons/react/24/outline/ArrowPathIcon";
import ArrowUturnLeftIcon from "@heroicons/react/24/outline/ArrowUturnLeftIcon";
import ArrowUturnRightIcon from "@heroicons/react/24/outline/ArrowUturnRightIcon";

// 17 distinct colors (+ the rainbow custom = 18 = exactly 3 rows of 6). No near-duplicates.
const PRESET_COLORS = ["#E4002B", "#FF4D6D", "#FF7A00", "#FFC400", "#FFE100", "#A3D900", "#00A650", "#009B8E", "#00B5E2", "#0072CE", "#00247D", "#6A2FBF", "#B02FB0", "#8B5E34", "#000000", "#808080", "#FFFFFF"];

const CANVAS_MAX_PX = 1400; // cap html2canvas raster so huge emblems never blow up memory

type SvgIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type EmblemEntry = { name: string; slug: string; Icon?: SvgIcon; svg?: string };
type Panel = "idle" | "shape" | "stickers" | "save";
type Snapshot = { layout: LayoutKey; c1: string; c2: string; c3: string; rounded: boolean; countryName: string; placed: Placed[]; customSvgs: Record<string, string> };

// Bump this every deploy so Norden can tell if his tab is on the latest version.
const APP_VERSION = "v7";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

// Is a hex color light enough that a dark checkmark/ring reads better than a white one?
const isLightColor = (hex: string) => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || "");
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 155;
};

const EMBLEM_REGISTRY: EmblemEntry[] = [...FLAG_EMBLEMS.map((e) => ({ name: e.name, slug: e.slug, svg: e.svg })), { name: "Star Outline", slug: "star", Icon: StarIcon }, { name: "Moon", slug: "moon", Icon: MoonIcon }, { name: "Heart", slug: "heart", Icon: HeartIcon }];

const EMBLEM_SUGGESTIONS = Array.from(new Set([...EMBLEM_REGISTRY.map((item) => item.slug), "academic-cap", "cloud", "flag", "gift", "hand-raised", "home", "language", "map-pin", "musical-note", "paper-airplane", "puzzle-piece", "scale", "user-group", "wrench"])).sort();

// Big, kid-friendly color dots. Reused by the stripe picker and the sticker picker.
function ColorGrid({ value, onPick }: { value: string; onPick: (c: string) => void }) {
    const isHex = /^#[0-9a-fA-F]{6}$/.test(value || "");
    const inPreset = PRESET_COLORS.some((c) => c.toUpperCase() === value?.toUpperCase());
    return (
        <div>
            {/* Current color isn't one of the swatches - surface it on top so you can see what's active. */}
            {isHex && !inPreset && (
                <div className="flex items-center gap-2.5 mb-3">
                    <span className="relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: value, boxShadow: `0 0 0 3px ${isLightColor(value) ? "#a1a1aa" : "#fff"}` }}>
                        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke={isLightColor(value) ? "#111" : "#fff"} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Current color</span>
                    <span className="text-xs font-mono text-zinc-500 tabular-nums">{value.toUpperCase()}</span>
                </div>
            )}
            <div className="grid grid-cols-6 gap-2.5">
                {PRESET_COLORS.map((color) => {
                    const on = value?.toUpperCase() === color.toUpperCase();
                    const light = isLightColor(color);
                    return (
                        <button
                            key={color}
                            onClick={() => onPick(color)}
                            aria-label={`Use color ${color}`}
                            aria-pressed={on}
                            className={cn("relative aspect-square w-full rounded-full flex items-center justify-center transition-transform active:scale-90", on ? cn("scale-110 ring-[3px] ring-offset-2 ring-offset-[#1c1c1e]", light ? "ring-zinc-500" : "ring-white") : "ring-1 ring-white/15")}
                            style={{ backgroundColor: color, boxShadow: color === "#FFFFFF" ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : undefined }}
                        >
                            {on && (
                                <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke={light ? "#111" : "#fff"} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    );
                })}
                <label className="relative aspect-square w-full rounded-full ring-1 ring-white/25 cursor-pointer overflow-hidden" title="More colors" style={{ background: "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}>
                    <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"} onChange={(e) => onPick(e.target.value)} aria-label="Pick a custom color" className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
            </div>
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
    const em = useEmblems();

    const [countryName, setCountryName] = useState("Republic of Norden");
    const [layout, setLayout] = useState<LayoutKey>("nordic");
    // Defaults are all palette colors so they show up checked in the picker.
    const [c1, setC1] = useState("#FFFFFF");
    const [c2, setC2] = useState("#0072CE");
    const [c3, setC3] = useState("#E4002B");

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

    // Large screens have room to spare, so idle defaults to the sticker picker instead of an empty panel.
    const [isLarge, setIsLarge] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const sync = () => setIsLarge(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    // Delete / Backspace removes the selected sticker (same as the red ×) - unless you're typing in a field.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Delete" && e.key !== "Backspace") return;
            const el = document.activeElement;
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
            if (em.selectedId) {
                e.preventDefault();
                em.removePlaced(em.selectedId);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [em.selectedId, em.removePlaced]);

    // ---- Undo / redo: debounced snapshots of the whole design (coalesces drags/slides into one step) ----
    const snapNow = (): Snapshot => ({ layout, c1, c2, c3, rounded, countryName, placed: em.placed, customSvgs: em.customSvgs });
    const past = useRef<Snapshot[]>([]);
    const future = useRef<Snapshot[]>([]);
    const lastSnap = useRef<Snapshot | null>(null);
    const applying = useRef(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    useEffect(() => {
        if (lastSnap.current === null) {
            lastSnap.current = snapNow();
            return;
        }
        if (applying.current) {
            applying.current = false;
            lastSnap.current = snapNow();
            return;
        }
        const t = setTimeout(() => {
            past.current.push(lastSnap.current!);
            if (past.current.length > 100) past.current.shift();
            future.current = [];
            lastSnap.current = snapNow();
            setCanUndo(true);
            setCanRedo(false);
        }, 350);
        return () => clearTimeout(t);
    }, [layout, c1, c2, c3, rounded, countryName, em.placed, em.customSvgs]);

    const applySnap = (s: Snapshot) => {
        applying.current = true;
        setLayout(s.layout);
        setC1(s.c1);
        setC2(s.c2);
        setC3(s.c3);
        setRounded(s.rounded);
        setCountryName(s.countryName);
        em.restore(s.placed, s.customSvgs);
        setActiveBand(null);
        setPanel("idle");
    };
    const undo = () => {
        if (!past.current.length) return;
        future.current.push(lastSnap.current!);
        applySnap(past.current.pop()!);
        setCanUndo(past.current.length > 0);
        setCanRedo(true);
    };
    const redo = () => {
        if (!future.current.length) return;
        past.current.push(lastSnap.current!);
        applySnap(future.current.pop()!);
        setCanUndo(true);
        setCanRedo(future.current.length > 0);
    };
    const undoRef = useRef(undo);
    undoRef.current = undo;
    const redoRef = useRef(redo);
    redoRef.current = redo;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) redoRef.current();
                else undoRef.current();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // What the control panel is focused on right now (one thing at a time).
    const view: "stripe" | "shape" | "stickers" | "save" | "sticker" | "idle" = activeBand !== null ? "stripe" : panel === "shape" ? "shape" : panel === "stickers" ? "stickers" : panel === "save" ? "save" : selected ? "sticker" : isLarge ? "stickers" : "idle";

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
        setActiveBand(null);
        em.setSelectedId(null); // clean flag - no selection outlines in the exported image
        setExporting(true);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
        try {
            const { default: html2canvas } = await import("html2canvas");
            const el = exportRef.current;
            const scale = Math.min(3, CANVAS_MAX_PX / Math.max(el.offsetWidth, el.offsetHeight, 1));
            const canvas = await html2canvas(el, { backgroundColor: null, scale: Math.max(1, scale), useCORS: true });
            const name = `${sanitizeFilename(countryName)}.png`;
            const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
            if (!blob) return;
            const file = new File([blob], name, { type: "image/png" });
            const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
            // iOS/touch: the share sheet lets you Save to Photos / camera roll or share anywhere. Desktop just downloads.
            if (nav.maxTouchPoints > 0 && nav.canShare?.({ files: [file] }) && typeof nav.share === "function") {
                try {
                    await nav.share({ files: [file], title: countryName || "My Flag" });
                    return;
                } catch {
                    // user cancelled or share failed - fall through to download
                }
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = name;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        <div className="h-[100dvh] overflow-hidden bg-[#121212] text-white p-3 md:p-5 font-sans flex flex-col">
            <style>{`
                * { scrollbar-color: #36363f #0b0b0d; }
                *::-webkit-scrollbar { width: 10px; height: 10px; }
                *::-webkit-scrollbar-track { background: #0b0b0d; }
                *::-webkit-scrollbar-thumb { background: #36363f; border-radius: 9999px; border: 2px solid #0b0b0d; }
                *::-webkit-scrollbar-thumb:hover { background: #4a4a55; }
            `}</style>
            <h1 className="sr-only">Country Maker - design your own country flag</h1>
            <main className="grid min-h-0 w-full flex-1 grid-cols-1 grid-rows-[minmax(0,42%)_minmax(0,1fr)] gap-3 mx-auto max-w-[1500px] md:gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)] lg:grid-rows-1">
                <section aria-label="Flag preview" className="relative min-h-0 bg-[#1c1c1e] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                    <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                        <button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo" className={cn("h-9 w-9 rounded-full flex items-center justify-center transition active:scale-90", canUndo ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/[0.04] text-zinc-600 cursor-default")}>
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                        </button>
                        <button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo" className={cn("h-9 w-9 rounded-full flex items-center justify-center transition active:scale-90", canRedo ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/[0.04] text-zinc-600 cursor-default")}>
                            <ArrowUturnRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 flex items-center justify-center">
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
                            onDeselect={() => {
                                setActiveBand(null);
                                em.setSelectedId(null);
                            }}
                            placed={em.placed}
                            selectedId={em.selectedId}
                            onSelectEmblem={() => {
                                // Tapping a sticker on the flag always brings up its color menu (closes the picker).
                                setActiveBand(null);
                                setPanel("idle");
                            }}
                            setSelected={em.setSelectedId}
                            updateEmblem={em.updateEmblem}
                            removePlaced={em.removePlaced}
                            renderEmblem={(ref, style, key) => renderEmblem(ref, style, key)}
                        />
                    </div>
                    {/* Landscape/desktop has spare room - show every flag shape here for one-tap switching. */}
                    <div className="hidden lg:block shrink-0 border-t border-white/5 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Flag shape</div>
                        <div className="grid grid-cols-7 gap-1.5 max-h-[32vh] overflow-y-auto pr-1">
                            {LAYOUTS.map((l) => {
                                const mini = buildFlagStyle(l.key, c1, c2, c3);
                                const active = layout === l.key;
                                return (
                                    <button key={l.key} onClick={() => chooseLayout(l.key)} aria-pressed={active} aria-label={`Use ${l.name} shape`} title={l.name} className={cn("rounded-md overflow-hidden border transition active:scale-95", active ? "border-white ring-2 ring-white" : "border-zinc-700 hover:border-zinc-500")}>
                                        <div className="relative w-full" style={{ aspectRatio: "3 / 2", ...mini.baseStyle }}>
                                            {mini.overlays.map((ov, i) => (
                                                <div key={i} style={{ position: "absolute", inset: 0, background: ov.color, clipPath: ov.clip }} />
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="min-h-0 bg-[#1c1c1e] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6">
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
                                <ColorGrid value={selected.color ?? EMBLEM_COLOR_DEFAULT} onPick={(color) => em.updateEmblem(selected.id, { color })} />
                                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mt-6 mb-2.5">Add another</div>
                                <div className="grid grid-cols-6 gap-2.5">
                                    {EMBLEM_REGISTRY.map((item) => {
                                        const onFlag = em.placed.some((pl) => pl.ref === item.name);
                                        return (
                                            <button key={item.name} onClick={() => em.addEmblem(item.name)} aria-label={`Add ${item.name} emblem to flag`} title={`Add ${item.name}`} className={cn("aspect-square rounded-xl flex items-center justify-center transition active:scale-90", onFlag ? "bg-white/15 text-white ring-1 ring-white/40" : "bg-white/[0.03] text-zinc-300 hover:text-white")}>
                                                {renderEmblem(item, { width: 22, height: 22, color: "currentColor" })}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {view === "shape" && (
                            <div>
                                <PanelHeader title="Pick a shape" onClose={() => setPanel("idle")} />
                                <p className="text-xs text-zinc-500 mb-3">Tap the one you like.</p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                    {LAYOUTS.map((l) => {
                                        const mini = buildFlagStyle(l.key, c1, c2, c3);
                                        const active = layout === l.key;
                                        return (
                                            <button key={l.key} onClick={() => chooseLayout(l.key)} aria-pressed={active} aria-label={l.name} title={l.name} className={cn("p-1 rounded-lg border transition active:scale-95", active ? "bg-white border-white ring-2 ring-white" : "border-zinc-700 hover:border-zinc-500")}>
                                                <div className="relative w-full rounded-sm overflow-hidden ring-1 ring-black/10" style={{ aspectRatio: "3 / 2", ...mini.baseStyle }}>
                                                    {mini.overlays.map((ov, i) => (
                                                        <div key={i} style={{ position: "absolute", inset: 0, background: ov.color, clipPath: ov.clip }} />
                                                    ))}
                                                </div>
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

                                <div className="grid grid-cols-6 lg:grid-cols-7 gap-2">
                                    {EMBLEM_REGISTRY.map((item) => {
                                        const onFlag = em.placed.some((pl) => pl.ref === item.name);
                                        return (
                                            <button key={item.name} onClick={() => em.addEmblem(item.name)} aria-label={`Add ${item.name} emblem to flag`} title={`Add ${item.name}`} className={cn("aspect-square rounded-lg transition flex justify-center items-center active:scale-90", onFlag ? "bg-white/15 text-white ring-1 ring-white/40" : "bg-white/[0.03] text-zinc-300 hover:text-white")}>
                                                {renderEmblem(item, { width: 20, height: 20, color: "currentColor" })}
                                            </button>
                                        );
                                    })}
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
                                    Save / Share
                                </button>
                                <p className="text-xs text-zinc-500 mt-3 text-center">On iPad this opens the share sheet - tap Save Image to add it to the camera roll.</p>
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

            <footer className="shrink-0 pt-2 text-center text-[11px] text-zinc-500">
                Original idea by{" "}
                <a href="https://github.com/nordenheng" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-300 hover:text-white underline underline-offset-2">
                    Norden Heng
                </a>
                <span className="ml-2 font-mono text-zinc-600">{APP_VERSION}</span>
            </footer>
        </div>
    );
}
