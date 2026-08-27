# Hand Commands

Mobile-first reconstruction of the J.E.S.T.E.R. hand interface.

## Goal

Use the **front-facing camera of an Android phone** to track your hand in real time and turn gestures into pointer/command events.

Designed around the S24 Ultra + RayNeo Air 3S workflow, but the tracker itself does not depend on the glasses.

## Current MVP

- Front-facing camera (`facingMode: user`)
- MediaPipe Hand Landmarker in-browser
- One-hand tracking
- Mirrored live camera preview
- Smoothed index-finger cursor
- Gesture state machine
- One tap/knock = left click
- Two taps/knocks = right click
- Open palm hold = Home
- Fist hold = Back
- Vertical hand motion = scroll
- Pinch = grab/drag state
- Event log for debugging

## Architecture

```text
S24 Ultra FRONT CAMERA
        |
        v
MediaPipe Hand Landmarker
        |
        v
Landmarks -> smoothing -> gesture engine
        |
        +----> pointer / gesture events
        |
        +----> future WebSocket / Android input bridge
```

The gesture engine is deliberately separated from the camera and output transport so the same commands can later drive DeX, a PC, a browser UI, or a J.E.S.T.E.R.-style 3D interface.

## Run

This is a browser prototype. Camera access requires HTTPS or localhost.

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080/`

For phone testing, deploy the repo to any HTTPS static host (GitHub Pages, Vercel, Netlify, etc.).

## Gesture map

| Gesture | Command |
|---|---|
| Point | Move pointer |
| One quick index tap/knock | Left click |
| Two quick taps | Right click |
| Pinch | Grab / drag |
| Open palm held ~700 ms | Home |
| Fist held ~700 ms | Back |
| Hand moves vertically | Scroll |

The click gestures use a debounce window so ordinary finger movement does not generate clicks.

## Next milestones

1. Android native camera pipeline for lower latency.
2. Accessibility-service output for actual Android/DeX pointer/navigation control.
3. Optional WebSocket event transport for external displays.
4. Two-hand interactions: resize, rotate, window control.
5. Configurable gesture bindings.
6. Calibration screen for different phone positions and lighting.
