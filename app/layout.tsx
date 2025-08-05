import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Subsignal - Never Miss a Market Move',
    description:
        'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current',
    keywords:
        'market intelligence, competitive intelligence, deal intelligence, relationship intelligence, market moves, portfolio monitoring, investment tracking, sector thesis',
    authors: [{ name: 'Subsignal' }],
    creator: 'Subsignal',
    publisher: 'Subsignal',
    robots: 'index, follow',
    openGraph: {
        title: 'Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current.',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
