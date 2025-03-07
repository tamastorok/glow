import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
): Promise<NextResponse> {
  try {
    const { fid } = await params;
    const user = await client.getUser({ fid: parseInt(fid) });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
} 