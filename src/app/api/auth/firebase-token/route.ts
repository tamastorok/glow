import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  console.log('Initializing Firebase Admin...');
  try {
    // Log environment variables (without sensitive values)
    console.log('Environment check:', {
      //hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      //hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      //hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      //projectId: process.env.FIREBASE_PROJECT_ID, // safe to log
      //clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // safe to log
      //privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
      //privateKeyFirstChar: process.env.FIREBASE_PRIVATE_KEY?.[0],
      //privateKeyLastChar: process.env.FIREBASE_PRIVATE_KEY?.[process.env.FIREBASE_PRIVATE_KEY.length - 1]
    });

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    console.log('Private key format check:', {
      //hasNewlines: privateKey?.includes('\n'),
      //startsWith: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
      //endsWith: privateKey?.endsWith('-----END PRIVATE KEY-----')
    });

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      })
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
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

    // Verify Firebase Admin is initialized
    if (!getApps().length) {
      throw new Error('Firebase Admin not initialized');
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
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Failed to create custom token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}