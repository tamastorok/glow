import { Metadata } from "next";
import Demo from "~/components/Demo";

const appUrl = process.env.NEXT_PUBLIC_URL;


export const metadata: Metadata = {
  title: "GLOW - Send anonymous compliments",
  description: "Send anonymous compliments to anyone on Warpcast",
  openGraph: {
    title: "GLOW - Send anonymous compliments",
    description: "Send anonymous compliments to anyone on Warpcast",
    images: [`${appUrl}/frames/compliment/opengraph-image`],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${appUrl}/frames/compliment/opengraph-image`,
    "fc:frame:post_url": `${appUrl}/frames/compliment`,
    "fc:frame:button:1": "Start",
  },
};

export default function ComplimentFrame() {
  return <Demo />;
} 