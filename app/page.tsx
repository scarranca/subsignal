import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Integrations from '@/components/Integrations';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

export default function Page() {
    return (
        <div className="w-full min-h-screen flex flex-col">
            <Navigation />
            <Hero />
            <Integrations />
            <Pricing />
            <Footer />
        </div>
    );
}
