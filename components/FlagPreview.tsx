"use client";
import { useRef } from "react";
import type React from "react";
import { EMBLEM_COLOR_DEFAULT, EMBLEM_SIZE_DEFAULT, EMBLEM_SIZE_MIN, EMBLEM_SIZE_MAX, type BandShape, type Placed } from "@/lib/flag";

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
    placed: Placed[];
    selectedId: string | null;
    onSelectEmblem: () => void;
    setSelected: (id: string) => void;
    updateEmblem: (id: string, patch: { size?: number; rot?: number; color?: string; x?: number; y?: number }) => void;
    removePlaced: (id: string) => void;
    renderEmblem: (ref: string, style: React.CSSProperties, key?: React.Key) => React.ReactNode;
};

// Rough area of a band's region, so we can paint big fields first and small shapes on top (correct hit order).
const areaOf = (shapes: BandShape[]) => shapes.reduce((a, s) => a + ("rect" in s ? s.rect[2] * s.rect[3] : 2500), 0);

// Draw a red OUTLINE that traces a stripe's exact shape (never a fill, so the real color stays true).
function ShapeOutline({ shape }: { shape: BandShape }) {
    const stroke = { fill: "none", stroke: "#ef4444", strokeWidth: 3, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
    if ("rect" in shape) {
        const [x, y, w, h] = shape.rect;
        return <rect x={x} y={y} width={w} height={h} rx={1} {...stroke} />;
    }
    if (shape.clip.startsWith("polygon")) {
        const pts = shape.clip
            .slice(shape.clip.indexOf("(") + 1, shape.clip.lastIndexOf(")"))
            .split(",")
            .map((pair) =>
                pair
                    .trim()
                    .split(/\s+/)
                    .map((v) => parseFloat(v))
                    .join(","),
            )
            .join(" ");
        return <polygon points={pts} {...stroke} />;
    }
    if (shape.clip.startsWith("ellipse")) {
        const [rx, ry, cx, cy] = (shape.clip.match(/[\d.]+/g) || []).map(Number);
        return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...stroke} />;
    }
    return null;
}

