// app/api/cart/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId } = await params;
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Remove item from cart
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        $pull: { 
          cart: { productId: itemId }
        }
      },
      { 
        new: true,
        projection: { cart: 1 }
      }
    );

    if (user) {
      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
        count: user.cart?.length || 0
      });
    }

    return NextResponse.json(
      { error: 'Item not found in cart' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;
    
    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Item ID and quantity are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Update item quantity in cart
    const user = await User.findOneAndUpdate(
      { 
        email: session.user.email,
        'cart.productId': itemId
      },
      { 
        $set: { 
          'cart.$.quantity': Number(quantity),
          'cart.$.addedAt': new Date()
        }
      },
      { 
        new: true,
        projection: { cart: 1 }
      }
    );

    if (user) {
      return NextResponse.json({
        success: true,
        message: 'Cart updated',
        count: user.cart?.length || 0
      });
    }

    return NextResponse.json(
      { error: 'Item not found in cart' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}