// shape returned by @cwr/price-oracle GET /prices
export interface PricesResponse {
  prices: Record<string, number>;
}
