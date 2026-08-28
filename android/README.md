# Android Input Bridge

Planned native layer for turning the gesture events from the mobile tracker into real Android/DeX input.

## Design

`Camera -> MediaPipe -> GestureEngine -> AccessibilityService -> Android input`

The pointer model is intentionally **pointing**, not dragging a visible cursor around. The index finger controls the target location; click gestures act at that location.

## Intended controls

- Index point: aim/select target
- One knock: left click
- Two knocks: right click
- Pinch: grab/drag
- Open-palm hold: Home
- Fist hold: Back
- Vertical motion: scroll

## Implementation notes

The Accessibility Service will be the privileged Android-side output layer. The first native milestone is to prove that gesture events can produce Android click/tap, back, home, and scroll actions reliably. After that, DeX-specific behavior and two-hand controls can be added.
