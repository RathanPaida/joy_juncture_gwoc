//terms/page.tsx
// app/(public)/terms/page.tsx
import React from 'react';
import Link from 'next/link';
import { Scroll, Shield, Scale, AlertCircle, FileText, CheckCircle, Mail, MessageSquare } from 'lucide-react';

const TermsPage = () => {
    const lastUpdated = "January 18, 2026";

    const sections = [
        {
            title: "Online store terms",
            content: `By agreeing to these terms of service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.
You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the service, violate any laws in your jurisdiction (including but not limited to copyright laws).
You must not transmit any worms or viruses or any code of a destructive nature.
A breach or violation of any of the terms will result in an immediate termination of your services.`
        },
        {
            title: "General conditions",
            content: `We reserve the right to refuse service to anyone for any reason at any time.
You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to the technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.
You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the service, use of the service, or access to the service or any contact on the website through which the service is provided, without express written permission by us.
The headings used in this agreement are included for convenience only and will not limit or otherwise affect these terms.`
        },
        {
            title: "Accuracy, Completeness, and Timeliness of information",
            content: `We are not responsible if the information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete, or more timely sources of information. Any reliance on the material on this site is at your own risk.
This site may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site. You agree that it is your responsibility to monitor changes to our site.`
        },
        {
            title: "Modifications to the service and prices",
            content: `Prices for our products are subject to change without notice.
We reserve the right at any time to modify or discontinue the service (or any part or content thereof) without notice at any time.
We shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the service.`
        },
        {
            title: "Products or services (if applicable)",
            content: `Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our refund policy.
We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor's display of any color will be accurate.
We reserve the right, but are not obligated, to limit the sales of our products or services to any person, geographic region, or jurisdiction. We may exercise this right on a case-by-case basis. We reserve the right to limit the quantities of any products or services that we offer. All descriptions of products or product pricing are subject to change at any time without notice, at the sole discretion of us. We reserve the right to discontinue any product at any time. Any offer for any product or service made on this site is void where prohibited.
We do not warrant that the quality of any products, services, information, or other material purchased or obtained by you will meet your expectations, or that any errors in the service will be corrected.`
        },
        {
            title: "Accuracy of billing and account information",
            content: `We reserve the right to refuse any order you place with us. we may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, and/or orders that use the same billing and/or shipping address. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e‑mail and/or billing address/phone number provided at the time the order was made. we reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.

You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. You agree to promptly update your account and other information, including your email address, credit card numbers, and expiration dates, so that we can complete your transactions and contact you as needed.

For more details, please review our refund policy.`
        },
        {
            title: "Optional tools",
            content: `We may provide you with access to third-party tools over which we neither monitor nor have any control nor input.
You acknowledge and agree that we provide access to such tools ”as is” and “as available” without any warranties, representations, or conditions of any kind and without any endorsement. We shall have no liability whatsoever arising from or relating to your use of optional third-party tools.
Any use by you of the optional tools offered through the site is entirely at your own risk and discretion and you should ensure that you are familiar with and approve of the terms on which tools are provided by the relevant third-party provider(s).
We may also, in the future, offer new services and/or features through the website (including the release of new tools and resources). Such new features and/or services shall also be subject to these terms of service.`
        },
        {
            title: "Third-party links",
            content: `Certain content, products and services available via our service may include materials from third-parties.
Third-party links on this site may direct you to third-party websites that are not affiliated with us. We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability or responsibility for any third-party materials or websites, or for any other materials, products, or services of third-parties.
We are not liable for any harm or damages related to the purchase or use of goods, services, resources, content, or any other transactions made in connection with any third-party websites. Please review carefully the third-party's policies and practices and make sure you understand them before you engage in any transaction. complaints, claims, concerns, or questions regarding third-party products should be directed to the third-party.`
        },
        {
            title: "User comments, feedback and other submissions",
            content: `If, at our request, you send certain specific submissions (for example contest entries) or without a request from us, you send creative ideas, suggestions, proposals, plans, or other materials, whether online, by email, by postal mail, or otherwise (collectively, 'comments'), you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us. We are and shall be under no obligation (1) to maintain any comments in confidence; (2) to pay compensation for any comments; or (3) to respond to any comments.
We may, but have no obligation to, monitor, edit or remove content that we determine in our sole discretion to be unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene or otherwise objectionable or violates any party’s intellectual property or these terms of service.
You agree that your comments will not violate any right of any third-party, including copyright, trademark, privacy, personality or other personal or proprietary right. You further agree that your comments will not contain libelous or otherwise unlawful, abusive or obscene material, or contain any computer virus or other malware that could in any way affect the operation of the service or any related website. You may not use a false e‑mail address, pretend to be someone other than yourself, or otherwise mislead us or third-parties as to the origin of any comments. You are solely responsible for any comments you make and their accuracy. We take no responsibility and assume no liability for any comments posted by you or any third-party.`
        },
        {
            title: "Personal Information",
            content: `Your submission of personal information through the store is governed by our privacy policy.`
        },
        {
            title: "Errors, inaccuracies and omissions",
            content: `Occasionally there may be information on our site or in the service that contains typographical errors, inaccuracies or omissions that may relate to product descriptions, pricing, promotions, offers, product shipping charges, transit times and availability. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel orders if any information in the service or on any related website is inaccurate at any time without prior notice (including after you have submitted your order).
We undertake no obligation to update, amend or clarify information in the service or on any related website, including without limitation, pricing information, except as required by law. no specified update or refresh date applied in the service or on any related website, should be taken to indicate that all information in the service or on any related website has been modified or updated.`
        },
        {
            title: "Prohibited uses",
            content: `In addition to other prohibitions as set forth in the terms of service, you are prohibited from using the site or its content: (a) for any unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; (c) to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances; (d) to infringe upon or violate our intellectual property rights or the intellectual property rights of others; (e) to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability; (f) to submit false or misleading information; (g) to upload or transmit viruses or any other type of malicious code that will or may be used in any way that will affect the functionality or operation of the service or of any related website, other websites, or the internet; (h) to collect or track the personal information of others; (i) to spam, phish, pharm, pretext, spider, crawl, or scrape; (j) for any obscene or immoral purpose; or (k) to interfere with or circumvent the security features of the service or any related website, other websites, or the internet. We reserve the right to terminate your use of the service or any related website for violating any of the prohibited uses.`
        },
        {
            title: "Disclaimer of warranties; Limitation of liability",
            content: `We do not guarantee, represent or warrant that your use of our service will be uninterrupted, timely, secure or error-free.
We do not warrant that the results that may be obtained from the use of the service will be accurate or reliable.
You agree that from time to time we may remove the service for indefinite periods of time or cancel the service at any time, without notice to you.
You expressly agree that your use of, or inability to use, the service is at your sole risk. The service and all products and services delivered to you through the service are (except as expressly stated by us) provided 'as is' and 'as available' for your use, without any representation, warranties or conditions of any kind, either express or implied, including all implied warranties or conditions of merchantability, merchantable quality, fitness for a particular purpose, durability, title, and non-infringement.
In no case shall Joy Juncture, our partners, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from your use of any of the service or any products procured using the service, or for any other claim related in any way to your use of the service or any product, including, but not limited to, any errors or omissions in any content, or any loss or damage of any kind incurred as a result of the use of the service or any content (or product) posted, transmitted, or otherwise made available via the service, even if advised of their possibility. Because some states or jurisdictions do not allow the exclusion or the limitation of liability for consequential or incidental damages, in such states or jurisdictions, our liability shall be limited to the maximum extent permitted by law.`
        },
        {
            title: "Indemnification",
            content: `You agree to indemnify, defend and hold harmless Joy Juncture and affiliates, partners, officers, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, harmless from any claim or demand, including reasonable attorneys’ fees, made by any third-party due to or arising out of your breach of these terms of service or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.`
        },
        {
            title: "Severability",
            content: `In the event that any provision of these terms of service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these terms of service, such determination shall not affect the validity and enforceability of any other remaining provisions.`
        },
        {
            title: "Termination",
            content: `The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes.
These terms of service are effective unless and until terminated by either you or us. You may terminate these terms of service at any time by notifying us that you no longer wish to use our services, or when you cease using our site.
If in our sole judgment you fail, or we suspect that you have failed, to comply with any term or provision of these terms of service, we also may terminate this agreement at any time without notice and you will remain liable for all amounts due up to and including the date of termination; and/or accordingly may deny you access to our services (or any part thereof).`
        },
        {
            title: "Entire agreement",
            content: `The failure of us to exercise or enforce any right or provision of these terms of service shall not constitute a waiver of such right or provision.
These terms of service and any policies or operating rules posted by us on this site or in respect to the service constitutes the entire agreement and understanding between you and us and governs your use of the service, superseding any prior or contemporaneous agreements, communications and proposals, whether oral or written, between you and us (including, but not limited to, any prior versions of the terms of service).
Any ambiguities in the interpretation of these terms of service shall not be construed against the drafting party.`
        },
        {
            title: "Governing law",
            content: `These terms of service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of india.`
        },
        {
            title: "Changes to terms of service",
            content: `You can review the most current version of the terms of service at any time at this page.
We reserve the right, at our sole discretion, to update, change or replace any part of these terms of service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. Your continued use of or access to our website or the service following the posting of any changes to these terms of service constitutes acceptance of those changes.`
        }
    ];

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            <main className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 ring-1 ring-orange-500/20">
                        <Scale className="h-12 w-12 text-orange-500" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Terms & Conditions</h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        Please read these terms of service carefully before accessing or using our website. By using Joy Juncture, you agree to be bound by these terms.
                    </p>
                    <div className="mt-8 inline-flex items-center bg-neutral-900 border border-neutral-800 text-gray-400 px-5 py-2.5 rounded-full shadow-sm">
                        <span className="text-sm font-medium">Last Updated:</span>
                        <span className="ml-2 font-semibold text-orange-400">{lastUpdated}</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Navigation Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="sticky top-28 bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl shadow-black/20">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center border-b border-neutral-800 pb-4">
                                <Scroll className="h-5 w-5 mr-3 text-orange-500" />
                                Quick Navigation
                            </h2>
                            <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <a href="#intro" className="block text-sm font-medium text-gray-400 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-neutral-800/50 transition-all">
                                    Introduction
                                </a>
                                {sections.map((section, index) => (
                                    <a
                                        key={index}
                                        href={`#section-${index + 1}`}
                                        className="block text-sm font-medium text-gray-400 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-neutral-800/50 transition-all truncate"
                                    >
                                        {index + 1}. {section.title}
                                    </a>
                                ))}
                                <a href="#contact" className="block text-sm font-medium text-gray-400 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-neutral-800/50 transition-all">
                                    Contact Information
                                </a>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-3/4 space-y-8">
                        {/* Introduction Card */}
                        <div id="intro" className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10">
                            <div className="prose prose-invert prose-lg max-w-none text-gray-400">
                                <p className="leading-relaxed">
                                    This website is operated by <strong>Joy Juncture</strong>. Throughout the site, the terms “we”, “us” and “our” refer to Joy Juncture, offering this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
                                </p>
                                <p className="leading-relaxed mt-4">
                                    By visiting our site and/ or purchasing something from us, you engage in our “service” and agree to be bound by the following terms and conditions (“terms of service”, “terms”), including those additional terms and conditions and policies referenced herein and/or available by hyperlink. These terms of service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/ or contributors of content.
                                </p>
                                <p className="leading-relaxed mt-4">
                                    Our store is hosted on Shopify Inc. they provide us with an online e-commerce platform that allows us to sell our products and Services to you.
                                </p>
                            </div>
                        </div>

                        {/* Sections Loop */}
                        {sections.map((section, index) => (
                            <section
                                key={index}
                                id={`section-${index + 1}`}
                                className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 hover:border-orange-500/20 transition-colors duration-300"
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-6 hidden sm:block">
                                        <div className="h-10 w-10 bg-neutral-800 rounded-xl flex items-center justify-center text-orange-500 font-bold text-lg border border-neutral-700">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                            <span className="sm:hidden mr-3 text-orange-500">#{index + 1}</span>
                                            {section.title}
                                        </h2>
                                        <div className="prose prose-invert prose-orange max-w-none">
                                            <div className="whitespace-pre-line text-gray-400 leading-relaxed">
                                                {section.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}

                        {/* Contact Section */}
                        <div id="contact" className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Questions about Terms?</h2>
                                    <p className="text-gray-400 mb-6">
                                        If you have any clarifications regarding our Terms of Service, please reach out to our legal team.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center text-gray-300">
                                            <Mail className="h-5 w-5 text-orange-500 mr-3" />
                                            <a href="mailto:carejuncture@gmail.com" className="hover:text-orange-400 transition-colors">carejuncture@gmail.com</a>
                                        </div>
                                        <div className="flex items-start text-gray-300">
                                            <MessageSquare className="h-5 w-5 text-orange-500 mr-3 mt-1" />
                                            <div>
                                                <p className="font-semibold text-white">Joy Juncture</p>
                                                <p className="text-sm text-gray-400 mt-1">Surat-395007</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 bg-black/30 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <Shield className="h-24 w-24 text-orange-500/80" />
                                </div>
                            </div>
                        </div>

                        {/* Footer Links (Quick Access) */}
                        <div className="flex flex-wrap gap-4 pt-8">
                            <Link href="/privacy" className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center hover:border-orange-500/40 transition-all group">
                                <span className="text-gray-400 group-hover:text-white font-medium">Privacy Policy</span>
                            </Link>
                            <Link href="/contact" className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center hover:border-orange-500/40 transition-all group">
                                <span className="text-gray-400 group-hover:text-white font-medium">Contact Support</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsPage;