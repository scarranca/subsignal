import Footer from '@/components/home/footer';

export default function DPA() {
    return (
        <>
            <article className="legal mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10">
                <section className="flex flex-col gap-4">
                    <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
                        Data Processing{' '}
                        <span className="relative">
                            <span className="relative z-10 text-black">Agreement</span>
                            <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-blue-200 py-6 md:py-8" />
                        </span>
                    </h1>
                    <div className="text-center text-muted-foreground text-sm mt-4">
                        Last updated: September 23, 2025
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">1. Introduction</h2>
                    <p>
                        This Data Processing Agreement (&ldquo;DPA&rdquo;) is part of the Terms of
                        Service (&ldquo;Principal Agreement&rdquo;) between Subsignal
                        (&ldquo;Processor&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                        &ldquo;our&rdquo;) and you (&ldquo;Controller&rdquo;,
                        &ldquo;Customer&rdquo;, &ldquo;you&rdquo;).
                    </p>
                    <p>
                        This DPA sets out the terms for the processing of Personal Data in
                        accordance with applicable Data Protection Laws, including the General Data
                        Protection Regulation (EU) 2016/679 (&ldquo;GDPR&rdquo;), the California
                        Consumer Privacy Act (&ldquo;CCPA&rdquo;), and other applicable privacy
                        laws.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">2. Definitions</h2>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            <b>Personal Data</b>: Any information relating to an identified or
                            identifiable natural person, including but not limited to email
                            addresses, names, company affiliations, and usage data.
                        </li>
                        <li>
                            <b>Processing</b>: Any operation performed on Personal Data, such as
                            collection, storage, use, analysis, transfer, or deletion.
                        </li>
                        <li>
                            <b>Data Controller</b>: The entity that determines the purposes and
                            means of Processing Personal Data.
                        </li>
                        <li>
                            <b>Data Processor</b>: The entity that processes Personal Data on behalf
                            of the Data Controller.
                        </li>
                        <li>
                            <b>Subprocessor</b>: Any third party appointed by the Processor to
                            assist with Processing activities.
                        </li>
                        <li>
                            <b>Market Intelligence Data</b>: Publicly available company information,
                            market data, and business intelligence collected from external sources.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">3. Scope and Roles</h2>
                    <p>
                        You, as the Customer, are the Data Controller of any Personal Data processed
                        through Subsignal&apos;s competitive intelligence and market monitoring
                        platform. Subsignal acts as the Data Processor, processing Personal Data on
                        your behalf solely to provide our market intelligence, deal flow monitoring,
                        and competitive analysis services.
                    </p>
                    <p>
                        This DPA applies to Personal Data processed in connection with your use of
                        Subsignal&apos;s platform, including user account information, company
                        tracking preferences, and any personal information contained within
                        monitored data sources.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">4. Processing of Personal Data</h2>
                    <h3 className="font-semibold text-lg">4.1 Processing Instructions</h3>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            We process Personal Data only on your documented instructions, unless
                            required by law to act otherwise.
                        </li>
                        <li>
                            Processing is limited to activities necessary for providing market
                            intelligence, competitive monitoring, deal flow tracking, and related
                            analytics services.
                        </li>
                        <li>
                            We do not use Personal Data for our own business purposes beyond
                            providing the contracted services.
                        </li>
                    </ul>

                    <h3 className="font-semibold text-lg mt-6">4.2 Security and Confidentiality</h3>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            Persons authorized to process Personal Data are bound by confidentiality
                            obligations.
                        </li>
                        <li>
                            We implement appropriate technical and organizational measures to ensure
                            a level of security appropriate to the risk, including encryption of
                            data in transit and at rest.
                        </li>
                        <li>
                            Access to Personal Data is restricted to personnel who require such
                            access for the performance of their duties.
                        </li>
                    </ul>

                    <h3 className="font-semibold text-lg mt-6">4.3 Data Subject Rights Support</h3>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            We assist you, as far as possible, in fulfilling your obligations to
                            respond to Data Subject requests for access, rectification, erasure,
                            portability, and restriction of processing.
                        </li>
                        <li>
                            We provide reasonable assistance in ensuring compliance with security,
                            breach notifications, data protection impact assessments, and
                            consultations with supervisory authorities.
                        </li>
                    </ul>

                    <h3 className="font-semibold text-lg mt-6">4.4 Data Retention and Deletion</h3>
                    <ul className="flex list-disc flex-col gap-1 pl-6">
                        <li>
                            Personal Data is retained only for as long as necessary to fulfill the
                            purposes for which it was collected or as required by law.
                        </li>
                        <li>
                            Upon termination of services, at your choice, we will delete or return
                            all Personal Data within 30 days, unless otherwise required by law.
                        </li>
                        <li>
                            Market intelligence data derived from public sources may be retained for
                            historical analysis purposes, with any Personal Data elements
                            anonymized.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">5. Subprocessors</h2>
                    <p>
                        Subsignal may engage Subprocessors to process Personal Data on your behalf,
                        including cloud infrastructure providers, data analytics services, and email
                        delivery platforms. We maintain a current list of Subprocessors and will
                        notify Customers of any material changes as required by applicable Data
                        Protection Laws.
                    </p>
                    <p>
                        All Subprocessors are bound by data protection obligations equivalent to
                        those set out in this DPA. We remain fully liable for the acts and omissions
                        of our Subprocessors.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">6. International Data Transfers</h2>
                    <p>
                        When transferring Personal Data outside the European Economic Area (EEA),
                        United Kingdom, or other jurisdictions with data localization requirements,
                        Subsignal ensures such transfers comply with applicable Data Protection
                        Laws.
                    </p>
                    <p>
                        We rely on appropriate safeguards such as Standard Contractual Clauses
                        (SCCs), adequacy decisions, or other legally recognized transfer mechanisms
                        for international data transfers. Details of specific transfer mechanisms
                        are available upon request.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">7. Data Subject Rights</h2>
                    <p>
                        We assist you, to the extent reasonably possible, in fulfilling your
                        obligations to respond to requests by Data Subjects to exercise their rights
                        under applicable Data Protection Laws, including:
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6 mt-2">
                        <li>Right of access to Personal Data</li>
                        <li>Right to rectification of inaccurate Personal Data</li>
                        <li>Right to erasure (&ldquo;right to be forgotten&rdquo;)</li>
                        <li>Right to restrict processing</li>
                        <li>Right to data portability</li>
                        <li>Right to object to processing</li>
                        <li>Rights related to automated decision-making and profiling</li>
                    </ul>
                    <p className="mt-2">
                        For Data Subject requests, please contact us at the information provided in
                        Section 11 below.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">8. Security Measures</h2>
                    <p>
                        Subsignal implements and maintains appropriate technical and organizational
                        security measures to protect Personal Data against accidental or unlawful
                        destruction, loss, alteration, unauthorized disclosure, or access,
                        including:
                    </p>
                    <ul className="flex list-disc flex-col gap-1 pl-6 mt-2">
                        <li>Encryption of data in transit and at rest</li>
                        <li>Regular security assessments and vulnerability testing</li>
                        <li>Access controls and authentication mechanisms</li>
                        <li>Employee training on data protection and security</li>
                        <li>Incident response and business continuity procedures</li>
                        <li>Regular backup and recovery processes</li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">9. Personal Data Breach</h2>
                    <p>
                        In the event of a Personal Data breach affecting your Personal Data,
                        Subsignal will notify you without undue delay and no later than 72 hours
                        after becoming aware of the breach. We will provide all necessary
                        information to enable you to comply with your breach notification
                        obligations under applicable Data Protection Laws.
                    </p>
                    <p>
                        Breach notifications will include details of the nature of the breach,
                        categories and approximate number of Data Subjects affected, likely
                        consequences, and measures taken or proposed to address the breach.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">
                        10. Data Protection Impact Assessments
                    </h2>
                    <p>
                        Where required by applicable Data Protection Laws, we will provide
                        reasonable assistance in conducting Data Protection Impact Assessments
                        (DPIAs) related to our processing of Personal Data, including providing
                        information about our processing activities and security measures.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">11. Termination</h2>
                    <p>
                        Upon termination of the Principal Agreement, you may request deletion of
                        your Personal Data processed by Subsignal. We will comply with such a
                        request within 30 days unless otherwise required to retain the data under
                        applicable law.
                    </p>
                    <p>
                        Market intelligence data that has been anonymized or aggregated in a way
                        that prevents re-identification may be retained for analytical and service
                        improvement purposes.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">12. Audits and Records</h2>
                    <p>
                        Subsignal maintains records of all processing activities carried out on
                        behalf of Controllers. We will make available to you all information
                        necessary to demonstrate compliance with this DPA and allow for and
                        contribute to audits, including inspections, conducted by you or an auditor
                        mandated by you.
                    </p>
                    <p>
                        Any such audits will be conducted during regular business hours, with
                        reasonable advance notice, and at your expense unless a breach of this DPA
                        is identified.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold text-2xl">13. Contact Information</h2>
                    <p>
                        For questions regarding this DPA or to exercise Data Subject rights, please
                        contact us at:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                        <p>
                            <strong>Email:</strong> privacy@subsignal.app
                        </p>
                        <p>
                            <strong>Data Protection Officer:</strong> dpo@subsignal.app
                        </p>
                        <p>
                            <strong>Address:</strong> [Your Company Address]
                        </p>
                    </div>
                    <p className="mt-4">
                        By using Subsignal&apos;s market intelligence platform, you agree to this
                        Data Processing Agreement and acknowledge that it forms part of our Terms of
                        Service.
                    </p>
                </section>
            </article>
            <Footer />
        </>
    );
}
