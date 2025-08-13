import Navigation from '../components/navigation';
import Hero from '../components/hero';
import Integrations from '../components/integrations';
import Pricing from '../components/pricing';
import Footer from '../components/footer';

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
