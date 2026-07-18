import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/icon-art";

// Favicon 32×32, programmatisch aus der Wortmarke (blaues „t" auf weißem,
// leicht abgerundetem Grund). Bei dieser Größe ohne Gold-Punkt – er würde in
// der Browser-Tab-Leiste (16 px) unleserlich.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={size.width}
          height={size.height}
          src={iconDataUri({ size: 32, radius: 0.22, pad: 0.08, dot: false })}
          alt="tefter"
        />
      </div>
    ),
    { ...size },
  );
}
