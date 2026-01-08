// app/api/admin/wallet/criteria/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
  type: { type: String, required: true },
  pointsPerUnit: { type: Number, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

criteriaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
});

const PointsCriteria = mongoose.models.PointsCriteria || 
  mongoose.model('PointsCriteria', criteriaSchema);

export async function GET(req: NextRequest) {
  try {
    console.log('=== GET Points Criteria ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified, fetching criteria...');
    
    await connectDb();
    const criteria = await PointsCriteria.find().sort({ createdAt: -1 }).lean();
    
    console.log(`Found ${criteria.length} criteria`);
    
    return NextResponse.json({ 
      success: true,
      criteria,
      count: criteria.length
    });
  } catch (error: any) {
    console.error('❌ Error fetching criteria:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== POST New Criteria ===');
    
    const { authorized, error } = await checkAdminAccess(req);
    
    if (!authorized) {
      console.log('❌ Unauthorized:', error);
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified, creating criteria...');

    await connectDb();
    const body = await req.json();
    
    console.log('Creating criteria:', body);
    
    // Validate required fields
    if (!body.type || body.pointsPerUnit === undefined || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, pointsPerUnit, description' },
        { status: 400 }
      );
    }

    const criteria = new PointsCriteria(body);
    await criteria.save();
    
    console.log('✅ Criteria created:', criteria._id);
    
    return NextResponse.json({ 
      success: true, 
      criteria,
      message: 'Criteria created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating criteria:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}