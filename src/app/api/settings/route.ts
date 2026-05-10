import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Get site settings
export async function GET() {
  try {
    await connectDB();
    
    // Get the first (and only) settings document
    let settings = await SiteSettings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      settings = await SiteSettings.create({ theme: 'sorvene' });
    }
    
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update site settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Get the first settings document or create one
    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      settings = await SiteSettings.create(body);
    } else {
      settings = await SiteSettings.findByIdAndUpdate(
        settings._id,
        body,
        {
          new: true,
          runValidators: true,
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
