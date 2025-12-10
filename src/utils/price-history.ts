import type { PriceHistoryEntry } from '@/models/product';

/**
 * Get the product price that was active on a specific date
 * Uses price history to find the correct price for the trip date
 * 
 * @param currentPrice - Current price of the product
 * @param priceHistory - Array of price history entries
 * @param tripDate - Date of the trip
 * @returns The price that was active on the trip date
 */
export function getProductPriceForDate(
  currentPrice: number,
  priceHistory: PriceHistoryEntry[] | undefined,
  tripDate: Date
): number {
  // If no price history exists, use current price
  if (!priceHistory || priceHistory.length === 0) {
    return currentPrice;
  }

  // Convert tripDate to Date object if it's a string
  const tripDateObj = tripDate instanceof Date ? tripDate : new Date(tripDate);
  
  // Filter price history entries where updatedAt <= tripDate
  // Sort by updatedAt descending to get the latest price before or on trip date
  const validPrices = priceHistory
    .filter(entry => {
      const entryDate = entry.updatedAt instanceof Date ? entry.updatedAt : new Date(entry.updatedAt);
      return entryDate <= tripDateObj;
    })
    .sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });

  // If we found valid prices, use the most recent one
  if (validPrices.length > 0) {
    return validPrices[0].price;
  }

  // If no price exists before the trip date, use the oldest available price (fallback)
  const sortedByDate = [...priceHistory].sort((a, b) => {
    const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
    const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
    return dateA.getTime() - dateB.getTime(); // Ascending order
  });

  // Return oldest price if available, otherwise current price
  return sortedByDate.length > 0 ? sortedByDate[0].price : currentPrice;
}

