import { NextRequest, NextResponse } from 'next/server';
import { sendStayTunedEmail } from '@/lib/email';
import connectDB from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';

export interface StayTunedRequest {
  name: string;
  email: string;
}

export interface StayTunedResponse {
  success: boolean;
  message: string;
}

/**
 * Generate a unique discount code for the user
 */
function generateDiscountCode(): string {
  const prefix = 'SORVENE';
  const randomNum = 1009;
  return `${prefix}${randomNum}`;
}

/**
 * POST /api/stay-tuned
 * Handle stay tuned form submissions and send email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as StayTunedRequest;
    const { name, email } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate name (at least 2 characters, only letters and spaces)
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name.trim())) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid name (at least 2 letters)' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if subscriber already exists
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    let subscriber = await Subscriber.findOne({ email: trimmedEmail });
    const discountCode = generateDiscountCode();

    if (subscriber) {
      // Update existing subscriber - increment count and update name
      subscriber.count += 1;
      subscriber.name = trimmedName; // Update name in case it changed
      subscriber.discountCode = discountCode;
      await subscriber.save();
    } else {
      // Create new subscriber
      subscriber = await Subscriber.create({
        name: trimmedName,
        email: trimmedEmail,
        count: 1,
        discountCode,
      });
    }

    // Send email
    await sendStayTunedEmail({
      name: trimmedName,
      email: trimmedEmail,
      discountCode
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your interest! Check your email for your exclusive discount code.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/stay-tuned:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 }
    );
  }
}
