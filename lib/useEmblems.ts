"use client";
import { useRef, useState } from "react";
import { addEmblemAt, upsertText, clampPos, EMBLEM_COLOR_DEFAULT, EMBLEM_SIZE_DEFAULT, type Placed } from "@/lib/flag";

/** Owns the placed-emblem state (position, per-item color/size/rotation, selection) so the page stays thin. */
export function useEmblems() {
    const idc = useRef(1);
    const lastColor = useRef(EMBLEM_COLOR_DEFAULT);
    const lastSize = useRef(EMBLEM_SIZE_DEFAULT);
    const nextId = () => `e${++idc.current}`;

    const [placed, setPlaced] = useState<Placed[]>([{ id: "e1", kind: "emblem", ref: "Sun", x: 50, y: 50, color: EMBLEM_COLOR_DEFAULT, size: EMBLEM_SIZE_DEFAULT, rot: 0 }]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
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

    // Change one placed item's position/color/size/rotation. Remembers color+size so the next new sticker inherits them.
    const updateEmblem = (id: string, patch: Partial<Pick<Placed, "color" | "size" | "rot" | "x" | "y">>) => {
        if (patch.color) lastColor.current = patch.color;
        if (typeof patch.size === "number") lastSize.current = patch.size;
        const clamped = { ...patch };
        if (typeof clamped.x === "number") clamped.x = clampPos(clamped.x);
        if (typeof clamped.y === "number") clamped.y = clampPos(clamped.y);
        setPlaced((p) => p.map((it) => (it.id === id ? { ...it, ...clamped } : it)));
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

    return { placed, selectedId, setSelectedId, customSvgs, textEmblem, nextId, addEmblem, removePlaced, updateEmblem, updateText, clearAll, addCustomSvg, resetTo };
}
