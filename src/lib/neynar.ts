// Remove direct Neynar SDK usage from this file
// Instead, create API endpoints for the functionality you need

export async function fetchUserData(fid: number) {
  const response = await fetch(`/api/user/${fid}`);
  return response.json();
}

export async function createCast(recipient: string) {
  const response = await fetch('/api/neynar/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient }),
  });
  return response.json();
}

// Add any other client-side methods you need that will call your API endpoints 