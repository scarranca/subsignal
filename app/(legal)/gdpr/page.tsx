import Link from 'next/link';
import Footer from '@/components/home/footer';

export default function GDPR() {
    return (
        <>
            <article className="legal mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10">
                <section className="flex flex-col gap-4">
                    <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
                        <span className="relative">
                            <span className="relative z-10 text-black">GDPR</span>
                            <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-purple-200 py-6 md:py-8" />
                        </span>{' '}
                        Policy
                    </h1>
                    <p className="text-center max-w-2xl mx-auto mt-6 md:text-lg">
                        The General Data Protection Regulation (GDPR) is a privacy law in the
                        European Union (EU) that grants EU citizens and residents the right to
                        access and control their personal data.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">Company Information</h2>
                    <p>
                        Subsignal is committed to protecting your personal data and respecting your
                        privacy rights under GDPR as we provide competitive intelligence and market
                        monitoring services.
                    </p>
                    <div className="flex flex-col gap-1">
                        <div>
                            <strong>Service Provider</strong>: Subsignal
                        </div>
                        <div>
                            <strong>Contact</strong>: privacy@subsignal.vc
                        </div>
                        <div>
                            <strong>Data Protection Officer</strong>: dpo@subsignal.vc
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">Is Subsignal GDPR compliant?</h2>
                    <p>
                        Yes. Subsignal is designed with GDPR compliance in mind and we fully comply
                        with the GDPR framework for all our competitive intelligence and market
                        monitoring services.
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            Our Privacy Policy explains what data we collect during market
                            monitoring, how long we retain it, how it may be transferred, and your
                            data protection rights.
                        </li>
                        <li>
                            All user data and business intelligence collected through Subsignal is
                            encrypted both in transit and at rest, and securely stored.
                        </li>
                        <li>
                            You have full control over your account data, monitoring preferences,
                            and any personal information you provide to our platform.
                        </li>
                        <li>
                            We offer a comprehensive Data Processing Agreement (DPA) for business
                            users that covers our role as a data processor for your market
                            intelligence needs.
                        </li>
                        <li>
                            We implement data minimization principles, collecting only the
                            information necessary to provide effective competitive intelligence
                            services.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">
                        Do you have a Data Processing Agreement?
                    </h2>
                    <p>
                        By creating a Subsignal account and accepting our Terms and Conditions,
                        business users also agree to the terms of our Data Processing Agreement
                        (DPA). Our DPA specifically addresses the processing of personal data in the
                        context of competitive intelligence and market monitoring services. Please
                        see our{' '}
                        <Link className="text-blue-500 underline" href="/dpa">
                            DPA page
                        </Link>{' '}
                        for more details.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">What happens with monitored data?</h2>
                    <p>
                        Subsignal provides competitive intelligence and market monitoring services,
                        but you remain in control of your account data and monitoring preferences.
                        You are the data controller for the information you input and configure.
                        Subsignal acts as the data processor, collecting and analyzing market data
                        on your behalf.
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            As long as your account remains active, you retain full control over
                            your monitoring settings, tracked companies, and personal account data.
                        </li>
                        <li>
                            You can modify, delete, or export your account data and monitoring
                            configurations at any time through your dashboard.
                        </li>
                        <li>
                            We respect all deletion requests. Any personal data you request to be
                            deleted is permanently removed from our systems within 30 days.
                        </li>
                        <li>
                            Market intelligence data collected from public sources may be retained
                            for analytical purposes but is anonymized to prevent identification of
                            individual users.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">
                        How Subsignal processes market intelligence data
                    </h2>
                    <p>
                        Our platform collects publicly available business information to provide
                        competitive intelligence services. This process is designed to respect
                        privacy while delivering valuable market insights.
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            We collect data from publicly available sources such as company
                            websites, press releases, regulatory filings, and news articles.
                        </li>
                        <li>
                            Personal information that may be contained in public business data (such
                            as executive names) is processed only for legitimate business
                            intelligence purposes and is not used for direct marketing.
                        </li>
                        <li>
                            We implement automated systems to minimize the collection of unnecessary
                            personal data while maintaining the effectiveness of our monitoring
                            services.
                        </li>
                        <li>
                            Any personal data collected during market monitoring is processed under
                            the lawful basis of legitimate interests for providing business
                            intelligence services.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">
                        How Subsignal uses your personal data
                    </h2>
                    <p>
                        Subsignal acts as a data controller for the personal information you provide
                        to us in order to use our competitive intelligence platform (such as
                        registration details and monitoring preferences).
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            We do not sell personal data to third parties, nor do we use it for
                            marketing or advertising purposes without your explicit consent.
                        </li>
                        <li>
                            We only share your information with trusted service providers who assist
                            us in operating Subsignal&apos;s infrastructure, and these providers are
                            required to comply with the GDPR framework.
                        </li>
                        <li>
                            Your account data is used solely to provide you with personalized market
                            intelligence and competitive monitoring services.
                        </li>
                        <li>
                            We may use aggregated, anonymized usage data to improve our platform and
                            develop new features for competitive intelligence.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">
                        Data retention and international transfers
                    </h2>
                    <p>
                        We maintain clear policies on how long we retain different types of data and
                        how we handle international data transfers.
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            Account data is retained for as long as your account remains active and
                            for a reasonable period after account deletion to comply with legal
                            obligations.
                        </li>
                        <li>
                            Market intelligence data from public sources may be retained longer for
                            historical trend analysis but is anonymized to protect individual
                            privacy.
                        </li>
                        <li>
                            When transferring data outside the EEA, we use appropriate safeguards
                            such as Standard Contractual Clauses (SCCs) or adequacy decisions.
                        </li>
                        <li>
                            We provide transparency about our subprocessors and international data
                            transfer mechanisms in our Data Processing Agreement.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">Your GDPR Rights</h2>
                    <p>Under GDPR, you have the following rights regarding your personal data:</p>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            <strong>Right to access</strong> your personal data and understand how
                            it&apos;s processed
                        </li>
                        <li>
                            <strong>Right to rectify</strong> inaccurate personal data
                        </li>
                        <li>
                            <strong>Right to erasure</strong> of your personal data (&ldquo;right to
                            be forgotten&rdquo;)
                        </li>
                        <li>
                            <strong>Right to restrict processing</strong> in certain circumstances
                        </li>
                        <li>
                            <strong>Right to data portability</strong> to move your data to another
                            service
                        </li>
                        <li>
                            <strong>Right to object</strong> to processing based on legitimate
                            interests
                        </li>
                        <li>
                            <strong>Right to withdraw consent</strong> where processing is based on
                            consent
                        </li>
                        <li>
                            <strong>Rights related to automated decision-making</strong> and
                            profiling
                        </li>
                    </ul>
                    <p className="mt-4">
                        To exercise any of these rights or if you have questions about how your data
                        is processed in our competitive intelligence platform, please contact us at
                        privacy@subsignal.vc
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">Contacting Us About Data Privacy</h2>
                    <p>
                        If you have any questions about how we collect, use, or protect your
                        personal data in connection with our market monitoring services, you can
                        contact our Data Protection team:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                        <div className="flex flex-col gap-1">
                            <div>
                                <strong>General Privacy Inquiries:</strong> privacy@subsignal.vc
                            </div>
                            <div>
                                <strong>Data Protection Officer:</strong> dpo@subsignal.vc
                            </div>
                            <div>
                                <strong>Data Subject Rights Requests:</strong> privacy@subsignal.vc
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                We aim to respond to all inquiries within 72 hours and complete data
                                subject rights requests within 30 days as required by GDPR.
                            </div>
                        </div>
                    </div>
                    <p className="mt-4">
                        If you are not satisfied with our response to your privacy concerns, you
                        have the right to lodge a complaint with your local data protection
                        authority in the EU.
                    </p>
                </section>
            </article>
            <Footer />
        </>
    );
}
