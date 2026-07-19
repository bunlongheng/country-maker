"use client";
import { useRef, useState } from "react";
import type React from "react";
import { addEmblemAt, upsertText, moveItem, type Placed } from "@/lib/flag";

/** Owns the placed-emblem state (position, selection, drag) so the page stays thin. */
export function useEmblems(flagRef: React.RefObject<HTMLDivElement | null>) {
    const idc = useRef(1);
    const dragging = useRef<string | null>(null);
    const nextId = () => `e${++idc.current}`;

    const [placed, setPlaced] = useState<Placed[]>([{ id: "e1", kind: "emblem", ref: "Sun", x: 50, y: 50 }]);
    const [selectedId, setSelectedId] = useState<string | null>("e1");
    const [customSvgs, setCustomSvgs] = useState<Record<string, string>>({});
    const [textEmblem, setTextEmblem] = useState("");

    const addEmblem = (ref: string) => {
        const id = nextId();
        setPlaced((p) => addEmblemAt(p, id, ref));
        setSelectedId(id);
    };

    const removePlaced = (id: string) => {
        setPlaced((p) => p.filter((x) => x.id !== id));
        if (id === "text") setTextEmblem("");
        setSelectedId((s) => (s === id ? null : s));
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
        setSelectedId(null);
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

    return { placed, selectedId, setSelectedId, customSvgs, textEmblem, nextId, addEmblem, removePlaced, updateText, clearAll, addCustomSvg, resetTo, startDrag, moveDrag, endDrag };
}
