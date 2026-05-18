import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';

export interface SubscriberListResponse {
  success: boolean;
  subscribers?: Array<{
    _id: string;
    name: string;
    email: string;
    count: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total?: number;
  message?: string;
}

/**
 * GET /api/admin/subscribers
 * Get list of all subscribers ordered by latest first
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Fetch all subscribers, sorted by createdAt descending (latest first)
    const subscribers = await Subscriber.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Transform the data for response
    const formattedSubscribers = subscribers.map((sub) => ({
      _id: sub._id.toString(),
      name: sub.name,
      email: sub.email,
      count: sub.count,
      discountCode: sub.discountCode,
      createdAt: sub.createdAt?.toISOString() || '',
      updatedAt: sub.updatedAt?.toISOString() || '',
    }));

    return NextResponse.json(
      {
        success: true,
        subscribers: formattedSubscribers,
        total: formattedSubscribers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/admin/subscribers:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subscribers',
      },
      { status: 500 }
    );
  }
}
