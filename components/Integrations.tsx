import Image from 'next/image';

const logos = [
    { src: '/images/integrations/crunchbase.svg', alt: 'Crunchbase Logo' },
    { src: '/images/integrations/pitchbook.svg', alt: 'PitchBook Logo' },
    { src: '/images/integrations/angellist.svg', alt: 'AngelList Logo' },
    { src: '/images/integrations/affinity.svg', alt: 'Affinity Logo' },
    { src: '/images/integrations/linkedin.svg', alt: 'LinkedIn Logo' },
    { src: '/images/integrations/twitter.svg', alt: 'Twitter Logo' },
    { src: '/images/integrations/email.svg', alt: 'Email Logo' },
];

function LogoCarousel() {
    return (
        <div className="relative w-full overflow-hidden">
            <div className="flex animate-infinite-scroll">
                {[1, 2, 3].map((set) => (
                    <div key={set} className={`flex space-x-16 shrink-0 ${set > 1 ? 'ml-16' : ''}`}>
                        {logos.map((logo, index) => (
                            <div
                                key={`${set}-${index}`}
                                className="w-[60px] flex items-center justify-center"
                            >
                                <Image
                                    src={logo.src}
                                    alt={logo.alt}
                                    width={36}
                                    height={18}
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Integrations() {
    return (
        <section className="pt-0 md:pt-2 pb-16 md:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-12">
                    <p className="text-zinc-600">Works seamlessly with your favorite tools</p>
                </div>

                <div className="relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

                    {/* Logo Carousel */}
                    <LogoCarousel />
                </div>
            </div>
        </section>
    );
}
