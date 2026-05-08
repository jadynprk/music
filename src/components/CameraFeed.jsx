// import { useCamera } from "../hooks/useCamera";

// /**
//  * Renders the webcam feed as a full-bleed background behind the grid.
//  * Mirrored horizontally so it feels like a natural selfie view.
//  */
// export default function CameraFeed() {
//   const videoRef = useCamera();

//   return (
//     <video
//       ref={videoRef}
//       autoPlay
//       playsInline
//       muted
//       style={{
//         position: "absolute",
//         inset: 0,
//         width: "100%",
//         height: "100%",
//         objectFit: "cover",
//         transform: "scaleX(-1)", // mirror so it feels like a selfie camera
//         pointerEvents: "none",
//       }}
//     />
//   );
// }

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