import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "GLOW - Send anonymous compliments -frame";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative">
        <img src="/glow_frame.png" alt="GLOW" tw="w-full h-full" />
      </div>
    ),
    {
      ...size,
    }
  );
} 