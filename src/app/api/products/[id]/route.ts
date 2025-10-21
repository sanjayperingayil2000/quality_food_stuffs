import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/product';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['bakery', 'fresh']).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  minimumQuantity: z.number().min(0).optional(),
  maximumQuantity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  expiryDays: z.number().min(0).optional(),
  supplier: z.string().optional(),
}).partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const product = await Product.findOne({ id });
    if (!product) {
      return withCors(NextResponse.json({ error: 'Product not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ product }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const product = await Product.findOne({ id });
    if (!product) {
      return withCors(NextResponse.json({ error: 'Product not found' }, { status: 404 }));
    }
    
    const beforeData = product.toObject();
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedBy: user?.sub,
    };
    
    // If price is being updated, add to price history
    if (parsed.data.price && parsed.data.price !== product.price) {
      const currentVersion = product.priceHistory?.length || 0;
      updateData.priceHistory = [
        ...(product.priceHistory || []),
        {
          version: currentVersion + 1,
          price: parsed.data.price,
          updatedAt: new Date(),
          updatedBy: user?.sub,
        }
      ];
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log to history
    await History.create({
      collectionName: 'products',
      documentId: product._id,
      action: 'update',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: updatedProduct?.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ product: updatedProduct }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const product = await Product.findOne({ id });
    if (!product) {
      return withCors(NextResponse.json({ error: 'Product not found' }, { status: 404 }));
    }
    
    const beforeData = product.toObject();
    await Product.findOneAndDelete({ id });
    
    // Log to history
    await History.create({
      collectionName: 'products',
      documentId: product._id,
      action: 'delete',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: null,
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
