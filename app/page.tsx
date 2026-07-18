"use client";
import { FLAG_EMBLEMS } from "@/lib/flagEmblems";

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

const L_EMBLEM_SIZE = 100;
const XL_EMBLEM_SIZE = Math.round(L_EMBLEM_SIZE * 1.4);

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

type LayoutKey =
    | "vertical" | "horizontal" | "vertical-bi" | "horizontal-bi"
    | "nordic" | "saltire" | "diagonal" | "chevron"
    | "disc" | "canton" | "quadrant" | "solid"
    | "stripes" | "star-stripes";

const LAYOUTS: { key: LayoutKey; name: string; bands: number }[] = [
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

export default function CountryMaker() {
    const flagRef = useRef<HTMLDivElement | null>(null);

    const [countryName, setCountryName] = useState("Republic of Norden");
    const [layout, setLayout] = useState<LayoutKey>("vertical");
    const [c1, setC1] = useState("#0055A4");
    const [c2, setC2] = useState("#FFFFFF");
    const [c3, setC3] = useState("#D21034");

    const [searchTerm, setSearchTerm] = useState("");
    // Multiple emblems: array of registry names and/or "custom:<slug>" refs. Empty = no emblem.
    const [emblems, setEmblems] = useState<string[]>(["Sun"]);
    const [customSvgs, setCustomSvgs] = useState<Record<string, string>>({});
    const [textEmblem, setTextEmblem] = useState("");
    const [emblemName, setEmblemName] = useState("");
    const [customEmblemError, setCustomEmblemError] = useState("");
    const [customEmblemLoading, setCustomEmblemLoading] = useState(false);
    const [emblemColor, setEmblemColor] = useState("#FFD700");
    const [emblemSizeMode, setEmblemSizeMode] = useState<"L" | "XL">("L");

    const [showName, setShowName] = useState(false);
    const [nameColor, setNameColor] = useState("#FFFFFF");
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

    const emblemSize = emblemSizeMode === "XL" ? XL_EMBLEM_SIZE : L_EMBLEM_SIZE;
    const activeBands = LAYOUTS.find((l) => l.key === layout)?.bands ?? 3;

    const { baseStyle, overlays } = useMemo((): { baseStyle: React.CSSProperties; overlays: { clip: string; color: string }[] } => {
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
                return {
                    baseStyle: { background: `linear-gradient(${c1},${c1}) 0 0/50% 50% no-repeat, linear-gradient(${c2},${c2}) 100% 0/50% 50% no-repeat, linear-gradient(${c2},${c2}) 0 100%/50% 50% no-repeat, linear-gradient(${c1},${c1}) 100% 100%/50% 50% no-repeat` },
                    overlays: [],
                };
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
    }, [layout, c1, c2, c3]);

    const normalizeEmblemName = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
                <span className="text-zinc-500">{value.slice(0, idx)}</span>
                <span className="text-white">{value.slice(idx, idx + query.length)}</span>
                <span className="text-zinc-500">{value.slice(idx + query.length)}</span>
            </>
        );
    };

    const svgForRef = (ref: string): string | undefined => {
        if (ref.startsWith("custom:")) return customSvgs[ref.slice(7)];
        return emblemEntryByName.get(ref)?.svg;
    };
    const iconForRef = (ref: string): SvgIcon | undefined => (ref.startsWith("custom:") ? undefined : emblemEntryByName.get(ref)?.Icon);

    const renderRef = (ref: string, style: React.CSSProperties, key?: React.Key) => {
        const svg = svgForRef(ref);
        if (svg) return <div key={key} className="[&>svg]:w-full [&>svg]:h-full" style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
        const Icon = iconForRef(ref);
        return Icon ? <Icon key={key} style={style} /> : null;
    };

    const renderGridEmblem = (entry: EmblemEntry, style: React.CSSProperties) => {
        if (entry.svg) return <div className="[&>svg]:w-full [&>svg]:h-full" style={style} dangerouslySetInnerHTML={{ __html: entry.svg }} />;
        const Icon = entry.Icon!;
        return <Icon style={style} />;
    };

    const toggleEmblem = (name: string) => setEmblems((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

    const loadEmblemByName = async (explicitSlug?: string) => {
        const slug = explicitSlug || normalizeEmblemName(emblemName);
        if (!slug) {
            setCustomEmblemError("Enter emblem name, e.g. star");
            return;
        }
        const matched = EMBLEM_REGISTRY.find((item) => item.slug === slug && item.Icon);
        if (matched) {
            setEmblemName(slug);
            if (!emblems.includes(matched.name)) setEmblems((p) => [...p, matched.name]);
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
            const normalizedSvg = rawSvg.replace(/width="[^"]*"/g, "").replace(/height="[^"]*"/g, "").replace(/stroke="[^"]*"/g, 'stroke="currentColor"').replace(/fill="[^"]*"/g, 'fill="none"');
            setCustomSvgs((p) => ({ ...p, [slug]: normalizedSvg }));
            const ref = `custom:${slug}`;
            setEmblems((p) => (p.includes(ref) ? p : [...p, ref]));
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
        const picks = new Set<string>();
        while (picks.size < count) picks.add(EMBLEM_REGISTRY[Math.floor(Math.random() * EMBLEM_REGISTRY.length)].name);
        setEmblems([...picks]);
    };

    const handleDownload = async () => {
        if (!flagRef.current) return;
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await html2canvas(flagRef.current, { backgroundColor: null, scale: 3, useCORS: true });
        const safeName = (countryName || "flag").toLowerCase().replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "flag";
        const link = document.createElement("a");
        link.download = `${safeName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    // Emblem placement: smaller items when several; tucked into the canton for Stars + Stripes.
    const items = [...emblems, ...(textEmblem.trim() ? ["__text__"] : [])];
    const inCanton = layout === "star-stripes";
    const perScale = items.length <= 1 ? 1 : items.length <= 2 ? 0.78 : items.length <= 4 ? 0.6 : 0.46;
    const perSize = (inCanton ? emblemSize * 0.42 : emblemSize) * perScale;
    const containerStyle: React.CSSProperties = inCanton
        ? { position: "absolute", top: "3%", left: "2%", width: "36%", height: "48%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: `${perSize * 0.16}px`, zIndex: 2 }
        : { position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: `${perSize * 0.18}px`, maxWidth: "82%" };
    const itemStyle: React.CSSProperties = { width: `${perSize}px`, height: `${perSize}px`, color: emblemColor, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))" };
    const textStyle: React.CSSProperties = { color: emblemColor, fontWeight: 800, fontSize: `${perSize * 0.9}px`, lineHeight: 1, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))", whiteSpace: "nowrap" };

    return (
        <div className="h-screen overflow-hidden bg-[#121212] text-white p-3 md:p-6 font-sans">
            <style>{`
                * { scrollbar-color: #36363f #0b0b0d; }
                *::-webkit-scrollbar { width: 10px; height: 10px; }
                *::-webkit-scrollbar-track { background: #0b0b0d; }
                *::-webkit-scrollbar-thumb { background: #36363f; border-radius: 9999px; border: 2px solid #0b0b0d; }
                *::-webkit-scrollbar-thumb:hover { background: #4a4a55; }
            `}</style>
            <div className="h-full max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 md:gap-6">
                <section className="h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 shadow-2xl overflow-auto">
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-6 p-8 md:p-12">
                        <div
                            ref={flagRef}
                            style={{
                                width: "clamp(260px, 46vw, 540px)",
                                aspectRatio: "3 / 2",
                                borderRadius: rounded ? "1rem" : "0px",
                                overflow: "hidden",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                                ...baseStyle,
                            }}>
                            {overlays.map((ov, i) => (
                                <div key={i} style={{ position: "absolute", inset: 0, background: ov.color, clipPath: ov.clip, zIndex: 1 }} />
                            ))}
                            {items.length > 0 && (
                                <div style={containerStyle}>
                                    {items.map((ref, i) =>
                                        ref === "__text__" ? (
                                            <span key="__text__" style={textStyle}>
                                                {textEmblem}
                                            </span>
                                        ) : (
                                            renderRef(ref, itemStyle, `${ref}-${i}`)
                                        ),
                                    )}
                                </div>
                            )}
                            {showName && countryName.trim() && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "8%",
                                        left: 0,
                                        right: 0,
                                        textAlign: "center",
                                        color: nameColor,
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        fontSize: "clamp(11px, 2.6vw, 22px)",
                                        textTransform: "uppercase",
                                        textShadow: "0 1px 6px rgba(0,0,0,0.45)",
                                        padding: "0 8%",
                                        zIndex: 2,
                                    }}>
                                    {countryName}
                                </div>
                            )}
                        </div>
                        {countryName.trim() && <div className="text-center text-lg md:text-xl font-bold tracking-wide text-zinc-200">{countryName}</div>}
                    </div>
                </section>

                <section className="h-full bg-[#1c1c1e] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">Country Name</label>
                            <input value={countryName} placeholder="Republic of ..." onChange={(e) => setCountryName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">Flag Layout - {LAYOUTS.length} types</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LAYOUTS.map((l) => (
                                    <button key={l.key} onClick={() => setLayout(l.key)} className={cn("px-3 py-2 text-xs rounded-xl border transition text-left", layout === l.key ? "bg-white text-black border-white font-bold" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
                                        {l.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Preset Colors</label>
                                <button onClick={randomize} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 transition">
                                    <SparklesIcon className="w-3.5 h-3.5" />
                                    Random
                                </button>
                            </div>
                            <div className="grid grid-cols-10 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button key={color} onClick={() => setC1(color)} className={cn("aspect-square rounded-full transition-all active:scale-90 border-2", c1 === color ? "border-white scale-110 shadow-lg" : "border-transparent")} style={{ backgroundColor: color, boxShadow: color === "#FFFFFF" ? "inset 0 0 0 1px rgba(255,255,255,0.2)" : undefined }} title={`Set band 1 to ${color}`} />
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-2">Presets set band 1. Fine-tune each band below.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">Band Colors</label>
                            <div className="space-y-2.5">
                                {[
                                    { val: c1, set: setC1, label: "Band 1" },
                                    { val: c2, set: setC2, label: "Band 2" },
                                    { val: c3, set: setC3, label: "Band 3" },
                                ]
                                    .slice(0, activeBands)
                                    .map((band) => (
                                        <div key={band.label} className="flex items-center gap-3">
                                            <label className="relative w-10 h-10 rounded-full border-2 border-white/20 cursor-pointer transition hover:scale-105 shrink-0" style={{ backgroundColor: band.val }}>
                                                <input type="color" value={band.val} onChange={(e) => band.set(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </label>
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 w-14 shrink-0">{band.label}</span>
                                            <input type="text" value={band.val} onChange={(e) => band.set(e.target.value)} className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono focus:border-zinc-500 outline-none transition" />
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Emblems - tap to add / remove</label>
                                <button onClick={() => { setEmblems([]); setTextEmblem(""); }} className={cn("px-3 py-1 text-[10px] font-bold uppercase rounded-full border transition flex items-center gap-1", items.length === 0 ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
                                    <XMarkIcon className="w-3 h-3" />
                                    None
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <label className="relative w-10 h-10 rounded-full border-2 border-white/20 cursor-pointer transition hover:scale-105" style={{ backgroundColor: emblemColor }}>
                                        <input type="color" value={emblemColor} onChange={(e) => setEmblemColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </label>
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Emblem color</span>
                                </div>
                                <div className="flex items-center bg-black/30 border border-zinc-800 rounded-xl p-1">
                                    <button onClick={() => setEmblemSizeMode("L")} className={cn("px-4 py-1.5 text-xs rounded-lg font-bold transition", emblemSizeMode === "L" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>L</button>
                                    <button onClick={() => setEmblemSizeMode("XL")} className={cn("px-4 py-1.5 text-xs rounded-lg font-bold transition", emblemSizeMode === "XL" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300")}>XL</button>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Text / letters (中, 王, USA, ★)</div>
                                <input value={textEmblem} maxLength={12} placeholder="type letters or characters" onChange={(e) => setTextEmblem(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none" />
                            </div>

                            <input value={searchTerm} placeholder="search emblems" onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-sm focus:border-zinc-500 outline-none mb-3" />
                            <div className="mb-3 space-y-2">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Load by Heroicons name</div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
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
                                    <button onClick={() => loadEmblemByName()} className="px-4 bg-white text-black text-xs font-bold uppercase rounded-xl hover:bg-zinc-200 transition">{customEmblemLoading ? "..." : "Add"}</button>
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                    Need names?{" "}
                                    <a href="https://heroicons.com/" target="_blank" rel="noreferrer" className="text-zinc-300 underline underline-offset-2 hover:text-white">heroicons.com</a>
                                </div>
                                {customEmblemError && <div className="text-[10px] text-red-400 uppercase tracking-wide">{customEmblemError}</div>}
                            </div>
                            <div className="max-h-[30dvh] overflow-y-auto p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="grid grid-cols-6 sm:grid-cols-7 xl:grid-cols-6 gap-2">
                                    {filteredEmblems.map((item) => (
                                        <button key={item.name} onClick={() => toggleEmblem(item.name)} title={`${item.name} - ${item.slug}`} className={cn("p-2 rounded-lg transition flex justify-center items-center h-9", emblems.includes(item.name) ? "bg-white/15 text-white ring-1 ring-white/40" : "text-zinc-500 hover:text-zinc-300")}>
                                            {renderGridEmblem(item, { width: 20, height: 20, color: "currentColor" })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-1">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowName((v) => !v)} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border transition", showName ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400")}>Name on flag</button>
                                {showName && (
                                    <label className="relative w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer transition hover:scale-105" style={{ backgroundColor: nameColor }} title="Name color">
                                        <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </label>
                                )}
                            </div>
                            <button onClick={() => setRounded((v) => !v)} className={cn("px-3 py-1.5 text-[10px] font-bold uppercase rounded-full border transition", rounded ? "bg-white text-black border-white" : "border-zinc-700 text-zinc-400")}>{rounded ? "Rounded" : "Square"}</button>
                        </div>
                    </div>

                    <div className="p-5 md:p-6 border-t border-white/5">
                        <button onClick={handleDownload} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.97] shadow-xl flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Download Flag
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
