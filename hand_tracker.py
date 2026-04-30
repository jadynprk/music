import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision.hand_landmarker import HandLandmarksConnections
import numpy as np
import time

HANDEDNESS_TEXT_COLOR = (88, 205, 54)
LANDMARK_COLOR = (0, 255, 0)
CONNECTION_COLOR = (255, 255, 255)
FINGERTIP_COLOR = (0, 0, 255)  # Red dot for index fingertip

def draw_landmarks_on_image(rgb_image, detection_result):
    hand_landmarks_list = detection_result.hand_landmarks
    handedness_list = detection_result.handedness
    annotated_image = np.copy(rgb_image)
    height, width, _ = annotated_image.shape

    for idx in range(len(hand_landmarks_list)):
        hand_landmarks = hand_landmarks_list[idx]
        handedness = handedness_list[idx]

        points = [(int(lm.x * width), int(lm.y * height)) for lm in hand_landmarks]

        # Draw connections
        for connection in HandLandmarksConnections.HAND_CONNECTIONS:
            start = points[connection.start]
            end = points[connection.end]
            cv2.line(annotated_image, start, end, CONNECTION_COLOR, 2)

        # Draw landmarks
        for point in points:
            cv2.circle(annotated_image, point, 5, LANDMARK_COLOR, -1)

        # Highlight index fingertip (landmark 8)
        fingertip = points[8]
        cv2.circle(annotated_image, fingertip, 12, FINGERTIP_COLOR, -1)
        cv2.putText(annotated_image, f"({fingertip[0]}, {fingertip[1]})",
                    (fingertip[0] + 15, fingertip[1]),
                    cv2.FONT_HERSHEY_DUPLEX, 0.6, FINGERTIP_COLOR, 1)

        # Label handedness
        cv2.putText(annotated_image, handedness[0].category_name,
                    (points[0][0], points[0][1] - 10),
                    cv2.FONT_HERSHEY_DUPLEX, 1, HANDEDNESS_TEXT_COLOR, 1)

    return annotated_image


# Set up landmarker in LIVE_STREAM mode
def make_detector():
    base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        running_mode=vision.RunningMode.IMAGE  # IMAGE mode, one frame at a time
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

    # Flip so it acts like a mirror
    frame = cv2.flip(frame, 1)

    # Convert BGR (OpenCV) to RGB (MediaPipe)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    detection_result = detector.detect(mp_image)
    annotated_frame = draw_landmarks_on_image(rgb_frame, detection_result)

    # Convert back to BGR for display
    display_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
    cv2.imshow("Hand Tracker - Press Q to quit", display_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()