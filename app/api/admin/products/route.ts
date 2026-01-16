import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCollection } from '@/lib/mongodb';

// Simple function to generate unique ID
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// GET - Fetch all products
export async function GET() {
  try {
    const productsCollection = await getCollection('products');
    const products = await productsCollection.find({}).toArray();
    
    return NextResponse.json({
      success: true,
      items: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product with image upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    
    // Check if product with this name already exists
    const productsCollection = await getCollection('products');
    const existingProduct = await productsCollection.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: `A product with the name "${name}" already exists` },
        { status: 409 }
      );
    }

    // Check if slug already exists
    const existingSlug = await productsCollection.findOne({ slug });
    
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `A product with the slug "${slug}" already exists. Please use a different product name.` },
        { status: 409 }
      );
    }
    
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const currency = formData.get('currency') as string;
    const stock = parseInt(formData.get('stock') as string);
    const category = formData.get('category') as string;
    const players = formData.get('players') as string;
    const duration = formData.get('duration') as string;
    const moods = JSON.parse(formData.get('moods') as string || '[]');
    const badges = JSON.parse(formData.get('badges') as string || '[]');
    const primaryImageIndex = parseInt(formData.get('primaryImageIndex') as string || '0');
    
    // Get all uploaded images
    const imageFiles = formData.getAll('images') as File[];
    
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Process and save images
    const savedImages = await Promise.all(
      imageFiles.map(async (file, index) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate unique filename
        const ext = file.name.split('.').pop();
        const uniqueId = generateUniqueId();
        const filename = `${uniqueId}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        
        // Save file
        await writeFile(filepath, buffer);
        
        return {
          url: `/uploads/products/${filename}`,
          isPrimary: index === primaryImageIndex,
          filename: file.name,
        };
      })
    );

    // Get thumbnail (primary image or first image)
    const thumbnail = savedImages.find(img => img.isPrimary)?.url || savedImages[0].url;

    // Prepare product data
    const productData = {
      name,
      slug,
      description,
      price: {
        amount: price,
        currency,
      },
      stock: {
        quantity: stock,
        available: stock > 0,
      },
      category: [category],
      meta: {
        players,
        duration,
        moods,
        badges,
      },
      media: {
        thumbnail,
      },
      images: savedImages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to MongoDB
    const result = await productsCollection.insertOne(productData);

    return NextResponse.json({
      success: true,
      product: {
        _id: result.insertedId.toString(),
        ...productData,
      },
      message: 'Product created successfully',
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}