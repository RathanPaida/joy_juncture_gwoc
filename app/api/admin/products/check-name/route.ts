export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Check if product with this name exists in MongoDB
    const productsCollection = await getCollection('products');
    const existingProduct = await productsCollection.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    return NextResponse.json({
      success: true,
      exists: !!existingProduct,
      product: existingProduct ? {
        id: existingProduct._id.toString(),
        name: existingProduct.name,
      } : null,
    });

  } catch (error) {
    console.error('Error checking product name:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check product name' },
      { status: 500 }
    );
  }
}