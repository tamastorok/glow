import { Metadata } from "next";
import Demo from "~/components/Demo";

const appUrl = process.env.NEXT_PUBLIC_URL;


const frameEmbed = {
  version: "vNext",
  imageUrl: `${appUrl}/frames/compliment/opengraph-image`,
  button: {
    title: "Start",
    action: {
      type: "launch_frame",
      name: "GLOW",
      url: `${appUrl}/frames/compliment`,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#FFFFFF"
    }
  }
};

export const metadata: Metadata = {
  title: "GLOW - Send anonymous compliments -TEST",
  description: "Send anonymous compliments to anyone on Warpcast",
  openGraph: {
    title: "GLOW - Send anonymous compliments -TEST",
    description: "Send anonymous compliments to anyone on Warpcast",
    images: [`${appUrl}/frames/compliment/opengraph-image`],
  },
  other: {
    "fc:frame": JSON.stringify(frameEmbed)
  },
};

export default function ComplimentFrame() {
  return <Demo />;
} 