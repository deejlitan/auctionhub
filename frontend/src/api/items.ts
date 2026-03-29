import api from './client';

export interface AuctionItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  startingPrice: number;
  currentBid: number;
  currentBidderId: number | null;
  currentBidderName: string;
  endTime: string;
  createdByUserId: number;
  createdAt: string;
  isActive: boolean;
  quantity: number;
  category: string;
}

export interface Bid {
  id: number;
  itemId: number;
  userId: number;
  username: string;
  amount: number;
  quantityWanted: number;
  bidTime: string;
}

export interface WinnerAllocation {
  userId: number;
  username: string;
  amount: number;
  quantityWanted: number;
  quantityAllocated: number;
}

export interface WinnersResponse {
  clearingPrice: number | null;
  spotsAvailable: number;
  unitsFilled: number;
  winners: WinnerAllocation[];
}

export const getItems = () => api.get<AuctionItem[]>('/api/items');
export const getItem = (id: number) => api.get<AuctionItem>(`/api/items/${id}`);
export const getWinners = (id: number) => api.get<WinnersResponse>(`/api/items/${id}/winners`);

export const createItem = (data: {
  title: string;
  description: string;
  imageUrl?: string;
  startingPrice: number;
  endTime: string;
  quantity?: number;
  category?: string;
}) => api.post<AuctionItem>('/api/items', data);

export const getBids = (itemId: number) => api.get<Bid[]>(`/api/items/${itemId}/bids`);
export const placeBid = (itemId: number, amount: number, quantityWanted = 1) =>
  api.post<Bid>(`/api/items/${itemId}/bids`, { amount, quantityWanted });
