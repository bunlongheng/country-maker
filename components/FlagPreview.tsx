"use client";
import { useRef } from "react";
import type React from "react";
import { EMBLEM_COLOR_DEFAULT, EMBLEM_SIZE_DEFAULT, type BandShape, type Placed } from "@/lib/flag";

type Props = {
    flagRef: React.RefObject<HTMLDivElement | null>;
    exportRef: React.RefObject<HTMLDivElement | null>;
    exporting: boolean;
    rounded: boolean;
    baseStyle: React.CSSProperties;
    overlays: { clip: string; color: string }[];
    bands: { x: number; y: number }[];
    activeBand: number | null;
    activeRegion: BandShape[] | null;
    onPickBand: (i: number) => void;
    placed: Placed[];
    selectedId: string | null;
    onDeselect: () => void;
    onSelectEmblem: () => void;
    startDrag: (e: React.PointerEvent, id: string) => void;
    moveDrag: (e: React.PointerEvent) => void;
    endDrag: () => void;
    removePlaced: (id: string) => void;
    renderEmblem: (ref: string, style: React.CSSProperties, key?: React.Key) => React.ReactNode;
    onSwipeLayout: (dir: 1 | -1) => void;
};

export function FlagPreview(p: Props) {
    // Track a pointer press on the bare flag: a clear horizontal drag swipes to the next/prev shape,
    // a plain tap deselects. Presses on stripes/stickers stopPropagation, so this never eats their taps.
    const press = useRef<{ x: number; y: number } | null>(null);
    const onFlagDown = (e: React.PointerEvent) => {
        press.current = { x: e.clientX, y: e.clientY };
    };
    const onFlagUp = (e: React.PointerEvent) => {
        const start = press.current;
        press.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) p.onSwipeLayout(dx < 0 ? 1 : -1);
        else p.onDeselect();
    };
    return (
        <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
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
                    width: "100%",
                }}
            >
                <div
                    ref={p.flagRef}
                    onPointerDown={onFlagDown}
                    onPointerUp={onFlagUp}
                    onPointerCancel={() => (press.current = null)}
                    style={{
                        width: "min(100%, 700px)",
                        aspectRatio: "3 / 2",
                        marginInline: "auto",
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
                    {/* Light up the WHOLE selected stripe region so it's obvious which area the color paints. */}
                    {!p.exporting &&
                        p.activeRegion?.map((shape, i) =>
                            "rect" in shape ? (
                                <div key={`hl${i}`} className="cm-band-hl" style={{ position: "absolute", left: `${shape.rect[0]}%`, top: `${shape.rect[1]}%`, width: `${shape.rect[2]}%`, height: `${shape.rect[3]}%`, background: "rgba(59,130,246,0.30)", boxShadow: "inset 0 0 0 3px #3b82f6", zIndex: 2, pointerEvents: "none" }} />
                            ) : (
                                <div key={`hl${i}`} className="cm-band-hl" style={{ position: "absolute", inset: 0, background: "rgba(59,130,246,0.42)", clipPath: shape.clip, zIndex: 2, pointerEvents: "none" }} />
                            ),
                        )}
                    {!p.exporting &&
                        p.bands.map((b, i) => (
                            <button
                                key={i}
                                aria-label={`Pick stripe ${i + 1} color`}
                                aria-pressed={p.activeBand === i}
                                title="Tap this stripe, then pick a color"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    p.onPickBand(i);
                                }}
                                style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, transform: "translate(-50%, -50%)", width: "30%", height: "36%", background: "transparent", border: "none", zIndex: 3, cursor: "pointer" }}
                            />
                        ))}
                    {p.placed.map((it) => {
                        const isSel = p.selectedId === it.id && !p.exporting;
                        const color = it.color ?? EMBLEM_COLOR_DEFAULT;
                        const size = it.size ?? EMBLEM_SIZE_DEFAULT;
                        const rot = it.rot ?? 0;
                        const wrap: React.CSSProperties = {
                            position: "absolute",
                            left: `${it.x}%`,
                            top: `${it.y}%`,
                            transform: "translate(-50%, -50%)",
                            zIndex: isSel ? 5 : 3,
                            cursor: "grab",
                            touchAction: "none",
                            lineHeight: 0,
                        };
                        const rotor: React.CSSProperties = {
                            transform: `rotate(${rot}deg)`,
                            lineHeight: 0,
                            ...(isSel ? { outline: "2.5px solid #3b82f6", outlineOffset: "6px", borderRadius: "8px" } : {}),
                        };
                        const paint: React.CSSProperties = { color, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))", display: "block", pointerEvents: "none" };
                        return (
                            <div
                                key={it.id}
                                style={wrap}
                                onPointerDown={(e) => {
                                    p.onSelectEmblem();
                                    p.startDrag(e, it.id);
                                }}
                                onPointerMove={p.moveDrag}
                                onPointerUp={p.endDrag}
                                onPointerCancel={p.endDrag}
                            >
                                <div style={rotor}>{it.kind === "text" ? <span style={{ ...paint, fontWeight: 800, fontSize: `${size * 0.9}px`, lineHeight: 1, whiteSpace: "nowrap" }}>{it.ref}</span> : p.renderEmblem(it.ref, { ...paint, width: `${size}px`, height: `${size}px` })}</div>
                                {isSel && (
                                    <button
                                        aria-label="Remove this emblem"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            p.removePlaced(it.id);
                                        }}
                                        style={{ position: "absolute", top: "-16px", right: "-16px", width: "26px", height: "26px", borderRadius: "9999px", background: "#ef4444", color: "#fff", border: "2px solid #1c1c1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", lineHeight: 1, zIndex: 6, cursor: "pointer" }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
