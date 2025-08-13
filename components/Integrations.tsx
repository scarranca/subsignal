import Image from 'next/image';

const logos = [
    { src: '/images/integrations/angelist.svg', alt: 'AngelList Logo' },
    { src: '/images/integrations/gmail.svg', alt: 'Gmail Logo' },
    { src: '/images/integrations/hubspot.svg', alt: 'HubSpot Logo' },
    { src: '/images/integrations/linkedin.svg', alt: 'LinkedIn Logo' },
    { src: '/images/integrations/slack.svg', alt: 'Slack Logo' },
    { src: '/images/integrations/trello.svg', alt: 'Trello Logo' },
    { src: '/images/integrations/zapier.svg', alt: 'Zapier Logo' },
];

function LogoCarousel() {
    return (
        <div className="relative w-full overflow-hidden">
            <div className="flex animate-infinite-scroll">
                {Array.from({ length: 4 }, (_, set) => (
                    <div key={set} className="flex shrink-0">
                        {logos.map((logo, index) => (
                            <div
                                key={`${set}-${index}`}
                                className="w-[120px] flex items-center justify-center px-8 shrink-0"
                            >
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        width={32}
                                        height={32}
                                        className="max-w-8 max-h-8 w-auto h-auto opacity-40 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-300 object-contain"
                                    />
                                </div>
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
                    <p className="text-zinc-600">Seamlessly integrate with your favorite tools</p>
                </div>

                <div className="relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l to-transparent z-10"></div>

                    {/* Logo Carousel */}
                    <LogoCarousel />
                </div>
            </div>
        </section>
    );
}
