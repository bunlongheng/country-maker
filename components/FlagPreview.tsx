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
    regions: BandShape[][];
    activeBand: number | null;
    onPickBand: (i: number) => void;
    onSwipeLayout: (dir: 1 | -1) => void;
    placed: Placed[];
    selectedId: string | null;
    onSelectEmblem: () => void;
    startDrag: (e: React.PointerEvent, id: string) => void;
    moveDrag: (e: React.PointerEvent) => void;
    endDrag: () => void;
    removePlaced: (id: string) => void;
    renderEmblem: (ref: string, style: React.CSSProperties, key?: React.Key) => React.ReactNode;
};

// Rough area of a band's region, so we can paint big fields first and small shapes on top (correct hit order).
const areaOf = (shapes: BandShape[]) => shapes.reduce((a, s) => a + ("rect" in s ? s.rect[2] * s.rect[3] : 2500), 0);

export function FlagPreview(p: Props) {
    // One gesture tracker on the flag: a clear horizontal drag swipes to the next/prev shape; a tap selects a stripe.
    const g = useRef({ x: 0, y: 0, active: false, swiped: false });
    const onDown = (e: React.PointerEvent) => {
        g.current = { x: e.clientX, y: e.clientY, active: true, swiped: false };
    };
    const onMove = (e: React.PointerEvent) => {
        const s = g.current;
        if (!s.active || s.swiped) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            s.swiped = true;
            p.onSwipeLayout(dx < 0 ? 1 : -1);
        }
    };
    const onUp = () => {
        g.current.active = false;
    };

    // Draw larger regions first so smaller ones (crosses, cantons, inner boxes) sit on top and catch their own taps.
    const ordered = p.regions.map((shapes, bi) => ({ bi, shapes })).sort((a, b) => areaOf(b.shapes) - areaOf(a.shapes));

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
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
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

                    {/* Each stripe region is a tap target that lights up when selected - tap anywhere on the stripe. */}
                    {!p.exporting &&
                        ordered.map(({ bi, shapes }) =>
                            shapes.map((shape, si) => {
                                const active = p.activeBand === bi;
                                const common: React.CSSProperties = { position: "absolute", zIndex: 2, cursor: "pointer", border: "none", background: "transparent", padding: 0 };
                                const style: React.CSSProperties =
                                    "rect" in shape ? { ...common, left: `${shape.rect[0]}%`, top: `${shape.rect[1]}%`, width: `${shape.rect[2]}%`, height: `${shape.rect[3]}%`, ...(active ? { background: "rgba(59,130,246,0.32)", boxShadow: "inset 0 0 0 3px #3b82f6" } : {}) } : { ...common, inset: 0, clipPath: shape.clip, ...(active ? { background: "rgba(59,130,246,0.42)" } : {}) };
                                return <button key={`b${bi}-${si}`} aria-label={`Pick stripe ${bi + 1} color`} aria-pressed={active} className={active ? "cm-band-hl" : undefined} onClick={() => (g.current.swiped ? null : p.onPickBand(bi))} style={style} />;
                            }),
                        )}

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
                            zIndex: isSel ? 5 : 4,
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
                                    e.stopPropagation();
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
