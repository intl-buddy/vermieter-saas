import { ImageResponse } from "next/og";
import { iconDataUri } from "@/lib/icon-art";

// Apple-Touch-Icon 180×180: voller, opaker weißer Hintergrund (ohne
// Transparenz – iOS legt seine eigene Maske darüber), etwas Innenabstand und
// der Gold-Punkt rechts unten am „t".
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={size.width}
          height={size.height}
          src={iconDataUri({
            size: 180,
            radius: 0,
            pad: 0.16,
            dot: true,
            bg: "#ffffff",
          })}
          alt="tefter"
        />
      </div>
    ),
    { ...size },
  );
}
