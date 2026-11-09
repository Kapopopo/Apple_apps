/**
 * The Camera's arithmetic, kept apart from the component so it can be tested
 * without a device. Every function here is pure; the ones the gestures call on
 * the UI thread are worklets.
 */

/** Which camera the preview reads. */
export type CameraFacing = 'back' | 'front';

/** What the shutter makes. */
export type CameraMode = 'photo' | 'video';

/**
 * The flash setting the control shows. `auto` lets the camera decide for a
 * photo; a video has no auto, so there it reads as off.
 */
export type CameraFlashMode = 'off' | 'auto' | 'on';

/** Seconds the self-timer counts down before a photo. `0` is off. */
export type CameraTimerDelay = 0 | 3 | 10;

/** The timer settings, in the order the control steps through them. */
export const CAMERA_TIMERS: readonly CameraTimerDelay[] = [0, 3, 10];

/**
 * How much of the zoom range a pinch's `scale - 1` is worth: pinching to twice
 * the distance between the fingers moves half the range.
 */
export const PINCH_ZOOM_SENSITIVITY = 0.5;

/** How far one step of the screen reader's adjust moves the zoom. */
export const ZOOM_STEP = 0.1;

/**
 * Zoom as expo-camera takes it: a fraction of the device's maximum, on `[0, 1]`.
 * Anything else, `NaN` included, is pulled back onto that range.
 */
export function clampZoom(value: number): number {
  'worklet';
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * The zoom a pinch reaches from the zoom it started at.
 *
 * Added to rather than multiplied, so a pinch that comes back to where the
 * fingers started comes back to the zoom it started at, instead of compounding.
 */
export function zoomFromPinch(startZoom: number, scale: number): number {
  'worklet';
  return clampZoom(startZoom + (scale - 1) * PINCH_ZOOM_SENSITIVITY);
}

/** The zoom a drag along the zoom bar points at, from where it is on the track. */
export function zoomFromTrack(x: number, width: number): number {
  'worklet';
  if (!(width > 0)) return 0;
  return clampZoom(x / width);
}

/** The zoom one adjust step up (`1`) or down (`-1`) from `zoom` lands on. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const next = Math.round((clampZoom(zoom) + direction * ZOOM_STEP) * 100) / 100;
  return clampZoom(next);
}

/**
 * Which of `stops` the zoom is at, or `-1` between them. Close enough counts,
 * since a pinch rarely lands on a value exactly.
 */
export function activeStop(zoom: number, stops: readonly { value: number }[]): number {
  for (let index = 0; index < stops.length; index += 1) {
    if (Math.abs(clampZoom(stops[index]!.value) - zoom) < 0.005) return index;
  }
  return -1;
}

/**
 * Milliseconds as a recording clock: `mm:ss`, and `h:mm:ss` past an hour.
 * Leading zeros stay, so the clock does not change width as it runs, and
 * `00:00` is what it reads before recording starts.
 */
export function formatDuration(ms: number): string {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** What the flash setting reads as in a mode: a video has no `auto`. */
export function flashIn(mode: CameraMode, flash: CameraFlashMode): CameraFlashMode {
  return mode === 'video' && flash === 'auto' ? 'off' : flash;
}

/**
 * The setting the flash control moves to. A photo cycles off, auto, on; a
 * video only has off and on.
 */
export function nextFlash(mode: CameraMode, flash: CameraFlashMode): CameraFlashMode {
  const current = flashIn(mode, flash);
  if (mode === 'video') return current === 'on' ? 'off' : 'on';
  if (current === 'off') return 'auto';
  if (current === 'auto') return 'on';
  return 'off';
}

/**
 * The `flash` expo-camera is given. It drives stills only, so in video it is
 * off and the torch does the lighting instead.
 */
export function stillFlash(mode: CameraMode, flash: CameraFlashMode): CameraFlashMode {
  return mode === 'video' ? 'off' : flash;
}

/**
 * Whether the torch is lit: in video with the flash on, and only while a clip
 * is being recorded, so it does not glare at the subject while they wait.
 */
export function torchFor(mode: CameraMode, flash: CameraFlashMode, recording: boolean): boolean {
  return mode === 'video' && flash === 'on' && recording;
}

/** The timer setting after `timer`, wrapping back to off. */
export function nextTimer(timer: CameraTimerDelay): CameraTimerDelay {
  const index = CAMERA_TIMERS.indexOf(timer);
  return CAMERA_TIMERS[(index + 1) % CAMERA_TIMERS.length] ?? 0;
}

/**
 * How far a capped recording has run, on `[0, 1]`. Without a cap there is
 * nothing to fill, so it stays `0`.
 */
export function recordingProgress(elapsedMs: number, maxDurationSeconds?: number): number {
  if (!maxDurationSeconds || maxDurationSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / (maxDurationSeconds * 1000)));
}
