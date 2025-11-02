import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/product';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const productCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['bakery', 'fresh']),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  unit: z.string().min(1, 'Unit is required'),
  minimumQuantity: z.number().min(0, 'Minimum quantity must be non-negative'),
  maximumQuantity: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  expiryDays: z.number().min(0).optional(),
  supplier: z.string().optional(),
  displayNumber: z.string().min(1).optional(), // Optional, will be auto-generated if not provided
});

// Schema for updates (used in [id]/route.ts)
const _productUpdateSchema = productCreateSchema.partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('isActive');
    
    const queryFilter: Record<string, unknown> = {};
    if (category) queryFilter.category = category;
    if (isActive !== null) queryFilter.isActive = isActive === 'true';
    
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const products = await Product.find(queryFilter).sort({ createdAt: -1 });
    return withCors(NextResponse.json({ products }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    // Generate unique ID based on category
    const categoryProducts = await Product.find({ category: parsed.data.category }).sort({ id: -1 });
    let nextNumber = 1;
    
    if (categoryProducts.length > 0) {
      // Extract number from existing ID (e.g., PRD-FRS-001 -> 1)
      const lastId = categoryProducts[0].id;
      const match = lastId.match(/PRD-(FRS|BKR)-(\d+)/);
      if (match) {
        nextNumber = Number.parseInt(match[2], 10) + 1;
      }
    }
    
    const prefix = parsed.data.category === 'fresh' ? 'FRS' : 'BKR';
    const id = `PRD-${prefix}-${String(nextNumber).padStart(3, '0')}`;
    
    // Auto-generate displayNumber if not provided
    let displayNumber = parsed.data.displayNumber;
    if (!displayNumber) {
      const categoryPrefix = parsed.data.category === 'fresh' ? 'F' : 'B';
      displayNumber = `${categoryPrefix}${String(nextNumber).padStart(2, '0')}`;
    }
    
    const productData = {
      ...parsed.data,
      id,
      displayNumber,
      createdBy: user?.sub,
      updatedBy: user?.sub,
      priceHistory: [{
        version: 1,
        price: parsed.data.price,
        updatedAt: new Date(),
        updatedBy: user?.sub,
      }],
    };
    
    const product = await Product.create(productData);
    
    // Log to history
    await History.create({
      collectionName: 'products',
      documentId: product._id,
      action: 'create',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: null,
      after: product.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ product }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
