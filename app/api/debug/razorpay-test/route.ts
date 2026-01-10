// app/api/debug/razorpay-test/route.ts
// USE THIS TO TEST RAZORPAY CREDENTIALS
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(request: NextRequest) {
  try {
    // Check if env variables exist
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    console.log('=== RAZORPAY CREDENTIALS CHECK ===');
    console.log('RAZORPAY_KEY_ID exists:', !!keyId);
    console.log('RAZORPAY_KEY_ID value:', keyId?.substring(0, 15) + '...');
    console.log('RAZORPAY_KEY_ID length:', keyId?.length);
    console.log('RAZORPAY_KEY_SECRET exists:', !!keySecret);
    console.log('RAZORPAY_KEY_SECRET length:', keySecret?.length);
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', publicKeyId?.substring(0, 15) + '...');

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        error: 'Razorpay credentials not found in environment',
        found: {
          RAZORPAY_KEY_ID: !!keyId,
          RAZORPAY_KEY_SECRET: !!keySecret,
          NEXT_PUBLIC_RAZORPAY_KEY_ID: !!publicKeyId
        }
      });
    }

    // Test Razorpay connection with a minimal order
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log('Testing Razorpay API...');
    
    const testOrder = await razorpay.orders.create({
      amount: 100, // ₹1.00 in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: 'true'
      }
    });

    console.log('✅ Razorpay test order created:', testOrder.id);

    return NextResponse.json({
      success: true,
      message: 'Razorpay credentials are valid!',
      testOrderId: testOrder.id,
      credentials: {
        keyId: keyId?.substring(0, 15) + '...',
        keyIdLength: keyId?.length,
        secretLength: keySecret?.length
      }
    });

  } catch (error: any) {
    console.error('❌ Razorpay test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.error?.description || error.message || 'Unknown error',
      errorCode: error.error?.code,
      statusCode: error.statusCode,
      fullError: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}