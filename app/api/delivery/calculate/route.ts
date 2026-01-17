
import { NextResponse } from 'next/server';

const SURAT_COORDS = { lat: 21.1702, lon: 72.8311 };

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Number(d.toFixed(2));
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');

        if (!pincode || pincode.length !== 6) {
            return NextResponse.json(
                { error: 'Invalid pincode. Please enter a 6-digit valid Indian pincode.' },
                { status: 400 }
            );
        }

        // Geocode using Nominatim (OpenStreetMap)
        // Note: User-Agent is required by Nominatim usage policy
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&addressdetails=1&limit=1`;

        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'JoyJunctureApp/1.0 (contact@joyjuncture.com)'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding service failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'Pincode not found. Please check and try again.' },
                { status: 404 }
            );
        }

        const location = data[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);

        const address = location.address;
        const state = address.state || address.province || '';
        const city = address.city || address.town || address.village || address.county || '';

        const distance = calculateDistance(SURAT_COORDS.lat, SURAT_COORDS.lon, lat, lon);

        let deliveryFee = 0;
        let message = '';

        // Fee Logic
        const isGujarat = state.toLowerCase().includes('gujarat');

        if (isGujarat) {
            deliveryFee = 0;
            message = 'Free delivery in Gujarat!';
        } else {
            // Standard calculation for outside Gujarat
            // Base fee ₹50 + ₹0.5 per km
            // Cap at ₹500 to avoid astronomical fees for far places like Delhi/Chennai
            const calculatedFee = 50 + (distance * 0.5);
            deliveryFee = Math.min(Math.round(calculatedFee), 500);

            // Ensure specific minimum for outside state
            if (deliveryFee < 100) deliveryFee = 100;

            message = `Delivery fee based on distance from Surat (${distance} km)`;
        }

        return NextResponse.json({
            success: true,
            data: {
                pincode,
                city,
                state,
                distance_km: distance,
                delivery_fee: deliveryFee,
                is_free_delivery: deliveryFee === 0,
                message,
                coordinates: { lat, lon }
            }
        });

    } catch (error) {
        console.error('Delivery calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate delivery fee. Please try again later.' },
            { status: 500 }
        );
    }
}
