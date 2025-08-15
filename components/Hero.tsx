import Image from 'next/image';

export default function Hero() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-40 space-y-8 md:space-y-12 relative">
            <div className="text-center max-w-5xl mx-auto">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-lora">
                    <span className="block">Never Miss a Market Move</span>
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl mb-8 mt-6 max-w-4xl mx-auto text-gray-600 font-lora">
                    AI agents that monitor your companies - so you don&apos;t have to
                </p>
            </div>

            {/* TODO: Add cover video */}
            {/* <VideoPlayer /> */}

            {/* Temporary cover image */}
            <div className="w-full max-w-4xl mx-auto">
                <Image
                    src="/cover.png"
                    alt="Subsignal Cover"
                    width={1200}
                    height={600}
                    className="rounded-lg shadow-lg w-full h-auto"
                    priority
                />
            </div>
        </main>
    );
}
