"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", background: "#121212", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", textAlign: "center", padding: "24px" }}>
                <div style={{ fontSize: "48px" }} aria-hidden>
                    🏳️
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Something went wrong</h2>
                <button onClick={() => reset()} style={{ padding: "12px 20px", background: "#fff", color: "#000", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: "12px", border: "none", cursor: "pointer" }}>
                    Try again
                </button>
            </body>
        </html>
    );
}
