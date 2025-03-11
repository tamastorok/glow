import { Metadata } from "next";
import Demo from "~/components/Demo";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/frames/compliment/opengraph-image`,
  buttons: [
    {
      label: "Start",
      action: "post",
      target: `${appUrl}/frames/compliment`,
    },
  ],
};

export const metadata: Metadata = {
  title: "GLOW - Send anonymous compliments",
  description: "Send anonymous compliments to anyone on Warpcast",
  openGraph: {
    title: "GLOW - Send anonymous compliments",
    description: "Send anonymous compliments to anyone on Warpcast",
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function ComplimentFrame() {
  return <Demo/>;
} 