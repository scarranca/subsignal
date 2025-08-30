import Link from 'next/link';
import React from 'react';

const productLinks = [
    { href: '/get-started', label: 'Deal Intelligence' },
    { href: '/get-started', label: 'Relationship Intelligence' },
    { href: '/get-started', label: 'Market Intelligence' },
    { href: '/get-started', label: 'Competitive Intelligence' },
];

const subsignalLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/#integrations', label: 'Integrations' },
];

const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy', isExternal: false },
    { href: '/terms', label: 'Terms of Service', isExternal: false },
    { href: 'mailto:hey@subsignal.app', label: 'Contact', isExternal: true },
];

const page = () => {
    return (
        <footer className="border-t border-zinc-800 bg-black text-white mt-24 mx-2 md:mx-4 rounded-t-2xl relative overflow-hidden h-fit">
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 h-fit">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    {/* Product Links */}
                    <div className="space-y-4">
                        <div className="text-sm font-medium">Product</div>
                        <ul className="space-y-3">
                            {productLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Column: Subsignal and Legal */}
                    <div className="space-y-8">
                        {/* Subsignal Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Subsignal</div>
                            <ul className="space-y-3">
                                {subsignalLinks.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Legal Links */}
                        <div className="space-y-4">
                            <div className="text-sm font-medium">Legal</div>
                            <ul className="space-y-3">
                                {legalLinks.map((link) => (
                                    <li key={link.label}>
                                        {link.isExternal ? (
                                            <a
                                                href={link.href}
                                                className="text-sm text-zinc-400 hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="text-sm text-zinc-400 hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {/* Balanced "cut-off" logo effect */}
            <div className="relative w-full overflow-hidden h-[60px] sm:h-[100px] lg:h-[180px] px-4">
                <div
                    className="flex justify-center whitespace-nowrap absolute left-0 right-0 w-full"
                    aria-hidden="true"
                    style={{ bottom: '0', transform: 'translateY(48%)' }}
                >
                    {'SUBSIGNAL'.split('').map((char, index) => (
                        <span
                            key={index}
                            className="
                font-bold
                select-none
                bg-gradient-to-r
                from-zinc-400
                to-white
                bg-clip-text
                text-transparent
                inline-block
                leading-none
                text-[4.5rem]
                sm:text-[6.5rem]
                md:text-[10rem]
                lg:text-[12rem]
                xl:text-[16rem]
                2xl:text-[18rem]
              "
                            style={{ lineHeight: 1 }}
                        >
                            {char}
                        </span>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default page;
