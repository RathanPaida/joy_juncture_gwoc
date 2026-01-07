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

const PointsCriteria = mongoose.models.PointsCriteria || 
  mongoose.model('PointsCriteria', criteriaSchema);

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    let criteria = await PointsCriteria.find().sort({ createdAt: -1 });
    
    // Create default criteria if none exist
    if (criteria.length === 0) {
      const defaults = [
        {
          type: 'purchase',
          pointsPerUnit: 10,
          description: 'Points earned per ₹1 spent on purchases',
          isActive: true
        },
        {
          type: 'event',
          pointsPerUnit: 300,
          description: 'Points for attending events',
          isActive: true
        },
        {
          type: 'game',
          pointsPerUnit: 100,
          description: 'Points for completing online games',
          isActive: true
        },
        {
          type: 'referral',
          pointsPerUnit: 250,
          description: 'Points for each successful referral',
          isActive: true
        },
        {
          type: 'daily_login',
          pointsPerUnit: 50,
          description: 'Points for daily login',
          isActive: true
        }
      ];
      
      await PointsCriteria.insertMany(defaults);
      criteria = await PointsCriteria.find();
    }
    
    return NextResponse.json({ criteria });
  } catch (error: any) {
    console.error('Error fetching criteria:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 });
    }
    
    await connectDb();
    const body = await req.json();
    
    const criteria = new PointsCriteria(body);
    await criteria.save();
    
    return NextResponse.json({ success: true, criteria }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating criteria:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}  