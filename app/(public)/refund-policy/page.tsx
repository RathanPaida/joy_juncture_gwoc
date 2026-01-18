//refund-policy/page.tsx
// app/(public)/refund-policy/page.tsx
import React from 'react';
import Link from 'next/link';
import { RefreshCcw, AlertTriangle, Clock, Mail, MessageCircle, Shield } from 'lucide-react';

const RefundPolicyPage = () => {
    const sections = [
        {
            title: "Refund & Return Policy",
            icon: <RefreshCcw className="h-5 w-5" />,
            content: `Thinking about a return? Did we mess it up? 
We're genuinely sorry if something didn’t go as expected.

We currently handle return and refund requests on a case-by-case basis.
But what does that mean for you?
If you have a genuine issue with your order, you’re covered.

We put in our best to ensure quality and smooth delivery... but hey, sometimes things slip through the cracks. If your item is damaged, defective, or not what you ordered, just reach out. We’ve got your back.

How to reach us:
📩 carejuncture@gmail.com
📱 DM us on Instagram @joy_juncture

Once we verify the issue, we’ll send a replacement right away... no unnecessary hoops to jump through!`
        },
        {
            title: "Damages and Issues",
            icon: <AlertTriangle className="h-5 w-5" />,
            content: `Please check your order as soon as it arrives. If there’s a problem with the item... be it damage, defect, or a mix-up... let us know within 48 hours of delivery so we can make it right.`
        },
        {
            title: "Refund Timeline",
            icon: <Clock className="h-5 w-5" />,
            content: `In rare cases where a refund is necessary instead of a replacement:
Please allow 7–10 working days for us to review your request.
Once approved, the refund will be processed to your original payment method.

We are a small team, building with a lot of love. Your support means the world!
Thank you for being kind and patient with us.`
        }
    ];

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            <main className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 ring-1 ring-orange-500/20">
                        <RefreshCcw className="h-12 w-12 text-orange-500" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Refund & Return Policy</h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We want you to love your purchase. Here's how we handle returns and refunds.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Navigation Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="sticky top-28 bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl shadow-black/20">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center border-b border-neutral-800 pb-4">
                                <Shield className="h-5 w-5 mr-3 text-orange-500" />
                                Quick Navigation
                            </h2>
                            <nav className="space-y-1">
                                {sections.map((section, index) => (
                                    <a
                                        key={index}
                                        href={`#section-${index}`}
                                        className="block text-sm font-medium text-gray-400 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-neutral-800/50 transition-all truncate group"
                                    >
                                        <span className="mr-2 group-hover:text-orange-500 transition-colors">{index + 1}.</span>
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-3/4 space-y-8">
                        {sections.map((section, index) => (
                            <section
                                key={index}
                                id={`section-${index}`}
                                className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 hover:border-orange-500/20 transition-colors duration-300"
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-6 hidden sm:block">
                                        <div className="h-12 w-12 bg-neutral-800 rounded-xl flex items-center justify-center text-orange-500 border border-neutral-700">
                                            {section.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                            <span className="sm:hidden mr-3 text-orange-500">{section.icon}</span>
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

                        {/* Contact Card */}
                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 mt-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Need help with a return?</h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center text-gray-300">
                                            <Mail className="h-5 w-5 text-orange-500 mr-3" />
                                            <a href="mailto:carejuncture@gmail.com" className="hover:text-orange-400 transition-colors">carejuncture@gmail.com</a>
                                        </div>
                                        <div className="flex items-center text-gray-300">
                                            <MessageCircle className="h-5 w-5 text-orange-500 mr-3" />
                                            <span>DM us on Instagram @joy_juncture</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RefundPolicyPage;