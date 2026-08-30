import { ImageResponse } from "next/og";

export function createManaraIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b100e",
        }}
      >
        <div
          style={{
            width: "74%",
            height: "74%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `${Math.max(2, Math.round(size * 0.012))}px solid #7b6b43`,
            borderRadius: "50%",
            background: "#101a16",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "58%",
              height: "58%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "18%",
                display: "flex",
                borderTop: `${Math.max(2, Math.round(size * 0.01))}px solid #4f755f`,
                borderBottom: `${Math.max(2, Math.round(size * 0.01))}px solid #4f755f`,
                borderRadius: "999px",
              }}
            />
            <div
              style={{
                width: "18%",
                height: "72%",
                display: "flex",
                borderRadius: "999px 999px 36% 36%",
                background: "#f2d792",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "2%",
                width: "31%",
                height: "31%",
                display: "flex",
                border: `${Math.max(2, Math.round(size * 0.012))}px solid #f9e5af`,
                borderRadius: "50%",
                background: "#b97639",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
