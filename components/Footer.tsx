import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-zinc-800 bg-black text-white mt-24 mx-2 md:mx-4 rounded-t-2xl">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Product Links */}
                    <div className="space-y-4">
                        <div className="text-sm font-medium">Product</div>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/#deal-intelligence"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Deal Intelligence
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#relationship-intelligence"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Relationship Intelligence
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#market-intelligence"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Market Intelligence
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#competitive-intelligence"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                                >
                                    Competitive Intelligence
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Right Column: Subsignal and Legal */}
                    <div className="space-y-8">
                        {/* Subsignal Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Subsignal</div>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/blog"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/#integrations"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Integrations
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Legal</div>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/privacy"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/terms"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="mailto:hey@subsignal.app"
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/* Extended Footer with Logo */}
            <div className="py-2 md:py-4 pb-0 overflow-hidden -mt-16 sm:-mt-48 md:-mt-72">
                <div className="w-full">
                    <div className="flex justify-center transform translate-y-1/2">
                        {'SUBSIGNAL'.split('').map((char, index) => (
                            <span
                                key={index}
                                className="text-[6rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] font-bold tracking-tighter text-white inline-block"
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
