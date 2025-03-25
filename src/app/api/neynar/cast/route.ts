import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { recipient } = await request.json();
    console.log('Creating cast for recipient:', recipient);
    console.log('Using API key:', process.env.NEYNAR_API_KEY ? 'Present' : 'Missing');
    console.log('Using signer UUID:', process.env.NEYNAR_SIGNER_UUID ? 'Present' : 'Missing');
    
    // Ensure recipient starts with @ and remove any existing @ if present
    const formattedRecipient = recipient.startsWith('@') ? recipient : `@${recipient}`;
    const text = `${formattedRecipient} you received an anonymous compliment ✨ Check it out in the GLOW app: https://useglow.xyz/frames/compliment`;
    
    console.log('Attempting to create cast with text:', text);
    const cast = await client.publishCast({
      text,
      signerUuid: process.env.NEYNAR_SIGNER_UUID!,
    });
    console.log('Cast created successfully:', cast);

    return Response.json({ success: true, cast });
  } catch (error) {
    console.error('Error creating cast:', error);
    return Response.json({ error: 'Failed to create cast', details: error }, { status: 500 });
  }
} 