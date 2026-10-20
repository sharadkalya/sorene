/** API response shape for a subscriber record (no raw DB fields). */
export interface SubscriberRecord {
  id: string;
  name: string;
  email: string;
  discountCode: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}
