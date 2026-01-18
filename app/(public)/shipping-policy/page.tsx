//shipping-policy
// app/(public)/shipping-policy/page.tsx
import React from 'react';
import Link from 'next/link';
import { Truck, MapPin, Calendar, Box, AlertCircle, Info, Mail } from 'lucide-react';

const ShippingPolicyPage = () => {
    const effectiveDate = "15th January 2025";

    const sections = [
        {
            title: "Introduction",
            icon: <Info className="h-5 w-5" />,
            content: `Thank you for choosing Joy Juncture. This shipping policy outlines our shipping and delivery practices to ensure you have a seamless shopping experience with us. Please read this policy carefully before making a purchase.`
        },
        {
            title: "Shipping Destinations",
            icon: <MapPin className="h-5 w-5" />,
            content: `We currently ship our products to addresses within India only.`
        },
        {
            title: "Processing Time",
            icon: <Calendar className="h-5 w-5" />,
            content: `Order processing typically takes 3-5 business days. Please note that processing times may be longer during peak seasons or promotional events.`
        },
        {
            title: "Delivery Timeline",
            icon: <Truck className="h-5 w-5" />,
            content: `Once shipped, your order should reach you within:

4–8 business days for major metro cities
7–12 business days for non-metro or remote locations

Please note: these are estimated timelines and may vary due to carrier delays or external factors.`
        },
        {
            title: "Shipping Methods & Fees",
            icon: <Box className="h-5 w-5" />,
            content: `Shipping methods: We partner with reputable shipping carriers to ensure the safe and timely delivery of your orders. Available shipping methods will be displayed during the checkout process.

Shipping fees: Shipping fees is included in the price of the product.`
        },
        {
            title: "Estimated Delivery Time",
            icon: <ClockIcon className="h-5 w-5" />,
            content: `The estimated delivery time depends on your shipping address and the selected shipping method. Please refer to the estimated delivery time provided during the checkout process.
Please note that delivery times are approximate and may be affected by factors beyond our control, such as customs processing and unforeseen shipping delays.`
        },
        {
            title: "Tracking, Delays & Lost Shipments",
            icon: <AlertCircle className="h-5 w-5" />,
            content: `Tracking information: Once your order is shipped, we will provide you with a tracking number to monitor the delivery status of your package.

Delayed or lost shipments: While we make every effort to ensure timely delivery, we are not responsible for delayed or lost shipments caused by the shipping carrier or any unforeseen circumstances.
If your package is significantly delayed or appears to be lost, please contact our customer support team, and we will assist you in resolving the issue.`
        },
        {
            title: "Customs & Address Accuracy",
            icon: <MapPin className="h-5 w-5" />,
            content: `Customs and import duties: Any customs duties, taxes, or import fees imposed by the destination country are the responsibility of the customer. Please check with your local customs office for information on potential fees before placing an order.

Delivery address: Please ensure that your shipping address is accurate and complete. We are not responsible for orders delivered to incorrect or undeliverable addresses.`
        }
    ];

    // Helper component for Icon inside array map
    function ClockIcon(props: any) {
        return <Calendar {...props} />;
    }

    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            <main className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 ring-1 ring-orange-500/20">
                        <Truck className="h-12 w-12 text-orange-500" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Shipping Policy</h1>
                    <div className="mt-8 inline-flex items-center bg-neutral-900 border border-neutral-800 text-gray-400 px-5 py-2.5 rounded-full shadow-sm">
                        <span className="text-sm font-medium">Effective Date:</span>
                        <span className="ml-2 font-semibold text-orange-400">{effectiveDate}</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Navigation Sidebar */}
                    <div className="lg:w-1/4">
                        <div className="sticky top-28 bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl shadow-black/20">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center border-b border-neutral-800 pb-4">
                                <Box className="h-5 w-5 mr-3 text-orange-500" />
                                Sections
                            </h2>
                            <nav className="space-y-1">
                                {sections.map((section, index) => (
                                    <a
                                        key={index}
                                        href={`#section-${index}`}
                                        className="block text-sm font-medium text-gray-400 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-neutral-800/50 transition-all truncate"
                                    >
                                        {index + 1}. {section.title}
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
                                        <div className="h-10 w-10 bg-neutral-800 rounded-xl flex items-center justify-center text-orange-500 border border-neutral-700">
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

                        {/* Order Support & Contact */}
                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 mt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Order Status & Support</h2>
                            <p className="text-gray-400 mb-6">
                                For information about your order status or any shipping-related inquiries, please contact our customer support team.
                                By making a purchase on our website, you acknowledge and agree to the terms of this shipping policy.
                            </p>
                            <div className="flex items-center text-gray-300">
                                <Mail className="h-5 w-5 text-orange-500 mr-3" />
                                <a href="mailto:carejuncture@gmail.com" className="hover:text-orange-400 transition-colors">carejuncture@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ShippingPolicyPage;