export function FlagPreview(p: Props) {
    // Sticker body gestures: one finger drags to move; two fingers pinch to resize and twist to rotate (iPad-native).
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const drag = useRef<string | null>(null);
    const pinch = useRef<{ id: string; d0: number; a0: number; s0: number; r0: number } | null>(null);
    const twoPts = () => {
        const v = [...pointers.current.values()];
        return v.length >= 2 ? ([v[0], v[1]] as const) : null;
    };
    const onStickerDown = (e: React.PointerEvent, it: Placed) => {
        e.stopPropagation();
        p.onSelectEmblem();
        p.setSelected(it.id);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pts = twoPts();
        if (pts) {
            const d0 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const a0 = (Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * 180) / Math.PI;
            pinch.current = { id: it.id, d0, a0, s0: it.size ?? EMBLEM_SIZE_DEFAULT, r0: it.rot ?? 0 };
            drag.current = null;
        } else {
            drag.current = it.id;
        }
    };
    const onStickerMove = (e: React.PointerEvent) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pc = pinch.current;
        const pts = twoPts();
        if (pc && pts) {
            const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const a = (Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * 180) / Math.PI;
            const size = Math.max(EMBLEM_SIZE_MIN, Math.min(EMBLEM_SIZE_MAX, Math.round(pc.s0 * (d / pc.d0))));
            const rot = ((((pc.r0 + (a - pc.a0) + 180) % 360) + 360) % 360) - 180;
            p.updateEmblem(pc.id, { size, rot: Math.round(rot) });
        } else if (drag.current && p.flagRef.current) {
            const r = p.flagRef.current.getBoundingClientRect();
            p.updateEmblem(drag.current, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }
    };
    const onStickerUp = (e: React.PointerEvent) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (pointers.current.size === 0) drag.current = null;
    };

    // One corner handle (mouse-friendly): drag out/in to resize, arc around to rotate - does both at once.
    const handle = useRef<string | null>(null);
    const onHandleDown = (e: React.PointerEvent, id: string) => {
        e.stopPropagation();
        handle.current = id;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onHandleMove = (e: React.PointerEvent) => {
        const id = handle.current;
        if (!id || !p.flagRef.current) return;
        const it = p.placed.find((x) => x.id === id);
        if (!it) return;
        const r = p.flagRef.current.getBoundingClientRect();
        const dx = e.clientX - (r.left + (it.x / 100) * r.width);
        const dy = e.clientY - (r.top + (it.y / 100) * r.height);
        const size = Math.max(EMBLEM_SIZE_MIN, Math.min(EMBLEM_SIZE_MAX, Math.round(Math.hypot(dx, dy) * 1.414)));
        const rot = (((((Math.atan2(dy, dx) * 180) / Math.PI - 45 + 180) % 360) + 360) % 360) - 180; // corner rests at +45deg
        p.updateEmblem(id, { size, rot: Math.round(rot) });
    };
    const onHandleUp = () => {
        handle.current = null;
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
                    style={{
                        width: "min(100%, 500px)",
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
                                // Transparent hit target only - the selection is drawn as an outline below, never a fill (keeps the real color true).
                                const style: React.CSSProperties = "rect" in shape ? { ...common, left: `${shape.rect[0]}%`, top: `${shape.rect[1]}%`, width: `${shape.rect[2]}%`, height: `${shape.rect[3]}%` } : { ...common, inset: 0, clipPath: shape.clip };
                                // pointerup (not click): iOS Safari won't fire click reliably inside a touch-action:none surface.
                                const pick = () => p.onPickBand(bi);
                                return <button key={`b${bi}-${si}`} aria-label={`Pick stripe ${bi + 1} color`} aria-pressed={active} onPointerUp={pick} onClick={pick} style={style} />;
                            }),
                        )}

                    {/* Red outline tracing the selected stripe's real shape - a border, not a fill. */}
                    {!p.exporting && p.activeBand !== null && p.regions[p.activeBand] && (
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none", overflow: "visible" }}>
                            {p.regions[p.activeBand].map((shape, i) => (
                                <ShapeOutline key={i} shape={shape} />
                            ))}
                        </svg>
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
                            ...(isSel ? { outline: "2.5px solid #ef4444", outlineOffset: "6px", borderRadius: "8px" } : {}),
                        };
                        const paint: React.CSSProperties = { color, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))", display: "block", pointerEvents: "none" };
                        return (
                            <div key={it.id} style={wrap} onPointerDown={(e) => onStickerDown(e, it)} onPointerMove={onStickerMove} onPointerUp={onStickerUp} onPointerCancel={onStickerUp}>
                                <div style={rotor}>{it.kind === "text" ? <span style={{ ...paint, fontWeight: 800, fontSize: `${size * 0.9}px`, lineHeight: 1, whiteSpace: "nowrap" }}>{it.ref}</span> : p.renderEmblem(it.ref, { ...paint, width: `${size}px`, height: `${size}px` })}</div>
                                {isSel && (
                                    <>
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
                                        {/* Plain corner handle: drag out/in to resize, arc to rotate. Works with a mouse too. */}
                                        <button
                                            aria-label="Resize or rotate this sticker"
                                            onPointerDown={(e) => onHandleDown(e, it.id)}
                                            onPointerMove={onHandleMove}
                                            onPointerUp={onHandleUp}
                                            onPointerCancel={onHandleUp}
                                            style={{ position: "absolute", bottom: "-15px", right: "-15px", width: "24px", height: "24px", borderRadius: "9999px", background: "#fff", border: "2px solid #1c1c1e", boxShadow: "0 1px 3px rgba(0,0,0,0.4)", zIndex: 6, cursor: "nwse-resize", touchAction: "none" }}
                                        />
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
