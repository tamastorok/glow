import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

export async function GET(
  request: Request,
  { params }: { params: Record<string, string> }
) {
  try {
    const { fid } = params;
    const user = await client.getUser({ fid: parseInt(fid) });
    return Response.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
} 