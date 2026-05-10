import { useEffect, useRef, useCallback } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

function fingerIsUp(landmarks, tipIdx, pipIdx) {
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

function thumbIsUp(landmarks) {
  return landmarks[4].x > landmarks[3].x;
}

function isOpenPalm(landmarks) {
  return (
    fingerIsUp(landmarks, 8,  6)  &&
    fingerIsUp(landmarks, 12, 10) &&
    fingerIsUp(landmarks, 16, 14) &&
    fingerIsUp(landmarks, 20, 18)
  );
}

function detectSingleHandGesture(landmarks) {
  const indexUp  = fingerIsUp(landmarks, 8,  6);
  const middleUp = fingerIsUp(landmarks, 12, 10);
  const ringUp   = fingerIsUp(landmarks, 16, 14);
  const pinkyUp  = fingerIsUp(landmarks, 20, 18);
  // const thumbUp = thumbIsUp(landmarks);

  // one finger pointing - place note
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "point";

  // peace -- confirm / lock in
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "peace";
  
  if (!indexUp && !middleUp && !ringUp && pinkyUp) return "pinky";
  return null;
}

function detectGestures(landmarks, handedness) {
  let leftLandmarks  = null;
  let rightLandmarks = null;
  let rightFingertip = null;
  let leftGesture    = null;

  landmarks.forEach((hand, i) => {
    const label   = handedness[i][0].categoryName;

    if (label === "Right") {
      rightLandmarks = hand;
      rightFingertip = { x: hand[8].x, y: hand[8].y };
    }
    if (label === "Left") {
      leftLandmarks = hand;
      leftGesture   = detectSingleHandGesture(hand);
    }
  });

  // two-hand gesture takes priority
  const twoHandGesture =
    leftLandmarks && rightLandmarks && isOpenPalm(leftLandmarks) && isOpenPalm(rightLandmarks)
      ? "stop"
      : null;

  return {
    rightFingertip,                                    // { x, y } as 0-1 fractions
    gesture: twoHandGesture ?? leftGesture ?? null,   // single active gesture string
  };
}

/**
 * Loads MediaPipe HandLandmarker and runs detection on every animation frame.
 * videoRef — ref to the <video> element already streaming the webcam.
 * onResult — callback({ rightFingertip, gesture }) called each frame.
 */
export function useHandTracking(videoRef, onResult) {
  const landmarkerRef = useRef(null);
  const rafRef        = useRef(null);
  const onResultRef   = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
      });

      if (cancelled) return;
      landmarkerRef.current = landmarker;

      const loop = () => {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && landmarkerRef.current) {
          const result = landmarkerRef.current.detectForVideo(video, performance.now());
          if (result.landmarks?.length > 0) {
            onResultRef.current(
              detectGestures(result.landmarks, result.handedness)
            );
          } else {
            onResultRef.current({ rightFingertip: null, gesture: null });
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}