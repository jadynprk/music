import { useEffect, useRef } from "react";

/**
 * Requests the user's webcam and streams it into a <video> element.
 * Returns a ref to attach to the <video> tag.
 *
 * The video is mirrored horizontally (like a selfie camera) so hand
 * movements feel natural.
 */
// export function useCamera() {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     let stream = null;

//     async function startCamera() {
//       try {
//         stream = await navigator.mediaDevices.getUserMedia({
//           video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
//           audio: false,
//         });

//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
//       } catch (err) {
//         console.warn("Camera access denied or unavailable:", err);
//       }
//     }

//     startCamera();

//     return () => {
//       // clean up stream tracks when component unmounts
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   return videoRef;
// }

export function useCamera() {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
      }
    }
    startCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return videoRef;
}