// app/(public)/cancellation-policy/page.tsx
import React from 'react';
import { XCircle, Ban, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CancellationPolicyPage = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans">
            <main className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 ring-1 ring-orange-500/20">
                        <Ban className="h-12 w-12 text-orange-500" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Cancellation Policy</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        At Joy Juncture, once you place an order, it’s like locking in your move — it can’t be undone!
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Why No Cancellations */}
                    <section className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 hover:border-orange-500/20 transition-colors duration-300">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mr-6 hidden sm:block">
                                <div className="h-12 w-12 bg-neutral-800 rounded-xl flex items-center justify-center text-orange-500 border border-neutral-700">
                                    <XCircle className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">Here’s why</h2>
                                <div className="prose prose-invert prose-orange max-w-none text-gray-400 space-y-4">
                                    <p>
                                        As soon as you hit that “Order” button, our elves get to work packing and prepping your goodies!
                                    </p>
                                    <p>
                                        To keep things smooth and fair for all gamers, we don’t allow cancellations after the order is placed!
                                    </p>
                                    <div className="bg-neutral-800/50 p-4 rounded-xl border-l-4 border-orange-500 mt-4">
                                        <p className="text-gray-300 text-sm m-0">
                                            <strong>But don’t worry:</strong> If there’s a genuine issue (like receiving the wrong product or a defective one), we’ve got your back. Just check out our <Link href="/refund-policy" className="text-orange-500 hover:underline">Return/Exchange Policy</Link> for help.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Exceptions / Paused Orders */}
                    <section className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl p-10 hover:border-orange-500/20 transition-colors duration-300">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mr-6 hidden sm:block">
                                <div className="h-12 w-12 bg-neutral-800 rounded-xl flex items-center justify-center text-orange-500 border border-neutral-700">
                                    <AlertOctagon className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">When We Hit Pause</h2>
                                <div className="prose prose-invert prose-orange max-w-none text-gray-400 space-y-4">
                                    <p>
                                        At Joy Juncture, we’re all about making your gaming experience seamless, but occasionally, we have to hit the brakes on an order.
                                    </p>
                                    <h3 className="text-white font-semibold text-lg mt-4">Reasons your order might get benched:</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>The game you picked is out of stock (we’re sad too 😢)</li>
                                        <li>The quantities you want aren’t available (everyone loves it, clearly!)</li>
                                        <li>We spotted a glitch in the pricing matrix</li>
                                        <li>Our anti-fraud bots raised their shields. Sometimes, we might ask for extra info to level up your order—don’t worry, it’s just part of the game!</li>
                                    </ul>
                                    <p className="mt-4">
                                        If we do have to cancel your order (or part of it), we’ll let you know ASAP. And if you’ve already paid, we’ll hit the “reverse” button to send your money back to your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default CancellationPolicyPage;