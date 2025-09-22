import Hero from '@/components/home/hero';
import Features from '@/components/home/features';
import CTA from '@/components/home/cta';
import Pricing from '@/components/home/pricing';
import Footer from '@/components/home/footer';
import Integrations from '@/components/Integrations';

export default function Home() {
    return (
        <>
            <main className="flex flex-col items-center gap-24">
                <Hero />
                <Features />
                <Integrations />
                <Pricing />
                <CTA />
            </main>
            <Footer />
        </>
    );
}
