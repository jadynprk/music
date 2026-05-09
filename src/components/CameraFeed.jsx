import { forwardRef } from "react";

const CameraFeed = forwardRef(function CameraFeed(_, ref) {
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scaleX(-1)",
        pointerEvents: "none",
      }}
    />
  );
});

export default CameraFeed;