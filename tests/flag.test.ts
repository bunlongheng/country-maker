import { describe, it, expect } from "vitest";
import { LAYOUTS, buildFlagStyle, bandsForLayout, sanitizeFilename, toggleInList, sanitizeSvg, clampPos, centerNudge, addEmblemAt, upsertText, moveItem, type Placed } from "@/lib/flag";

describe("buildFlagStyle", () => {
    it("returns a background for every one of the 14 layouts", () => {
        for (const { key } of LAYOUTS) {
            const { baseStyle, overlays } = buildFlagStyle(key, "#111111", "#222222", "#333333");
            expect(baseStyle.background, `layout ${key}`).toBeTruthy();
            expect(Array.isArray(overlays)).toBe(true);
        }
    });

    it("solid uses only band 1", () => {
        expect(buildFlagStyle("solid", "#abcdef", "#000", "#000").baseStyle.background).toBe("#abcdef");
    });

    it("saltire and chevron emit clip-path overlays, simple layouts do not", () => {
        expect(buildFlagStyle("saltire", "#1", "#2", "#3").overlays).toHaveLength(2);
        expect(buildFlagStyle("chevron", "#1", "#2", "#3").overlays).toHaveLength(1);
        expect(buildFlagStyle("vertical", "#1", "#2", "#3").overlays).toHaveLength(0);
    });

    it("threads all three colors into a tricolor", () => {
        const bg = String(buildFlagStyle("vertical", "#aaa", "#bbb", "#ccc").baseStyle.background);
        expect(bg).toContain("#aaa");
        expect(bg).toContain("#bbb");
        expect(bg).toContain("#ccc");
    });
});

describe("bandsForLayout", () => {
    it("reports the right band count", () => {
        expect(bandsForLayout("solid")).toBe(1);
        expect(bandsForLayout("nordic")).toBe(2);
        expect(bandsForLayout("vertical")).toBe(3);
    });
});

describe("sanitizeFilename", () => {
    it("kebab-cases and strips unsafe chars", () => {
        expect(sanitizeFilename("Republic of Norden!")).toBe("republic-of-norden");
    });
    it("collapses repeats and trims dashes", () => {
        expect(sanitizeFilename("  --A & B--  ")).toBe("a-b");
    });
    it("falls back to flag when empty", () => {
        expect(sanitizeFilename("")).toBe("flag");
        expect(sanitizeFilename("###")).toBe("flag");
    });
});

describe("toggleInList", () => {
    it("adds when absent, removes when present", () => {
        expect(toggleInList(["a"], "b")).toEqual(["a", "b"]);
        expect(toggleInList(["a", "b"], "a")).toEqual(["b"]);
    });
    it("does not mutate the input", () => {
        const src = ["a"];
        toggleInList(src, "b");
        expect(src).toEqual(["a"]);
    });
});

describe("placed emblems", () => {
    const base: Placed[] = [{ id: "e1", kind: "emblem", ref: "Sun", x: 50, y: 50 }];

    it("clampPos keeps positions inside 0-100", () => {
        expect(clampPos(-20)).toBe(0);
        expect(clampPos(140)).toBe(100);
        expect(clampPos(42)).toBe(42);
    });

    it("centerNudge grows as the centre gets crowded, capped at 28", () => {
        expect(centerNudge([])).toBe(0);
        expect(centerNudge(base)).toBe(7);
        expect(centerNudge([...base, ...base, ...base, ...base, ...base])).toBe(28);
    });

    it("addEmblemAt appends a selected-ready item near centre", () => {
        const next = addEmblemAt(base, "e2", "Crown");
        expect(next).toHaveLength(2);
        expect(next[1]).toMatchObject({ id: "e2", kind: "emblem", ref: "Crown" });
        expect(next[1].x).toBeGreaterThanOrEqual(50);
    });

    it("upsertText adds, updates, then removes the single text item", () => {
        const withText = upsertText(base, "中国");
        expect(withText.filter((p) => p.kind === "text")).toHaveLength(1);
        const updated = upsertText(withText, "王");
        expect(updated.find((p) => p.kind === "text")?.ref).toBe("王");
        expect(upsertText(updated, "  ").some((p) => p.kind === "text")).toBe(false);
    });

    it("moveItem clamps and only touches the target", () => {
        const two = addEmblemAt(base, "e2", "Crown");
        const moved = moveItem(two, "e2", 999, -5);
        expect(moved.find((p) => p.id === "e2")).toMatchObject({ x: 100, y: 0 });
        expect(moved.find((p) => p.id === "e1")).toMatchObject({ x: 50, y: 50 });
    });
});

describe("sanitizeSvg", () => {
    it("keeps a clean svg", () => {
        expect(sanitizeSvg('<svg><path d="M0 0"/></svg>')).toContain("<path");
    });
    it("strips scripts and event handlers", () => {
        const dirty = '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0"/></svg>';
        const clean = sanitizeSvg(dirty);
        expect(clean).not.toContain("onload");
        expect(clean).not.toContain("<script");
        expect(clean).toContain("<path");
    });
    it("rejects non-svg input", () => {
        expect(sanitizeSvg("<div>nope</div>")).toBe("");
    });
});
