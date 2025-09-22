import type { Metadata } from 'next';
import Header from '@/components/home/header';
import Footer from '@/components/home/footer';

export const metadata: Metadata = {
    title: {
        template: '%s — Subsignal',
        absolute: 'Subsignal',
    },
    applicationName: 'Subsignal',
    authors: [{ name: 'Subsignal Team' }],
    creator: 'Subsignal',
    publisher: 'Subsignal',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'Subsignal',
    },
    twitter: {
        card: 'summary_large_image',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: [{ url: '/favicon.ico' }],
    },
    category: 'technology',
    classification: 'Business Intelligence Software',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }],
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <main className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10">{children}</main>
            <Footer />
        </>
    );
}
