import Link from 'next/link';

export default function Terms() {
    return (
        <article className="legal flex flex-col gap-12">
            <section className="flex flex-col gap-4">
                <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
                    <span className="relative">
                        <span className="relative z-10 text-black">Terms</span>
                        <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-green-200 py-6 md:py-8" />
                    </span>{' '}
                    of Service
                </h1>
                <div className="text-center text-muted-foreground text-sm mt-4">
                    Last updated: January 1, 2025
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Subsignal&apos;s competitive intelligence and market
                    monitoring platform, you agree to be bound by these terms of service and all
                    applicable laws and regulations. If you do not agree with any of these terms,
                    you are prohibited from using or accessing this service.
                </p>
                <p>
                    These terms constitute a legally binding contract between you and Subsignal
                    Labs. By using our services, you represent that you have the legal authority to
                    enter into this agreement on behalf of yourself or your organization.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">2. Description of Service</h2>
                <p>
                    Subsignal is a competitive intelligence and market monitoring platform that
                    provides:
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>Market intelligence and competitive analysis</li>
                    <li>Deal flow monitoring and tracking</li>
                    <li>Company and industry monitoring services</li>
                    <li>Business intelligence reports and insights</li>
                    <li>Automated data collection from publicly available sources</li>
                </ul>
                <p>
                    We reserve the right to modify, enhance, or discontinue any aspect of the
                    service at any time with reasonable advance notice for material changes.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">3. License and Access Rights</h2>
                <p>
                    Subject to your compliance with these terms and payment of applicable fees, we
                    grant you a limited, non-exclusive, non-transferable license to access and use
                    our competitive intelligence platform for your internal business purposes.
                </p>
                <p>
                    This license includes access to competitive intelligence reports, market
                    analysis, and business monitoring data. All rights not expressly granted are
                    reserved by Subsignal.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">4. User Responsibilities</h2>
                <p>As a user of Subsignal, you agree to:</p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>
                        Use the service in compliance with all applicable laws and regulations,
                        including data protection and competition laws
                    </li>
                    <li>Use competitive intelligence data for legitimate business purposes only</li>
                    <li>
                        Independently verify critical information before making business decisions
                    </li>
                    <li>Maintain the security and confidentiality of your account credentials</li>
                    <li>Respect intellectual property rights and third-party rights</li>
                    <li>
                        Ensure your use of our services complies with applicable legal requirements
                        in your jurisdiction
                    </li>
                </ul>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">5. Prohibited Uses</h2>
                <p>You may not use Subsignal for:</p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>
                        Reverse engineering, decompiling, or attempting to derive our source code or
                        algorithms
                    </li>
                    <li>
                        Gaining unauthorized access to our systems, networks, or other users&apos;
                        accounts
                    </li>
                    <li>Introducing malware, viruses, or other harmful technological material</li>
                    <li>
                        Using automated means to access our services without express written
                        permission
                    </li>
                    <li>Violating any applicable laws, regulations, or third-party rights</li>
                    <li>
                        Harassing, threatening, or causing harm to individuals referenced in
                        intelligence reports
                    </li>
                    <li>Circumventing rate limiting, access controls, or usage restrictions</li>
                    <li>
                        Distributing non-public features or information to unauthorized third
                        parties
                    </li>
                </ul>
                <p>
                    We reserve the right to suspend or terminate access for any suspected violation
                    of these prohibited conduct provisions.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">6. Competitive Intelligence Services</h2>
                <p>
                    Our services include competitive intelligence, market monitoring, and business
                    analysis capabilities that process information from publicly available sources
                    and third-party data providers.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-4">
                    <p className="text-sm">
                        <strong>Important:</strong> Information provided through our platform is for
                        business intelligence purposes and should be independently verified before
                        making critical business decisions. We do not guarantee the accuracy,
                        completeness, or currency of all third-party information.
                    </p>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">7. Subscription and Payment Terms</h2>
                <p>
                    In consideration for our services, you agree to pay the subscription fees
                    specified on our website or in your order form. Key payment terms include:
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>
                        All fees are exclusive of applicable taxes, which are your responsibility
                    </li>
                    <li>Subscriptions automatically renew for successive terms unless cancelled</li>
                    <li>
                        You may cancel auto-renewal by providing written notice before the renewal
                        date
                    </li>
                    <li>We may modify pricing with thirty (30) days&apos; advance notice</li>
                    <li>
                        All fees are non-refundable except as expressly provided or required by law
                    </li>
                    <li>Payment is due within fifteen (15) days of invoice date</li>
                </ul>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">8. Privacy and Data Protection</h2>
                <p>
                    Your privacy is important to us. Please review our{' '}
                    <Link className="text-blue-500 underline" href="/privacy">
                        Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link className="text-blue-500 underline" href="/dpa">
                        Data Processing Agreement
                    </Link>{' '}
                    to understand how we collect, use, and protect your information.
                </p>
                <p>
                    We implement commercially reasonable technical and organizational safeguards to
                    protect your data, though no method of transmission or storage is completely
                    secure.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">9. Service Availability and Support</h2>
                <p>
                    While we strive to maintain high availability, Subsignal is provided on an
                    &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee
                    uninterrupted service and may perform maintenance that temporarily affects
                    availability.
                </p>
                <p>
                    We will use commercially reasonable efforts to provide advance notice of
                    material changes that may adversely affect your use of our services.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">10. Intellectual Property</h2>
                <p>
                    All intellectual property rights in the Subsignal platform, including software,
                    algorithms, reports, and analyses, are owned by Subsignal Labs or our licensors.
                    You retain ownership of any data you provide to us, subject to our rights to
                    process such data as described in our Privacy Policy.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">11. Disclaimers and Warranties</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">IMPORTANT DISCLAIMERS:</p>
                    <ul className="flex list-disc flex-col gap-1 pl-6 text-sm">
                        <li>
                            <strong>Services &ldquo;As Is&rdquo;:</strong> Our services, including
                            all competitive intelligence reports and market analysis, are provided
                            &ldquo;as is&rdquo; without warranties of any kind.
                        </li>
                        <li>
                            <strong>No Accuracy Guarantee:</strong> We do not warrant the accuracy,
                            reliability, or completeness of competitive intelligence data or
                            third-party information.
                        </li>
                        <li>
                            <strong>Third-Party Data:</strong> Information from third-party sources
                            and automated collection processes may contain inherent limitations and
                            uncertainties.
                        </li>
                        <li>
                            <strong>Business Decisions:</strong> You acknowledge that competitive
                            intelligence involves inherent limitations and should not be the sole
                            basis for business decisions.
                        </li>
                    </ul>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">12. Limitation of Liability</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="font-semibold mb-2">LIABILITY LIMITATIONS:</p>
                    <ul className="flex list-disc flex-col gap-1 pl-6 text-sm">
                        <li>
                            We shall not be liable for indirect, incidental, consequential, special,
                            or punitive damages, including lost profits, business interruption, or
                            competitive disadvantage.
                        </li>
                        <li>
                            Our total liability shall not exceed the amount paid by you during the
                            twelve (12) months immediately preceding the event giving rise to the
                            claim.
                        </li>
                        <li>
                            We disclaim liability for business decisions made based on competitive
                            intelligence data provided through our platform.
                        </li>
                    </ul>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">13. Indemnification</h2>
                <p>
                    You agree to defend, indemnify, and hold us harmless from claims arising from:
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>Your use of our services in violation of these terms</li>
                    <li>Your violation of applicable laws or regulations</li>
                    <li>
                        Any negligent acts, omissions, or willful misconduct by you or your users
                    </li>
                    <li>Claims that your data infringes third-party rights</li>
                </ul>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">14. Term and Termination</h2>
                <p>This agreement continues until terminated. Either party may terminate:</p>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>
                        Immediately upon material breach that remains uncured after 30 days&apos;
                        notice
                    </li>
                    <li>Immediately upon insolvency or similar financial distress</li>
                    <li>You may terminate for convenience with 30 days&apos; written notice</li>
                    <li>
                        We may suspend access immediately for non-payment after 15 days&apos; notice
                    </li>
                </ul>
                <p>
                    Upon termination, all rights and licenses cease, and you must discontinue use of
                    our services. Payment obligations and limitation of liability provisions survive
                    termination.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">15. Changes to Terms</h2>
                <p>
                    We may modify these terms at any time. Material modifications will be effective
                    thirty (30) days after notice, while non-material modifications are effective
                    immediately upon posting. Your continued use constitutes acceptance of modified
                    terms.
                </p>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">16. General Provisions</h2>
                <ul className="flex list-disc flex-col gap-1 pl-6">
                    <li>This agreement constitutes the entire agreement between the parties</li>
                    <li>No amendment is effective unless in writing and signed by both parties</li>
                    <li>If any provision is invalid, the remainder remains in full force</li>
                    <li>You may not assign this agreement without our written consent</li>
                    <li>We may assign this agreement in connection with business transactions</li>
                </ul>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="font-semibold text-2xl">17. Contact Information</h2>
                <p>
                    If you have any questions about these Terms of Service or need to provide legal
                    notices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                    <div className="flex flex-col gap-1">
                        <div>
                            <strong>General Contact:</strong> nick@subsignal.vc
                        </div>
                        <div>
                            <strong>Legal Notices:</strong> nick@subsignal.vc
                        </div>
                        <div>
                            <strong>Website:</strong> https://subsignal.app
                        </div>
                    </div>
                </div>
                <p className="mt-4">
                    All notices must be in writing and sent to the email address associated with
                    your account or the contact information provided above.
                </p>
            </section>
        </article>
    );
}
