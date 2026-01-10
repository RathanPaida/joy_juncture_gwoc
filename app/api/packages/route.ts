import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { Package } from "@/models/Package";
import mongoose from 'mongoose';

// Helper to find package by string ID (looks for string ID in MongoDB _id field)
async function findPackageById(id: string) {
  try {
    // Check if it's a valid MongoDB ObjectId (24 character hex)
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try to find by ObjectId
      const packageById = await Package.findById(id);
      if (packageById) return packageById;
    }
    
    // If not found by ObjectId OR not a valid ObjectId format,
    // try to find by the string ID in _id field (non-standard but works)
    return await Package.findById(id);
  } catch (error) {
    console.error('Error finding package:', error);
    return null;
  }
}

// Helper to delete package by string ID
async function deletePackageById(id: string) {
  try {
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      const deleted = await Package.findByIdAndDelete(id);
      if (deleted) return deleted;
    }
    
    // Try to delete by string ID
    return await Package.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error deleting package:', error);
    return null;
  }
}

/* ================= GET ================= */
export async function GET(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ 
        success: false, 
        error: error || "Unauthorized access" 
      }, { status: 401 });
    }

    console.log(`✅ GET /api/packages - Authorized admin: ${admin?.email}`);

    await connectDb();
    const packages = await Package.find().sort({ createdAt: -1 });

    console.log(`✅ GET /api/packages - Found ${packages.length} packages`);
    
    // Transform packages to include both _id and id for frontend
    const transformedPackages = packages.map(pkg => ({
      ...pkg.toObject(),
      id: pkg._id.toString() // Send _id as 'id' for frontend
    }));

    return NextResponse.json({ 
      success: true, 
      data: transformedPackages 
    });
  } catch (e: any) {
    console.error("❌ GET /api/packages error:", e);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch packages"
      },
      { status: 500 }
    );
  }
}

/* ================= POST ================= */
export async function POST(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ 
        success: false, 
        error: error || "Unauthorized access" 
      }, { status: 401 });
    }

    console.log(`✅ POST /api/packages - Authorized admin: ${admin?.email}`);

    await connectDb();
    const body = await req.json();

    // Validate required fields
    const requiredFields = ['name', 'price', 'duration', 'guestRange', 'category'];
    const missingFields = requiredFields.filter(field => !body[field] || body[field].trim() === '');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Prepare package data
    const packageData = {
      name: body.name.trim(),
      price: body.price.trim(),
      duration: body.duration.trim(),
      guestRange: body.guestRange.trim(),
      category: body.category,
      bestFor: body.bestFor?.trim() || '',
      color: body.color || '#ff8c00',
      includes: {
        food: Array.isArray(body.includes?.food) ? body.includes.food.filter((item: string) => item.trim() !== '') : [],
        planning: Array.isArray(body.includes?.planning) ? body.includes.planning.filter((item: string) => item.trim() !== '') : [],
        sound: Array.isArray(body.includes?.sound) ? body.includes.sound.filter((item: string) => item.trim() !== '') : [],
        photography: Array.isArray(body.includes?.photography) ? body.includes.photography.filter((item: string) => item.trim() !== '') : [],
        games: Array.isArray(body.includes?.games) ? body.includes.games.filter((item: string) => item.trim() !== '') : []
      },
      createdBy: {
        userId: admin?.id,
        userEmail: admin?.email,
        userRole: admin?.role || 'admin'
      },
      lastEditedBy: admin?.email,
      status: body.status || 'active',
      isPublished: body.isPublished !== undefined ? body.isPublished : true
    };

    const pkg = await Package.create(packageData);

    console.log(`✅ POST /api/packages - Package created: ${pkg.name} (ID: ${pkg._id})`);
    
    // Return with both _id and id
    const responseData = {
      ...pkg.toObject(),
      id: pkg._id.toString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData,
      message: "Package created successfully" 
    }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /api/packages error:", e);
    
    if (e.code === 11000 || e.message.includes('duplicate')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A package with this name already exists" 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create package"
      },
      { status: 500 }
    );
  }
}

