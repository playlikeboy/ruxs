import { ImageResponse } from "next/og";
import { RuxsMark } from "@/components/marketing/ruxs-mark";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

/** The same neighbourhood-wide mark is used for the favicon and installable app. */
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
          backgroundColor: "#FAFAF7",
          padding: 16,
        }}
      >
        <RuxsMark width="100%" height="100%" aria-hidden="true" />
      </div>
    ),
    {
      ...size,
    },
  );
}
