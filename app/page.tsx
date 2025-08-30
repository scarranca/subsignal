import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Integrations from '@/components/Integrations';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import Features from '@/components/Features';

export default function Page() {
    return (
        <div className="w-full min-h-screen flex flex-col">
            <Navigation />
            <Hero />
            <Integrations />
            <Features />
            <Pricing />
            <Footer />
        </div>
    );
}
