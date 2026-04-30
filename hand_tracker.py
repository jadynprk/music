import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision.hand_landmarker import HandLandmarksConnections
import numpy as np

HANDEDNESS_TEXT_COLOR = (255, 138, 255)
LANDMARK_COLOR = (0, 255, 0)
CONNECTION_COLOR = (255, 255, 255)
FINGERTIP_COLOR = (0, 0, 255)
GESTURE_TEXT_COLOR = (0, 255, 255)

# --- Finger state helpers ---

def finger_is_up(landmarks, tip_idx, pip_idx):
    """Returns True if the finger is extended (tip above pip joint)."""
    return landmarks[tip_idx].y < landmarks[pip_idx].y

def detect_gesture(hand_landmarks):
    """Detect left hand gestures from normalized landmarks."""
    lm = hand_landmarks

    index_up = finger_is_up(lm, 8, 6)
    middle_up = finger_is_up(lm, 12, 10)
    ring_up = finger_is_up(lm, 16, 14)
    pinky_up = finger_is_up(lm, 20, 18)
    thumb_up = finger_is_up(lm, 4, 3)

    if index_up and middle_up and not ring_up and not pinky_up:
        return "peace"

    return None


def draw_landmarks_on_image(rgb_image, detection_result):
    hand_landmarks_list = detection_result.hand_landmarks
    handedness_list = detection_result.handedness
    annotated_image = np.copy(rgb_image)
    height, width, _ = annotated_image.shape

    right_fingertip = None

    for idx in range(len(hand_landmarks_list)):
        hand_landmarks = hand_landmarks_list[idx]
        handedness = handedness_list[idx]

        # Flip label to correct for mirror
        raw_label = handedness[0].category_name
        label = "Left" if raw_label == "Right" else "Right"

        points = [(int(lm.x * width), int(lm.y * height)) for lm in hand_landmarks]

        # Draw connections
        for connection in HandLandmarksConnections.HAND_CONNECTIONS:
            cv2.line(annotated_image, points[connection.start], points[connection.end], CONNECTION_COLOR, 2)

        # Draw landmarks
        for point in points:
            cv2.circle(annotated_image, point, 5, LANDMARK_COLOR, -1)

        # Right hand: highlight index fingertip and track position
        if label == "Right":
            fingertip = points[8]
            right_fingertip = fingertip
            cv2.circle(annotated_image, fingertip, 12, FINGERTIP_COLOR, -1)
            cv2.putText(annotated_image, f"({fingertip[0]}, {fingertip[1]})",
                        (fingertip[0] + 15, fingertip[1]),
                        cv2.FONT_HERSHEY_DUPLEX, 0.6, FINGERTIP_COLOR, 1)

        # Left hand: detect and display gesture
        if label == "Left":
            gesture = detect_gesture(hand_landmarks)
            gesture_text = gesture if gesture else "no gesture"
            cv2.putText(annotated_image, gesture_text,
                        (points[0][0] - 20, points[0][1] - 30),
                        cv2.FONT_HERSHEY_DUPLEX, 1.0, GESTURE_TEXT_COLOR, 2)

        # Hand label
        cv2.putText(annotated_image, label,
                    (points[0][0], points[0][1] - 10),
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, HANDEDNESS_TEXT_COLOR, 1)

    return annotated_image, right_fingertip


def make_detector():
    base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        running_mode=vision.RunningMode.IMAGE
    )
    return vision.HandLandmarker.create_from_options(options)


detector = make_detector()
cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("Error: could not open camera")
    exit()

print("Press Q to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    detection_result = detector.detect(mp_image)
    annotated_frame, right_fingertip = draw_landmarks_on_image(rgb_frame, detection_result)

    # You can use right_fingertip (x, y) here for whatever you want
    if right_fingertip:
        print(f"Right index tip: {right_fingertip}", end="\r")

    display_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
    cv2.imshow("Hand Tracker - Press Q to quit", display_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()