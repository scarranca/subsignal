import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/query-provider';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const lora = Lora({
    variable: '--font-lora',
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
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
    openGraph: {
        title: 'Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current.',
        type: 'website',
        locale: 'en_US',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Subsignal - Never Miss a Market Move',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Subsignal - Never Miss a Market Move',
        description:
            'Be the investor founders turn to. Monitor companies you passed on and keep your sector thesis current.',
        images: ['/og-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
            >
                <QueryProvider>
                    {children}
                    <Toaster />
                </QueryProvider>
            </body>
        </html>
    );
}
