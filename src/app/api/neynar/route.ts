import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

export async function GET(
  request: Request,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    const user = await client.getUser({ fid });
    return Response.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
} 