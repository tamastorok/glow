import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  console.log('Initializing Firebase Admin...');
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username } = body;
    
    console.log('Creating token for:', { fid, username });

    if (!fid || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a custom token with the Farcaster user's FID and username
    const token = await getAuth().createCustomToken(fid, {
      username,
      provider: 'farcaster',
      fid: fid
    });

    console.log('Token created successfully');
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating custom token:', error);
    return NextResponse.json(
      { error: 'Failed to create custom token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}