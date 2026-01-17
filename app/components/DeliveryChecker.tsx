
import React, { useState } from 'react';
import { MapPin, Truck, Check, Home, Loader2, AlertCircle } from 'lucide-react';

interface DeliveryCheckerProps {
    onDeliveryCalculated?: (fee: number | null, isFree: boolean) => void;
}

export default function DeliveryChecker({ onDeliveryCalculated }: DeliveryCheckerProps) {
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const checkDelivery = async () => {
        if (pincode.length !== 6) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        if (onDeliveryCalculated) onDeliveryCalculated(null, false); // Reset parent

        try {
            const res = await fetch(`/api/delivery/calculate?pincode=${pincode}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setResult(data.data);
                if (onDeliveryCalculated) {
                    onDeliveryCalculated(data.data.delivery_fee, data.data.is_free_delivery);
                }
            } else {
                setError(data.error || 'Failed to check delivery');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <MapPin size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Delivery Checker</h3>
                    <p className="text-zinc-400 text-xs">Enter pincode to check availability & fee</p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter Pincode"
                    value={pincode}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPincode(val);
                        if (error) setError(null);
                    }}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors tracking-widest placeholder:tracking-normal font-mono"
                />
                <button
                    onClick={checkDelivery}
                    disabled={loading || pincode.length !== 6}
                    className="bg-orange-500 text-black font-bold px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Check'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-black/30 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white font-bold flex items-center gap-2">
                                {result.city}, {result.state}
                                {result.is_free_delivery && (
                                    <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                        Free Delivery
                                    </span>
                                )}
                            </p>
                            <p className="text-zinc-500 text-xs mt-1">
                                Distance from Surat: <span className="text-zinc-300">{result.distance_km} km</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400">Estimated Fee:</span>
                        <span className={`font-bold ${result.is_free_delivery ? 'text-green-500' : 'text-white'}`}>
                            {result.is_free_delivery ? '₹0' : `₹${result.delivery_fee}`}
                        </span>
                    </div>

                    {result.message && (
                        <p className="text-[10px] text-zinc-500 italic border-l-2 border-orange-500 pl-2">
                            {result.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
