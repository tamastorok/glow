import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return Response.json({ users: [] });
    }

    const response = await client.searchUser({ q: query });
    return Response.json(response);
  } catch (error) {
    console.error('Error searching users:', error);
    return Response.json({ error: 'Failed to search users' }, { status: 500 });
  }
} 