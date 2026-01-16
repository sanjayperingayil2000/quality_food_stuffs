import type { TripProduct } from '@/contexts/daily-trip-context';

/**
 * Deduplicates accepted products based on productId and transferredFromDriverId.
 * 
 * Rules:
 * 1. If multiple products have the same productId and same transferredFromDriverId, keep only one
 * 2. If products with the same productId exist both with and without transferredFromDriverId,
 *    prefer the ones with transferredFromDriverId (remove the ones without)
 * 
 * @param acceptedProducts - Array of accepted products to deduplicate
 * @returns Deduplicated array of accepted products
 */
export function deduplicateAcceptedProducts(acceptedProducts: TripProduct[]): TripProduct[] {
  // First, group by productId to handle duplicates with same productId
  const productsByProductId = new Map<string, TripProduct[]>();
  
  for (const p of acceptedProducts) {
    const productId = p.productId;
    if (!productsByProductId.has(productId)) {
      productsByProductId.set(productId, []);
    }
    productsByProductId.get(productId)!.push(p);
  }
  
  // For each productId, deduplicate and prefer products with transferredFromDriverId
  const deduplicatedProducts: TripProduct[] = [];
  
  for (const [, products] of productsByProductId.entries()) {
    // Group by transferredFromDriverId for this productId
    const productsByDriver = new Map<string, TripProduct>();
    
    for (const p of products) {
      const transferredFromDriverId = (p as TripProduct & { transferredFromDriverId?: string }).transferredFromDriverId || '';
      
      // If we already have a product with this driver, skip (duplicate)
      if (productsByDriver.has(transferredFromDriverId)) {
        continue;
      }
      
      productsByDriver.set(transferredFromDriverId, p);
    }
    
    // If there are products with and without transferredFromDriverId for the same productId,
    // prefer the one with transferredFromDriverId
    const productsArray = [...productsByDriver.values()];
    const productsWithTransfer = productsArray.filter(p => 
      !!(p as TripProduct & { transferredFromDriverId?: string }).transferredFromDriverId
    );
    const productsWithoutTransfer = productsArray.filter(p => 
      !(p as TripProduct & { transferredFromDriverId?: string }).transferredFromDriverId
    );
    
    if (productsWithTransfer.length > 0) {
      // Prefer products with transfer info
      deduplicatedProducts.push(...productsWithTransfer);
    } else {
      // Only add products without transfer if there are no products with transfer
      deduplicatedProducts.push(...productsWithoutTransfer);
    }
  }
  
  return deduplicatedProducts;
}
