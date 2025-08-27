import { CONTACT_EMAIL, WEBSITE_URL } from '@/constants/contact';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

                <div className="prose prose-lg max-w-none">
                    <p className="text-xl mb-8">
                        Subsignal Labs endeavors to implement commercially reasonable measures
                        designed to maintain appropriate standards of privacy and security, subject
                        to operational constraints and technical limitations inherent in digital
                        services.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Terms of Service</h2>
                    <p>
                        These Terms of Service (collectively, the &ldquo;Agreement&rdquo;)
                        constitute a legally binding contract governing your access to and use of
                        the website and the Subsignal Platform (as defined herein) operated by
                        Subsignal Labs, a company organized under applicable law
                        (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
                        &ldquo;our&rdquo;). By accessing, browsing, or otherwise using any portion
                        of our services, whether as an individual (&ldquo;User&rdquo;) or on behalf
                        of any entity (&ldquo;Customer&rdquo;), you acknowledge that you have read,
                        understood, and agree to be bound by this Agreement in its entirety, and you
                        represent and warrant that you have the legal authority to enter into this
                        Agreement on behalf of yourself and, if applicable, such entity.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Definitions</h2>
                    <p>
                        For purposes of this Agreement, the following terms shall have the meanings
                        set forth below. Capitalized terms not otherwise defined herein shall have
                        their commonly understood meaning in the relevant industry context.
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>
                            &ldquo;Customer Data&rdquo; means any and all data, content, materials,
                            or information, including without limitation Personal Information, that
                            Customer or its Users transmit, upload, post, or otherwise make
                            available to or through the Services, regardless of format or medium.
                        </li>
                        <li>
                            &ldquo;Effective Date&rdquo; means the earlier of (i) the date of first
                            access to the Website or Services by User, or (ii) the date of execution
                            of any order form or subscription agreement referencing this Agreement.
                        </li>
                        <li>
                            &ldquo;Subsignal Platform&rdquo; or &ldquo;Platform&rdquo; means the
                            proprietary software-as-a-service platform and related technologies
                            operated by Company, as may be modified, updated, or enhanced from time
                            to time in Company&apos;s sole discretion.
                        </li>
                        <li>
                            &ldquo;Personal Information&rdquo; means information that identifies,
                            relates to, describes, or is reasonably capable of being associated with
                            a particular individual, as such term may be defined under applicable
                            Privacy Laws.
                        </li>
                        <li>
                            &ldquo;Privacy Laws&rdquo; means all applicable federal, state,
                            provincial, local, and international laws, regulations, and regulatory
                            guidance relating to data protection, privacy, and security, as may be
                            amended, modified, or superseded from time to time.
                        </li>
                        <li>
                            &ldquo;Services&rdquo; means the Platform, Website, and any related
                            services, features, content, or applications offered by Company,
                            including any updates, enhancements, or modifications thereto.
                        </li>
                        <li>
                            &ldquo;User&rdquo; means any individual authorized by Customer to access
                            and use the Services, or any individual accessing the Services with
                            Customer&apos;s knowledge or consent.
                        </li>
                        <li>
                            &ldquo;Website&rdquo; means the website located at {WEBSITE_URL} and any
                            associated subdomains, mobile applications, or other digital properties
                            operated by Company.
                        </li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Grant of Access and License Restrictions
                    </h2>
                    <p>
                        Subject to the terms and conditions of this Agreement and Customer&apos;s
                        compliance with all applicable payment obligations, Company hereby grants to
                        Customer during the Term a limited, non-exclusive, non-transferable,
                        non-sublicensable, revocable license to access and use the Services,
                        including competitive intelligence reports, market analysis, and business
                        monitoring data, solely for Customer&apos;s internal business purposes and
                        in accordance with the documentation provided by Company. This license is
                        contingent upon system availability and may be subject to usage limitations
                        as determined by Company in its sole discretion. Company reserves all rights
                        not expressly granted herein.
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3">
                        Competitive Intelligence Services
                    </h3>
                    <p>
                        The Services include competitive intelligence, market monitoring, and
                        business analysis capabilities that process information from publicly
                        available sources and third-party data providers. Customer acknowledges that
                        such information is provided for business intelligence purposes and should
                        be independently verified before making critical business decisions.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Prohibited Conduct</h2>
                    <p>
                        Customer acknowledges and agrees that Customer and its Users shall not, and
                        shall not attempt to or permit any third party to, engage in any of the
                        following activities (the &ldquo;Prohibited Conduct&rdquo;):
                    </p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>
                            Access, disclose, or distribute any non-public features, content, or
                            information to unauthorized third parties;
                        </li>
                        <li>
                            Reverse engineer, decompile, disassemble, or otherwise attempt to derive
                            the source code, algorithms, or structure of the Services;
                        </li>
                        <li>
                            Introduce any viruses, malware, trojans, worms, logic bombs, or other
                            malicious or technologically harmful material;
                        </li>
                        <li>
                            Gain or attempt to gain unauthorized access to the Services, other
                            users&apos; accounts, or Company&apos;s computer systems or networks;
                        </li>
                        <li>
                            Use the Services in any manner that could damage, disable, overburden,
                            or impair Company&apos;s servers or networks, or interfere with any
                            other party&apos;s use of the Services;
                        </li>
                        <li>
                            Violate any applicable laws, regulations, or third-party rights, or
                            engage in any unlawful, harmful, or objectionable conduct;
                        </li>
                        <li>
                            Use any automated means to access the Services without Company&apos;s
                            express written permission;
                        </li>
                        <li>
                            Use the Services for any purpose other than legitimate competitive
                            intelligence, market research, and business analysis activities;
                        </li>
                        <li>
                            Attempt to circumvent any rate limiting, access controls, or usage
                            restrictions implemented by Company;
                        </li>
                        <li>
                            Use the Services to harass, threaten, or cause harm to any individual or
                            entity referenced in competitive intelligence reports.
                        </li>
                    </ul>
                    <p>
                        Company reserves the right, in its sole discretion and without prior notice,
                        to suspend or terminate access to the Services for any suspected violation
                        of the Prohibited Conduct provisions.
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3">Customer Responsibilities</h3>
                    <p>
                        Customer shall use the Services in compliance with all applicable laws and
                        regulations, including but not limited to data protection laws, competition
                        laws, and regulations governing the collection and use of business
                        intelligence. Customer acknowledges that it is solely responsible for
                        ensuring that its use of competitive intelligence data complies with
                        applicable legal requirements in its jurisdiction and industry.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Service Fees, Payment Terms, and Subscription
                    </h2>
                    <p>
                        In consideration for the provision of Services, Customer shall pay Company
                        the fees specified on the Website or in the applicable order form for the
                        subscription term selected by Customer (&ldquo;Subscription Fees&rdquo;).
                        All fees are exclusive of applicable taxes, duties, and governmental
                        assessments, which shall be Customer&apos;s sole responsibility. Unless
                        terminated in accordance with this Agreement, Customer&apos;s subscription
                        shall automatically renew for successive renewal terms of equal duration
                        upon expiration, subject to Company&apos;s then-current fee structure.
                        Customer may cancel auto-renewal by providing written notice prior to the
                        applicable renewal date. Company reserves the right to modify pricing upon
                        thirty (30) days&apos; advance notice. All fees are non-refundable except as
                        expressly provided herein or required by law.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Data Handling and Privacy Compliance
                    </h2>
                    <p>
                        Company shall implement and maintain commercially reasonable technical,
                        organizational, and administrative safeguards designed to protect Customer
                        Data against unauthorized access, acquisition, destruction, use,
                        modification, or disclosure. Notwithstanding the foregoing, Customer
                        acknowledges that no method of transmission over the internet or electronic
                        storage is completely secure, and Company cannot guarantee absolute security
                        of Customer Data. Company&apos;s data handling practices shall be governed
                        by its Privacy Policy, as updated from time to time, which is incorporated
                        herein by reference. Customer represents and warrants that it has obtained
                        all necessary consents and authorizations required for Company&apos;s
                        processing of Customer Data in accordance with this Agreement.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Term, Termination, and Effect of Termination
                    </h2>
                    <p>
                        This Agreement shall commence on the Effective Date and continue until
                        terminated in accordance with its terms (&ldquo;Term&rdquo;). Either party
                        may terminate this Agreement: (i) immediately upon written notice if the
                        other party materially breaches this Agreement and fails to cure such breach
                        within thirty (30) days after receiving written notice thereof; (ii)
                        immediately upon written notice if the other party becomes insolvent, makes
                        an assignment for the benefit of creditors, or has a receiver appointed; or
                        (iii) Customer may terminate for convenience with thirty (30) days&apos;
                        written notice. Additionally, Company may suspend or terminate
                        Customer&apos;s access immediately if Customer fails to pay any undisputed
                        fees within fifteen (15) days after written notice of delinquency. Upon
                        termination, all rights and licenses granted hereunder shall immediately
                        cease, and Customer shall discontinue all use of the Services. Sections
                        relating to payment obligations, limitation of liability, indemnification,
                        and general provisions shall survive termination.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Disclaimer of Warranties and Limitation of Liability
                    </h2>
                    <p>
                        <strong>DISCLAIMER:</strong> THE SERVICES, INCLUDING ALL COMPETITIVE
                        INTELLIGENCE REPORTS, MARKET ANALYSIS, AND BUSINESS DATA, ARE PROVIDED ON AN
                        &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS. TO THE FULLEST
                        EXTENT PERMITTED BY APPLICABLE LAW, COMPANY DISCLAIMS ALL WARRANTIES,
                        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE,
                        QUIET ENJOYMENT, ACCURACY, COMPLETENESS, CURRENCY, AND ANY WARRANTIES
                        ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE. COMPANY DOES NOT WARRANT
                        THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE,
                        OR THAT ANY DEFECTS WILL BE CORRECTED. COMPANY MAKES NO REPRESENTATIONS OR
                        WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY
                        COMPETITIVE INTELLIGENCE DATA, MARKET ANALYSIS, OR THIRD-PARTY INFORMATION
                        PROVIDED THROUGH THE SERVICES.
                    </p>
                    <p>
                        <strong>LIMITATION OF LIABILITY:</strong> IN NO EVENT SHALL COMPANY BE
                        LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR
                        PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOST PROFITS,
                        LOST REVENUES, LOST DATA, BUSINESS INTERRUPTION, LOSS OF GOODWILL,
                        COMPETITIVE DISADVANTAGE, OR BUSINESS DECISIONS BASED ON COMPETITIVE
                        INTELLIGENCE DATA, WHETHER BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT
                        LIABILITY, OR OTHERWISE, EVEN IF COMPANY HAS BEEN ADVISED OF THE POSSIBILITY
                        OF SUCH DAMAGES. COMPANY&apos;S TOTAL LIABILITY ARISING OUT OF OR RELATING
                        TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY CUSTOMER TO
                        COMPANY DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING
                        RISE TO THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS OR
                        EXCLUSIONS OF LIABILITY, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3">
                        Third-Party Data Disclaimers
                    </h3>
                    <p>
                        The Services may include information obtained from third-party sources,
                        publicly available data, and automated data collection processes. Company
                        does not warrant the accuracy, completeness, or currency of such third-party
                        information and expressly disclaims any liability for decisions made based
                        on such data. Customer acknowledges that competitive intelligence involves
                        inherent limitations and uncertainties.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">Mutual Indemnification</h2>
                    <p>
                        Customer agrees to defend, indemnify, and hold harmless Company and its
                        officers, directors, employees, agents, and affiliates from and against any
                        and all claims, liabilities, damages, losses, costs, and expenses (including
                        reasonable attorneys&apos; fees) arising out of or relating to: (i)
                        Customer&apos;s use of the Services in violation of this Agreement; (ii)
                        Customer Data or any claim that Customer Data infringes, violates, or
                        misappropriates any third-party rights; (iii) Customer&apos;s violation of
                        applicable laws or regulations; or (iv) any negligent acts or omissions or
                        willful misconduct by Customer or its Users. Company agrees to defend,
                        indemnify, and hold harmless Customer from and against any third-party claim
                        that the Services, when used in accordance with this Agreement, infringe any
                        valid U.S. patent, copyright, or trademark, provided that Customer promptly
                        notifies Company of such claim and grants Company sole control over the
                        defense and settlement thereof.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Modification of Terms and Services
                    </h2>
                    <p>
                        Company reserves the right to modify, update, or revise this Agreement at
                        any time in its sole discretion by posting the modified terms on the Website
                        or providing notice through the Services. Material modifications shall be
                        effective thirty (30) days after posting or notice, while non-material
                        modifications shall be effective immediately upon posting. Customer&apos;s
                        continued use of the Services following any modification constitutes
                        acceptance of the modified Agreement. Company may also modify, suspend, or
                        discontinue any aspect of the Services at any time without prior notice,
                        provided that Company shall use commercially reasonable efforts to provide
                        advance notice of material changes that adversely affect Customer&apos;s use
                        of the Services.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">General Provisions</h2>
                    <p>
                        This Agreement constitutes the entire agreement between the parties with
                        respect to the subject matter hereof and supersedes all prior or
                        contemporaneous communications, agreements, and understandings, whether
                        written or oral. No amendment, modification, or waiver of any provision
                        shall be effective unless in writing and signed by both parties. If any
                        provision is deemed invalid or unenforceable, the remainder shall remain in
                        full force and effect. This Agreement shall be governed by and construed in
                        accordance with the laws of [Jurisdiction], without regard to conflict of
                        law principles. Any disputes arising hereunder shall be resolved exclusively
                        in the courts of [Jurisdiction], and each party consents to the personal
                        jurisdiction of such courts. Customer may not assign this Agreement without
                        Company&apos;s prior written consent, while Company may assign this
                        Agreement in its sole discretion, including in connection with any merger,
                        acquisition, or sale of assets.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">
                        Contact Information and Legal Notices
                    </h2>
                    <p>
                        All notices, requests, consents, claims, demands, waivers, and other
                        communications hereunder shall be in writing and addressed to the receiving
                        party at the address set forth below or such other address as the receiving
                        party may specify in writing. Questions, concerns, or notices regarding this
                        Agreement may be sent to Company at {CONTACT_EMAIL}. Legal notices to
                        Customer shall be sent to the email address associated with Customer&apos;s
                        account.
                    </p>

                    <div className="mt-8 pt-8 border-t">
                        <p className="text-sm text-gray-600">Last updated: January 1, 2025</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
