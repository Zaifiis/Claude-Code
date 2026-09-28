import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The app's mark: a stack of stage-coloured cards, which is what the ranked
 * list looks like from a distance.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "linear-gradient(160deg, #1c1c1f 0%, #000000 100%)",
        }}
      >
        {["#0a84ff", "#5e5ce6", "#ff9f0a"].map((colour, index) => (
          <div
            key={colour}
            style={{
              width: index === 2 ? 68 : 100,
              height: 18,
              borderRadius: 9,
              background: colour,
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
