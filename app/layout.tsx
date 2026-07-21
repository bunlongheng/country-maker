import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const fankids = localFont({ src: "../public/fonts/FanKids.ttf", variable: "--font-fankids", display: "swap" });

export const metadata: Metadata = {
    title: "Country Maker - Design your own flag",
    description: "Design your own country flag - 14 layouts, custom colors, multiple emblems (dragon, sun, Angkor Wat, crescent), text and name. Download as PNG.",
    openGraph: {
        title: "Country Maker",
        description: "Design your own country flag and download it as a PNG.",
        type: "website",
    },
    robots: { index: true, follow: true },
};

export const viewport = {
    themeColor: "#121212",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={fankids.variable}>
            <body>{children}</body>
        </html>
    );
}
