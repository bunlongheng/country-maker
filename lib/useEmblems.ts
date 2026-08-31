"use client";
import { useRef, useState } from "react";
import type React from "react";
import { addEmblemAt, upsertText, moveItem, EMBLEM_COLOR_DEFAULT, EMBLEM_SIZE_DEFAULT, type Placed } from "@/lib/flag";

/** Owns the placed-emblem state (position, per-item color/size/rotation, selection, drag) so the page stays thin. */
export function useEmblems(flagRef: React.RefObject<HTMLDivElement | null>) {
    const idc = useRef(1);
    const dragging = useRef<string | null>(null);
    const lastColor = useRef(EMBLEM_COLOR_DEFAULT);
    const lastSize = useRef(EMBLEM_SIZE_DEFAULT);
    const nextId = () => `e${++idc.current}`;

    const [placed, setPlaced] = useState<Placed[]>([{ id: "e1", kind: "emblem", ref: "Sun", x: 50, y: 50, color: EMBLEM_COLOR_DEFAULT, size: EMBLEM_SIZE_DEFAULT, rot: 0 }]);
    const [selectedId, setSelectedId] = useState<string | null>("e1");
    const [customSvgs, setCustomSvgs] = useState<Record<string, string>>({});
    const [textEmblem, setTextEmblem] = useState("");

    const addEmblem = (ref: string) => {
        const id = nextId();
        setPlaced((p) => addEmblemAt(p, id, ref, lastColor.current, lastSize.current));
        setSelectedId(id);
    };

    const removePlaced = (id: string) => {
        setPlaced((p) => p.filter((x) => x.id !== id));
        if (id === "text") setTextEmblem("");
        setSelectedId((s) => (s === id ? null : s));
    };

    // Change one placed item's color/size/rotation. Remembers color+size so the next new sticker inherits them.
    const updateEmblem = (id: string, patch: Partial<Pick<Placed, "color" | "size" | "rot">>) => {
        if (patch.color) lastColor.current = patch.color;
        if (typeof patch.size === "number") lastSize.current = patch.size;
        setPlaced((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    };

    const updateText = (v: string) => {
        setTextEmblem(v);
        setPlaced((p) => upsertText(p, v));
        if (v.trim()) setSelectedId("text");
    };

    const clearAll = () => {
        setPlaced([]);
        setTextEmblem("");
        setSelectedId(null);
    };

    const addCustomSvg = (slug: string, svg: string) => setCustomSvgs((p) => ({ ...p, [slug]: svg }));

    const resetTo = (list: Placed[]) => {
        setPlaced(list);
        setTextEmblem("");
        setSelectedId(list.length ? list[list.length - 1].id : null);
    };

    const startDrag = (e: React.PointerEvent, id: string) => {
        e.stopPropagation();
        setSelectedId(id);
        dragging.current = id;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const moveDrag = (e: React.PointerEvent) => {
        if (dragging.current === null || !flagRef.current) return;
        const r = flagRef.current.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        const id = dragging.current;
        setPlaced((p) => moveItem(p, id, x, y));
    };
    const endDrag = () => {
        dragging.current = null;
    };

    return { placed, selectedId, setSelectedId, customSvgs, textEmblem, nextId, addEmblem, removePlaced, updateEmblem, updateText, clearAll, addCustomSvg, resetTo, startDrag, moveDrag, endDrag };
}
