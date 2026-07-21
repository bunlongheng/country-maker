"use client";
import type React from "react";
import type { Placed } from "@/lib/flag";

type Props = {
    flagRef: React.RefObject<HTMLDivElement | null>;
    exportRef: React.RefObject<HTMLDivElement | null>;
    exporting: boolean;
    rounded: boolean;
    baseStyle: React.CSSProperties;
    overlays: { clip: string; color: string }[];
    bands: { color: string; set: (v: string) => void; x: number; y: number }[];
    placed: Placed[];
    selectedId: string | null;
    emblemColor: string;
    emblemSize: number;
    countryName: string;
    setCountryName: (v: string) => void;
    onDeselect: () => void;
    startDrag: (e: React.PointerEvent, id: string) => void;
    moveDrag: (e: React.PointerEvent) => void;
    endDrag: () => void;
    removePlaced: (id: string) => void;
    renderEmblem: (ref: string, style: React.CSSProperties, key?: React.Key) => React.ReactNode;
};

export function FlagPreview(p: Props) {
    return (
        <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-4 p-8 md:p-12">
            <div
                ref={p.exportRef}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: p.exporting ? "22px" : "16px",
                    padding: p.exporting ? "34px 40px" : 0,
                    background: p.exporting ? "#1b1b1f" : "transparent",
                    borderRadius: "1.5rem",
                }}
            >
                <div
                    ref={p.flagRef}
                    onPointerDown={p.onDeselect}
                    style={{
                        width: "clamp(260px, 46vw, 540px)",
                        aspectRatio: "3 / 2",
                        borderRadius: p.rounded ? "1rem" : "0px",
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                        touchAction: "none",
                        ...p.baseStyle,
                    }}
                >
                    {p.overlays.map((ov, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0, background: ov.color, clipPath: ov.clip, zIndex: 1, pointerEvents: "none" }} />
                    ))}
                    {!p.exporting &&
                        p.bands.map((b, i) => (
                            <label key={i} title="Tap to change this color" onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, transform: "translate(-50%, -50%)", width: "26px", height: "26px", borderRadius: "9999px", background: b.color, border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.45)", zIndex: 2, cursor: "pointer" }}>
                                <input type="color" value={b.color} onChange={(e) => b.set(e.target.value)} aria-label={`Change band ${i + 1} color`} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                            </label>
                        ))}
                    {p.placed.map((it) => {
                        const isSel = p.selectedId === it.id && !p.exporting;
                        const wrap: React.CSSProperties = {
                            position: "absolute",
                            left: `${it.x}%`,
                            top: `${it.y}%`,
                            transform: "translate(-50%, -50%)",
                            zIndex: 2,
                            cursor: "grab",
                            touchAction: "none",
                            lineHeight: 0,
                            ...(isSel ? { outline: "2.5px solid #3b82f6", outlineOffset: "5px", borderRadius: "8px" } : {}),
                        };
                        const paint: React.CSSProperties = { color: p.emblemColor, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))", display: "block", pointerEvents: "none" };
                        return (
                            <div key={it.id} style={wrap} onPointerDown={(e) => p.startDrag(e, it.id)} onPointerMove={p.moveDrag} onPointerUp={p.endDrag} onPointerCancel={p.endDrag}>
                                {it.kind === "text" ? <span style={{ ...paint, fontWeight: 800, fontSize: `${p.emblemSize * 0.9}px`, lineHeight: 1, whiteSpace: "nowrap" }}>{it.ref}</span> : p.renderEmblem(it.ref, { ...paint, width: `${p.emblemSize}px`, height: `${p.emblemSize}px` })}
                                {isSel && (
                                    <button
                                        aria-label="Remove this emblem"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            p.removePlaced(it.id);
                                        }}
                                        style={{ position: "absolute", top: "-14px", right: "-14px", width: "22px", height: "22px", borderRadius: "9999px", background: "#ef4444", color: "#fff", border: "2px solid #1c1c1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", lineHeight: 1, zIndex: 3, cursor: "pointer" }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {p.exporting ? (
                    p.countryName.trim() && <div style={{ color: "#e8e8ea", fontWeight: 800, fontSize: "clamp(16px, 2.4vw, 26px)", letterSpacing: "0.02em", textAlign: "center" }}>{p.countryName}</div>
                ) : (
                    <input
                        value={p.countryName}
                        onChange={(e) => p.setCountryName(e.target.value)}
                        aria-label="Country name (tap to rename)"
                        placeholder="Tap to name your country"
                        className="w-full text-center border-0 outline-none text-zinc-200 font-bold tracking-wide placeholder:text-zinc-400 focus:text-white"
                        style={{ fontSize: "clamp(16px, 2.4vw, 24px)", appearance: "none", WebkitAppearance: "none", background: "transparent" }}
                    />
                )}
            </div>
        </div>
    );
}
