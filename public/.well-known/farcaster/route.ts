type FarcasterManifest = {
  accountAssociation: {
    header: string;
    payload: string;
    signature: string;
  };
  frame: {
    version: string;
    name: string;
    homeUrl: string;
    iconUrl: string;
    imageUrl: string;
    buttonTitle: string;
    splashImageUrl: string;
    splashBackgroundColor: string;
    webhookUrl: string;
  };
  triggers?: Array<{
    type: 'cast' | 'composer';
    id: string;
    url: string;
    name?: string;
  }>;
};

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://useglow.xyz";
  
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_URL environment variable is not set");
  }

  const config: FarcasterManifest = {
    accountAssociation: {
      header:
        "eyJmaWQiOjM2MjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyY2Q4NWEwOTMyNjFmNTkyNzA4MDRBNkVBNjk3Q2VBNENlQkVjYWZFIn0",
      payload: "eyJkb21haW4iOiJmcmFtZXMtdjIudmVyY2VsLmFwcCJ9",
      signature:
        "MHhiNDIwMzQ1MGZkNzgzYTExZjRiOTllZTFlYjA3NmMwOTdjM2JkOTY1NGM2ODZjYjkyZTAyMzk2Y2Q0YjU2MWY1MjY5NjI5ZGQ5NTliYjU0YzEwOGI4OGVmNjdjMTVlZTdjZDc2YTRiMGU5NzkzNzA3YzkxYzFkOWFjNTg0YmQzNjFi",
    },
    frame: {
      version: "1",
      name: "GLOW",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      imageUrl: `${appUrl}/frames/compliment/opengraph-image`,
      buttonTitle: "Start",
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
    },
    triggers: [
      {
        type: "cast",
        id: "send-compliment",
        url: `${appUrl}/frames/compliment`,
        name: "Send Compliment"
      }
    ]
  };

  return Response.json(config);
}
