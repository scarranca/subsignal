import Image from 'next/image';

interface FeatureCardProps {
    image: string;
    imageAlt: string;
    title: string;
    description: string;
}

function FeatureCard({ image, imageAlt, title, description }: FeatureCardProps) {
    return (
        <div className="relative flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex-none px-6 pt-6">
                <div className="relative aspect-video">
                    <Image
                        src={image}
                        alt={imageAlt}
                        fill
                        className="object-cover object-left-top"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        draggable={false}
                    />

                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent"></div>
                </div>
            </div>
            <div className="flex-none px-6 pb-6">
                <h3 className="text-base font-medium leading-6 text-zinc-900 mb-2">{title}</h3>
                <p className="text-sm text-zinc-600 leading-5">{description}</p>
            </div>
        </div>
    );
}

const features = [
    {
        image: '/images/features/deployment-metrics.png',
        imageAlt: 'Market Intelligence',
        title: 'Market Intelligence',
        description:
            "Get a leg up with the sectors you\'re most interested in. Every change, no matter how small, gets flagged. Consider yourself briefed.",
    },
    {
        image: '/images/features/deployment-metrics.png',
        imageAlt: 'All Signal. No Noise.',
        title: 'Competitive Intelligence',
        description:
            "Track competitive threats to your portfolio companies. Whether it's roadmap updates, pricing shifts, or positioning plays, be the first to know.",
    },
    {
        image: '/images/features/pr-metrics.png',
        imageAlt: 'Deal Intelligence',
        title: 'Deal Intelligence',
        description:
            'Time your bets better. Track companies you passed on and re-engage when they hit key milestones. Turn comeback stories into portfolio wins.',
    },
    {
        image: '/images/features/incident-metrics.png',
        imageAlt: 'Relationship Intelligence',
        title: 'Relationship Intelligence',
        description:
            'Stay connected through pivots and false starts. Monitor passed opportunities for breakthrough moments. Be the investor they turn to.',
    },
];

export default function Features() {
    return (
        <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="features">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                    Catch Every Comeback Story
                    <br />
                    <span className="text-gray-500">Never Miss a Second Chance</span>
                </h2>
                <p className="text-lg text-gray-600">
                    Stay connected through pivots. Re-engage when timing is right
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </section>
    );
}
