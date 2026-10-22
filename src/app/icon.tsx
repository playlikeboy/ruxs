import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF3E9" }}>
      <img src="https://ruxs.in/brand/ruxs-app-icon.svg" width="512" height="512" alt="RUXs neighbourhood app icon" style={{ width: 512, height: 512 }} />
    </div>,
    { ...size },
  );
}
