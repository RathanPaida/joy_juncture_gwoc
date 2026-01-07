import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-middleware';
import { connectDb } from '@/lib/mongodb';
import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
  type: String,
  pointsPerUnit: Number,
  description: String,
  isActive: Boolean,
  updatedAt: Date
});

const PointsCriteria = mongoose.models.PointsCriteria || 
  mongoose.model('PointsCriteria', criteriaSchema);

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized } = await checkAdminAccess(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    await connectDb();
    const body = await req.json();
    
    const criteria = await PointsCriteria.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!criteria) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, criteria });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authorized } = await checkAdminAccess(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    await connectDb();
    await PointsCriteria.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}