import type { Metadata } from 'next';
import { DM_Sans, Geist, Geist_Mono, Inter } from 'next/font/google';
import '@/app/globals.css';
import Header from '@/components/home/header';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
    variable: '--font-dm-sans',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

const geist = Geist({
    variable: '--font-geist',
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export const metadata: Metadata = {
    metadataBase: new URL('https://subsignal.app'),
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

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className={`${geist.className} ${inter.variable} ${geistMono.variable} ${dmSans.variable} z-10 flex min-h-screen flex-col justify-between gap-12`}
        >
            <Header />
            {children}
        </div>
    );
}
