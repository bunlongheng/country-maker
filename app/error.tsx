"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="h-screen flex flex-col items-center justify-center gap-5 bg-[#121212] text-white p-6 text-center">
            <div className="text-5xl" aria-hidden>
                🏳️
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-sm text-zinc-400 max-w-sm">The flag maker hit a snag. Your work was only in this session - try again.</p>
            <button onClick={() => reset()} className="px-5 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition">
                Try again
            </button>
        </div>
    );
}
