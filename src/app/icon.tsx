import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#BD4B2A",
          borderRadius: "8px",
          color: "#FAFAF7",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        R
      </div>
    ),
    {
      ...size,
    }
  );
}
