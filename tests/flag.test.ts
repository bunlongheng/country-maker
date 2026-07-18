import { describe, it, expect } from "vitest";
import { LAYOUTS, buildFlagStyle, bandsForLayout, sanitizeFilename, toggleInList, sanitizeSvg } from "@/lib/flag";

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
