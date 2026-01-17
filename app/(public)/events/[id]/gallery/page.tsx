"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Share2, ArrowRight } from "lucide-react";

interface Event {
    _id: string;
    name: string;
    description: string;
    postEventDescription?: string;
    date: string;
    Venue?: string;
    gallery?: string[];
    imageUrl?: string;
}

export default function EventGalleryPage() {
    const params = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`/api/events/${params.id}`);
                const data = await response.json();
                if (data.success) {
                    setEvent(data.event);
                }
            } catch (error) {
                console.error("Failed to fetch event:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchEvent();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
                <Link href="/events" className="text-orange-500 hover:text-orange-400">
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-orange-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link
                        href="/events/past"
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium tracking-wide">Back to Past Events</span>
                    </Link>
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-end pb-20 px-6 pt-32">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <img
                        src={event.imageUrl || event.gallery?.[0] || "/placeholder-event.jpg"}
                        alt={event.name}
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex flex-wrap gap-4 mb-6">
                            <span className="px-4 py-1.5 rounded-full border border-orange-500/50 bg-orange-500/10 text-orange-400 text-sm font-medium tracking-wide">
                                COMPLETED EVENT
                            </span>
                            <div className="flex items-center gap-2 text-white/80 bg-white/5 px-4 py-1.5 rounded-full backdrop-blur-md">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">
                                    {new Date(event.date).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[0.9]">
                            {event.name}
                        </h1>

                        {event.Venue && (
                            <div className="flex items-center gap-2 text-xl text-white/60 mb-12">
                                <MapPin className="w-5 h-5 text-orange-500" />
                                <span>{event.Venue}</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section className="relative z-10 px-6 py-20 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                        {/* Description Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="text-sm font-bold text-orange-500 tracking-widest uppercase mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-orange-500"></span>
                                    The Story
                                </h2>
                                <div className="prose prose-invert prose-lg">
                                    <p className="text-white/80 leading-relaxed text-lg">
                                        {event.postEventDescription || event.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery Column */}
                        <div className="lg:col-span-8">
                            {event.gallery && event.gallery.length > 0 ? (
                                <div className="columns-1 md:columns-2 gap-6 space-y-6">
                                    {event.gallery.map((imgUrl, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-100px" }}
                                            transition={{ delay: index * 0.05 }}
                                            className="break-inside-avoid group relative overflow-hidden rounded-xl"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Gallery Image ${index + 1}`}
                                                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                    <p className="text-white/40">No gallery images available yet.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-20 border-t border-white/10 bg-neutral-900/30">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h2 className="text-3xl font-bold mb-6">Don't miss the next one</h2>
                    <p className="text-white/60 mb-8 max-w-2xl mx-auto">
                        Join our community to stay updated on upcoming events, tournaments, and meetups.
                    </p>
                    <Link
                        href="/events/upcoming"
                        className="inline-flex items-center gap-2 bg-orange-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-400 transition-colors"
                    >
                        See Upcoming Events <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

        </div>
    );
}