/* ================= PUT ================= */
export async function PUT(req: NextRequest) {
  try {
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json({ 
        success: false, 
        error: error || "Unauthorized access" 
      }, { status: 401 });
    }

    console.log(`✅ PUT /api/packages - Authorized admin: ${admin?.email}`);

    await connectDb();
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Package ID is required" },
        { status: 400 }
      );
    }

    console.log(`📦 PUT /api/packages - Updating package ID: ${id}`);

    // Find the package
    const existingPackage = await findPackageById(id);
    if (!existingPackage) {
      console.log(`❌ PUT /api/packages - Package not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      ...data,
      lastEditedBy: admin?.email,
      updatedAt: new Date()
    };

    // Clean includes arrays if provided
    if (data.includes) {
      updateData.includes = {
        food: Array.isArray(data.includes.food) ? data.includes.food.filter((item: string) => item.trim() !== '') : existingPackage.includes.food,
        planning: Array.isArray(data.includes.planning) ? data.includes.planning.filter((item: string) => item.trim() !== '') : existingPackage.includes.planning,
        sound: Array.isArray(data.includes.sound) ? data.includes.sound.filter((item: string) => item.trim() !== '') : existingPackage.includes.sound,
        photography: Array.isArray(data.includes.photography) ? data.includes.photography.filter((item: string) => item.trim() !== '') : existingPackage.includes.photography,
        games: Array.isArray(data.includes.games) ? data.includes.games.filter((item: string) => item.trim() !== '') : existingPackage.includes.games
      };
    }

    // Update using the existing package's _id
    const updatedPackage = await Package.findByIdAndUpdate(
      existingPackage._id, 
      updateData, 
      { new: true }
    );

    if (!updatedPackage) {
      console.log(`❌ PUT /api/packages - Failed to update package: ${id}`);
      return NextResponse.json(
        { success: false, error: "Failed to update package" },
        { status: 500 }
      );
    }

    console.log(`✅ PUT /api/packages - Package updated: ${updatedPackage.name}`);
    
    // Return with both _id and id
    const responseData = {
      ...updatedPackage.toObject(),
      id: updatedPackage._id.toString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData,
      message: "Package updated successfully" 
    });
  } catch (e: any) {
    console.error("❌ PUT /api/packages error:", e);
    
    if (e.code === 11000 || e.message.includes('duplicate')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A package with this name already exists" 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update package"
      },
      { status: 500 }
    );
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: NextRequest) {
  try {
    console.log("📦 DELETE /api/packages - Deleting package");
    
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      console.log(`❌ DELETE /api/packages - Unauthorized: ${error}`);
      return NextResponse.json({ 
        success: false, 
        error: error || "Unauthorized access" 
      }, { status: 401 });
    }

    console.log(`✅ DELETE /api/packages - Authorized admin: ${admin?.email}`);

    await connectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      console.log(`❌ DELETE /api/packages - Missing package ID`);
      return NextResponse.json(
        { success: false, error: "Package ID is required" },
        { status: 400 }
      );
    }

    console.log(`📦 DELETE /api/packages - Deleting package ID: ${id}`);

    // Find the package first
    const existingPackage = await findPackageById(id);
    
    if (!existingPackage) {
      console.log(`❌ DELETE /api/packages - Package not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    console.log(`Found package: ${existingPackage.name}, deleting...`);

    // Delete using the package's _id
    const deletedPackage = await Package.findByIdAndDelete(existingPackage._id);

    if (!deletedPackage) {
      console.log(`❌ DELETE /api/packages - Failed to delete package: ${id}`);
      return NextResponse.json(
        { success: false, error: "Failed to delete package" },
        { status: 500 }
      );
    }

    console.log(`✅ DELETE /api/packages - Package deleted: ${deletedPackage.name}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Package deleted successfully",
      data: { 
        id: deletedPackage._id.toString(),
        name: deletedPackage.name 
      }
    });
  } catch (e: any) {
    console.error("❌ DELETE /api/packages error:", e);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete package"
      },
      { status: 500 }
    );
  }
}