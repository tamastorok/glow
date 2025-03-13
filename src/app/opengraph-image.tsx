import { ImageResponse } from "next/og";

export const alt = "GLOW - Send anonymous compliments";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div tw="h-full w-full flex flex-col justify-center items-center relative bg-[#FFC024]">
        <div tw="flex flex-col items-center justify-center">
          <img src="https://i.imgur.com/nubV2mM.png" alt="GLOW" tw="w-50 h-50" />

          <p tw="text-2xl text-gray-600">Send anonymous compliments</p>

        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
