/**
 * Camera — a full-screen camera assembled from parts: the viewfinder, the
 * shutter, zoom, flash, a self-timer, the recording clock, front and back, and
 * the button into the library.
 *
 * ```tsx
 * <Camera onCapture={keep}>
 *   <Camera.Preview />
 *   <Camera.Header>
 *     <Camera.Flash />
 *     <Camera.Duration />
 *     <Camera.Timer />
 *   </Camera.Header>
 *   <Camera.Footer>
 *     <Camera.Zoom />
 *     <Camera.Modes />
 *     <Camera.Controls>
 *       <Camera.Library source={last} onPress={openLibrary} />
 *       <Camera.Shutter />
 *       <Camera.Flip />
 *     </Camera.Controls>
 *   </Camera.Footer>
 * </Camera>
 * ```
 *
 * ## The result is the app's
 *
 * A photo or a clip is handed to `onCapture` as the file the camera wrote, and
 * nothing else happens to it here. Saving it to the photo library, holding it
 * in memory for a preview, uploading it: each app wants a different one, and a
 * component that picked would be wrong for most of them. The library button is
 * the same — it draws the thumbnail it is given and calls `onPress`.
 *
 * ## Every part reads one state
 *
 * The root owns facing, mode, flash, zoom and the timer, each controlled or
 * not, and every part reads them through context. `useCamera()` hands the same
 * state and actions to anything else, so a part that does not suit can be
 * swapped for a control of the app's own without losing the behaviour behind
 * it. Leave a part out and its feature is simply not offered.
 *
 * ## Built on expo-camera
 *
 * The preview, the capture and the recording are expo-camera's, which runs in
 * Expo Go. It is an optional dependency: without it the preview says so, and
 * `hasCamera` is false.
 *
 * Its zoom is a fraction of the device's maximum, and that maximum is not
 * exposed — on iOS the fraction is an exponent of it, on Android a multiple —
 * so the same zoom is a different magnification on every phone. That is why
 * nothing here labels a zoom "2×" on its own: the stops are the app's to name,
 * and between them a bar shows where in the range the lens is.
 *
 * There is no way to focus on a point either, so a tap on the preview does
 * nothing rather than draw a square over a focus that never moved.
 *
 * ## Over a black viewfinder
 *
 * The viewfinder is black in every theme and the picture on it is whatever
 * the lens sees, so the chrome over it is white on a dark glaze in every theme.
 * An active control is drawn inverted, white with a black glyph, which reads on
 * any picture; recording is the destructive colour.
 *
 * Switching cameras hides the swap under a brief dark cover rather than
 * turning the preview: on Android the preview is a surface that ignores view
 * transforms, and the frame where one session hands over to the other is not
 * something to show.
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type Ref,
  type RefAttributes,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { tv } from 'tailwind-variants';
import { useCSSVariable } from 'uniwind';
import {
  CameraIcon,
  CameraSwitchIcon,
  FlashIcon,
  FlashOffIcon,
  IconColorProvider,
  ImageIcon,
  TimerIcon,
} from '@/components/ui/icons';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { useControllableState } from '@/components/ui/controllable-state';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { impactKnock, selectionTick } from '@/lib/haptics';
import {
  activeStop,
  clampZoom,
  flashIn,
  formatDuration,
  nextFlash,
  nextTimer,
  stepZoom,
  stillFlash,
  torchFor,
  zoomFromPinch,
  zoomFromTrack,
  type CameraFacing,
  type CameraFlashMode,
  type CameraMode,
  type CameraTimerDelay,
} from '@/components/ui/camera-model';

export type { CameraFacing, CameraFlashMode, CameraMode, CameraTimerDelay } from '@/components/ui/camera-model';

/** Glyphs over the viewfinder, which is black in every theme. */
const ON_GLASS = '#ffffff';
/** Glyphs on an active control, which is drawn white. */
const ON_ACTIVE = '#000000';

/** The shutter's outer diameter, its ring, and the disc inside it. */
const SHUTTER = 78;
const SHUTTER_RING = 4;
const SHUTTER_DISC = 62;
/** The disc while recording: a rounded square, so stopping reads as a stop. */
const SHUTTER_STOP = 28;
const RING_RADIUS = SHUTTER / 2 - SHUTTER_RING / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** How long the shutter has to be held, in video, before holding records. */
const HOLD_TO_RECORD_MS = 300;

/** The flip cover: out, a hold while the native session swaps, and back. */
const FLIP_OUT_MS = 140;
const FLIP_HOLD_MS = 220;
const FLIP_IN_MS = 200;

/** A stop that lands as a recording starts can be dropped natively; it is sent again after this. */
const STOP_RETRY_MS = 500;

/**
 * How long a press made before the camera has reported it started waits for that
 * report before trying anyway. The report can reach JavaScript late, so a press is
 * held rather than dropped.
 */
const READY_GRACE_MS = 1500;

const ZOOM_BAR_WIDTH = 200;
const ZOOM_TICKS = 21;

const DEFAULT_ZOOM_STOPS: CameraZoomStop[] = [{ value: 0, label: '1×' }];

const FLASH_LABELS: Record<CameraFlashMode, string> = { off: 'Off', auto: 'Auto', on: 'On' };
const MODE_LABELS: Record<CameraMode, string> = { photo: 'Photo', video: 'Video' };
const MODE_ORDER: CameraMode[] = ['video', 'photo'];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const cameraVariants = tv({
  slots: {
    root: 'flex-1 overflow-hidden bg-black',
    header: 'flex-row items-center justify-between px-4',
    footer: 'items-center gap-4 px-6',
    controls: 'w-full flex-row items-center justify-between',
  },
});

const chromeButton = tv({
  base: 'h-10 min-w-10 flex-row items-center justify-center gap-1 rounded-full px-2.5',
  variants: {
    active: { true: 'bg-white', false: 'bg-black/40' },
    // Both values are written, so the enabled state never depends on a class being removed.
    disabled: { true: 'opacity-40', false: 'opacity-100' },
  },
  defaultVariants: { active: false, disabled: false },
});

const chromeText = tv({
  base: 'font-semibold',
  variants: { active: { true: 'text-black', false: 'text-white' } },
  defaultVariants: { active: false },
});

const durationPill = tv({
  base: 'h-8 flex-row items-center gap-1.5 rounded-full px-3',
  variants: { recording: { true: 'bg-destructive', false: 'bg-black/40' } },
  defaultVariants: { recording: false },
});

/* -------------------------------------------------------------------------- */
/* expo-camera, loaded if it is there                                         */
/* -------------------------------------------------------------------------- */

interface PermissionState {
  granted: boolean;
  canAskAgain: boolean;
}

/** The picture expo-camera returns. */
interface CapturedPicture {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: Record<string, unknown>;
}

/**
 * The methods of expo-camera's `CameraView` this component calls, and the ones
 * an app is likeliest to reach for through `CameraHandle.view`.
 */
export interface CameraViewHandle {
  takePictureAsync(options?: object): Promise<CapturedPicture | undefined>;
  recordAsync(options?: object): Promise<{ uri: string } | undefined>;
  stopRecording(): void;
  pausePreview(): Promise<void>;
  resumePreview(): Promise<void>;
}

type PermissionHook = () => readonly [PermissionState | null, () => Promise<PermissionState>, ...unknown[]];

interface ExpoCameraModule {
  CameraView: ComponentType<Record<string, unknown> & RefAttributes<CameraViewHandle>>;
  useCameraPermissions: PermissionHook;
  Camera: {
    getMicrophonePermissionsAsync(): Promise<PermissionState>;
    requestMicrophonePermissionsAsync(): Promise<PermissionState>;
  };
}

/**
 * `expo-camera`, or null when it is not installed or its native module is
 * missing from the build. The `require` sits directly in its `try` block, which
 * is what lets Metro bundle an app that does not have the package.
 */
function loadExpoCamera(): ExpoCameraModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-camera') as ExpoCameraModule;
  } catch {
    return null;
  }
}

const expoCamera = loadExpoCamera();

/**
 * True when the camera can be shown, because `expo-camera` is installed and its
 * native module is in the build. Expo Go has it.
 */
export const hasCamera = expoCamera !== null;

const NO_PERMISSION = [null, async () => ({ granted: false, canAskAgain: false })] as const;
function useMissingPermission() {
  return NO_PERMISSION;
}
/** Chosen once: whether the package is there cannot change while the app runs. */
const useCameraPermission: PermissionHook = expoCamera?.useCameraPermissions ?? useMissingPermission;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** A photo, as the camera wrote it. */
export interface CameraPhoto {
  type: 'photo';
  /** A local file. */
  uri: string;
  width: number;
  height: number;
  /** Present when `pictureOptions.base64` is set. */
  base64?: string;
  /** Present when `pictureOptions.exif` is set. */
  exif?: Record<string, unknown>;
}

/** A clip, as the camera wrote it. */
export interface CameraVideo {
  type: 'video';
  /** A local file. */
  uri: string;
  /** How long it ran, in milliseconds, measured from when recording started. */
  duration: number;
}

export type CameraCapture = CameraPhoto | CameraVideo;

/** Options for each photo, passed to expo-camera's `takePictureAsync`. */
export interface CameraPictureOptions {
  /** JPEG quality, 0–1. Default 1. */
  quality?: number;
  /** Also return the image as base64. */
  base64?: boolean;
  /** Also return its EXIF data. */
  exif?: boolean;
  /** Skip orientation and quality processing, for speed. */
  skipProcessing?: boolean;
  /** Play the shutter sound. Default true; some regions require it. */
  shutterSound?: boolean;
}

/**
 * Props passed straight to expo-camera's `CameraView`, for what the parts do not
 * cover. The parts' own state wins over the same prop here.
 */
export interface CameraViewOptions {
  videoQuality?: '2160p' | '1080p' | '720p' | '480p' | '4:3';
  videoStabilizationMode?: 'off' | 'standard' | 'cinematic' | 'auto';
  /** Android only: the preview's aspect ratio. */
  ratio?: '4:3' | '16:9' | '1:1';
  /** iOS only: which lens, from `getAvailableLensesAsync`. */
  selectedLens?: string;
  pictureSize?: string;
  animateShutter?: boolean;
  [key: string]: unknown;
}

/** One zoom stop: a value in expo-camera's range, and the label the app gives it. */
export interface CameraZoomStop {
  /** 0–1, a fraction of the device's maximum zoom. */
  value: number;
  /** What the chip says, such as `1×` or `2`. */
  label: string;
  /** Read out instead of `Zoom <label>`. */
  accessibilityLabel?: string;
}

/** What `useCamera()` returns: the camera's state, and what can be done with it. */
export interface CameraState {
  facing: CameraFacing;
  mode: CameraMode;
  /** The setting as chosen. In video, `auto` acts as off. */
  flash: CameraFlashMode;
  /** 0–1, a fraction of the device's maximum. */
  zoom: number;
  timer: CameraTimerDelay;
  /** The camera has started and can capture. */
  ready: boolean;
  /** Camera access, or null until it is known. */
  permission: { granted: boolean; canAskAgain: boolean } | null;
  recording: boolean;
  /** When recording started, as `Date.now()`, or null. */
  recordingSince: number | null;
  /** A photo is being taken. */
  capturing: boolean;
  /** Seconds left on the self-timer, or null when it is not counting. */
  countdown: number | null;
  /** The recording cap, in seconds, when there is one. */
  maxDuration?: number;
  setMode: (mode: CameraMode) => void;
  setFlash: (flash: CameraFlashMode) => void;
  setZoom: (zoom: number) => void;
  setTimer: (timer: CameraTimerDelay) => void;
  /** Swap front and back. Ignored while recording. */
  flip: () => void;
  /** What a press on the shutter does in the current mode. */
  press: () => void;
  takePhoto: () => Promise<CameraPhoto | null>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelCountdown: () => void;
  requestPermission: () => void;
}

/** A ref on `Camera`. */
export interface CameraHandle {
  /** Takes a photo now, ignoring the timer, and resolves to it, or null if it failed. */
  takePhoto: () => Promise<CameraPhoto | null>;
  /** Starts recording; resolves once the clip has been handed to `onCapture`. */
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  flip: () => void;
  /** expo-camera's `CameraView`, for anything this component does not wrap. */
  readonly view: CameraViewHandle | null;
}

interface CameraContextValue extends CameraState {
  available: boolean;
  canCapture: boolean;
  viewRef: RefObject<CameraViewHandle | null>;
  onReady: () => void;
  onMountError: (event: { message?: string }) => void;
  cover: SharedValue<number>;
  turn: SharedValue<number>;
  haptics: boolean;
  safeArea: boolean;
  mute: boolean;
  mirror: boolean;
  cameraProps?: CameraViewOptions;
}

const CameraContext = createContext<CameraContextValue | null>(null);

function useCameraContext(part: string): CameraContextValue {
  const context = useContext(CameraContext);
  if (!context) throw new Error(`${part} must be rendered inside <Camera>.`);
  return context;
}

/**
 * The camera's state and actions, for a control of the app's own inside
 * `<Camera>` — a shutter drawn differently, a timer in a menu.
 */
export function useCamera(): CameraState {
  return useCameraContext('useCamera()');
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'The camera failed.');
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export interface CameraProps extends ViewProps {
  /** Classes on the root, which fills its parent and is black. */
  className?: string;
  /** The parts. Put `Camera.Preview` first, so everything after it is drawn over the picture. */
  children?: ReactNode;
  /** Which camera, controlled. */
  facing?: CameraFacing;
  /** Which camera it opens on. */
  defaultFacing?: CameraFacing;
  /** Called when the camera switches between front and back. */
  onFacingChange?: (facing: CameraFacing) => void;
  /** Photo or video, controlled. */
  mode?: CameraMode;
  /** Photo or video to start in. */
  defaultMode?: CameraMode;
  /** Called when the mode changes. */
  onModeChange?: (mode: CameraMode) => void;
  /** The flash setting, controlled. In video, `on` lights the torch while recording. */
  flash?: CameraFlashMode;
  /** The flash setting to start with. */
  defaultFlash?: CameraFlashMode;
  /** Called when the flash setting changes. */
  onFlashChange?: (flash: CameraFlashMode) => void;
  /**
   * Zoom, controlled: 0–1, a fraction of the device's maximum zoom, which is a
   * different magnification on every phone. Reset to 0 when the camera flips.
   */
  zoom?: number;
  /** The zoom to start at. */
  defaultZoom?: number;
  /** Called as the zoom changes, many times during a pinch. */
  onZoomChange?: (zoom: number) => void;
  /** The self-timer, in seconds, controlled. Photos only. */
  timer?: CameraTimerDelay;
  /** The self-timer to start with. */
  defaultTimer?: CameraTimerDelay;
  /** Called when the self-timer setting changes. */
  onTimerChange?: (timer: CameraTimerDelay) => void;
  /**
   * Called with each photo and clip. Nothing is saved: the file is where the
   * camera wrote it, and keeping it, saving it or uploading it is up to you.
   */
  onCapture?: (capture: CameraCapture) => void;
  /**
   * Called when the camera fails to start, a capture fails, or microphone
   * access is refused. Without it, these are logged in development.
   */
  onError?: (error: Error) => void;
  /** Stops a recording after this many seconds, and fills the shutter's ring towards it. */
  maxDuration?: number;
  /** Record without sound, and without asking for the microphone. */
  mute?: boolean;
  /**
   * Save front-camera photos and clips mirrored, the way the preview shows
   * them. Off, they are saved the way other people see you.
   */
  mirror?: boolean;
  /** Options for every photo. */
  pictureOptions?: CameraPictureOptions;
  /** Passed to expo-camera's `CameraView`. */
  cameraProps?: CameraViewOptions;
  /** A tick on the shutter, the flip and each setting change. */
  haptics?: boolean;
  /** Keep the header and footer clear of the notch and the home indicator. */
  safeArea?: boolean;
}

function CameraRoot(
  {
    facing: facingProp,
    defaultFacing = 'back',
    onFacingChange,
    mode: modeProp,
    defaultMode = 'photo',
    onModeChange,
    flash: flashProp,
    defaultFlash = 'off',
    onFlashChange,
    zoom: zoomProp,
    defaultZoom = 0,
    onZoomChange,
    timer: timerProp,
    defaultTimer = 0,
    onTimerChange,
    onCapture,
    onError,
    maxDuration,
    mute = false,
    mirror = false,
    pictureOptions,
    cameraProps,
    haptics = true,
    safeArea = true,
    className,
    children,
    ...props
  }: CameraProps,
  ref: Ref<CameraHandle>
) {
  const reduced = useReducedMotion();
  const { value: facing, setValue: setFacing } = useControllableState({
    value: facingProp,
    defaultValue: defaultFacing,
    onChange: onFacingChange,
  });
  const { value: mode, setValue: setModeState } = useControllableState({
    value: modeProp,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });
  const { value: flash, setValue: setFlashState } = useControllableState({
    value: flashProp,
    defaultValue: defaultFlash,
    onChange: onFlashChange,
  });
  const { value: zoom, setValue: setZoomState } = useControllableState({
    value: zoomProp,
    defaultValue: defaultZoom,
    onChange: onZoomChange,
    normalize: clampZoom,
  });
  const { value: timer, setValue: setTimerState } = useControllableState({
    value: timerProp,
    defaultValue: defaultTimer,
    onChange: onTimerChange,
  });

  const [permission, requestPermissionAsync] = useCameraPermission();
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const viewRef = useRef<CameraViewHandle | null>(null);
  const cover = useSharedValue(0);
  const turn = useSharedValue(0);

  // The latest of everything an async capture reads after it has started.
  const latest = useRef({ onCapture, onError, pictureOptions, maxDuration, mute, haptics });
  latest.current = { onCapture, onError, pictureOptions, maxDuration, mute, haptics };
  const facingRef = useRef(facing);
  facingRef.current = facing;

  const capturingRef = useRef(false);
  const recordingRef = useRef(false);
  const generationRef = useRef(0);
  const cancelStartRef = useRef(false);
  const flippingRef = useRef(false);
  const readyRef = useRef(false);
  const pendingRef = useRef<{ run: () => void; drop: () => void } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const report = useCallback((error: unknown) => {
    const failure = toError(error);
    if (latest.current.onError) latest.current.onError(failure);
    else if (__DEV__) console.warn(`[Camera] ${failure.message}`);
  }, []);

  const requestPermission = useCallback(() => {
    requestPermissionAsync().catch(report);
  }, [report, requestPermissionAsync]);

  const setZoom = useCallback((next: number) => setZoomState(clampZoom(next)), [setZoomState]);
  const setFlash = useCallback((next: CameraFlashMode) => setFlashState(next), [setFlashState]);
  const setTimer = useCallback((next: CameraTimerDelay) => setTimerState(next), [setTimerState]);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
  }, []);

  const capturePhoto = useCallback(async (): Promise<CameraPhoto | null> => {
    const view = viewRef.current;
    if (!view || capturingRef.current || recordingRef.current) return null;
    capturingRef.current = true;
    setCapturing(true);
    if (latest.current.haptics) impactKnock();
    try {
      const picture = await view.takePictureAsync({ quality: 1, ...latest.current.pictureOptions });
      if (!picture) return null;
      const photo: CameraPhoto = {
        type: 'photo',
        uri: picture.uri,
        width: picture.width,
        height: picture.height,
        ...(picture.base64 ? { base64: picture.base64 } : null),
        ...(picture.exif ? { exif: picture.exif } : null),
      };
      latest.current.onCapture?.(photo);
      return photo;
    } catch (error) {
      report(error);
      return null;
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, [report]);

  const record = useCallback(async () => {
    const view = viewRef.current;
    if (!view || recordingRef.current || capturingRef.current) return;
    recordingRef.current = true;
    cancelStartRef.current = false;
    const generation = ++generationRef.current;
    let since: number | null = null;
    try {
      if (!latest.current.mute && expoCamera) {
        let microphone = await expoCamera.Camera.getMicrophonePermissionsAsync();
        if (!microphone.granted && microphone.canAskAgain) {
          microphone = await expoCamera.Camera.requestMicrophonePermissionsAsync();
        }
        if (!microphone.granted) {
          throw new Error(
            'Recording with sound needs microphone access. Allow it in Settings, or pass `mute` to record without sound.'
          );
        }
      }
      // Let go of the shutter while the microphone was being asked for: no recording.
      if (cancelStartRef.current) return;
      since = Date.now();
      setRecordingSince(since);
      if (latest.current.haptics) impactKnock();
      AccessibilityInfo.announceForAccessibility('Recording');
      const cap = latest.current.maxDuration;
      const result = await view.recordAsync(cap ? { maxDuration: cap } : {});
      if (result?.uri) {
        latest.current.onCapture?.({ type: 'video', uri: result.uri, duration: Date.now() - since });
      }
    } catch (error) {
      report(error);
    } finally {
      if (generationRef.current === generation) {
        recordingRef.current = false;
        setRecordingSince(null);
        if (since !== null) AccessibilityInfo.announceForAccessibility('Recording stopped');
      }
    }
  }, [report]);

  /**
   * Runs a capture now if the camera has started, or once it has. Only one waits
   * at a time: a newer press replaces it, and the replaced one resolves to the
   * fallback.
   */
  const whenReady = useCallback(<T,>(action: () => Promise<T>, fallback: T): Promise<T> => {
    if (readyRef.current) return action();
    return new Promise<T>((resolve) => {
      pendingRef.current?.drop();
      const pending = {
        run: () => {
          pendingRef.current = null;
          action().then(resolve, () => resolve(fallback));
        },
        drop: () => {
          pendingRef.current = null;
          resolve(fallback);
        },
      };
      pendingRef.current = pending;
      setTimeout(() => {
        if (pendingRef.current === pending) pending.run();
      }, READY_GRACE_MS);
    });
  }, []);

  const takePhoto = useCallback(() => whenReady(capturePhoto, null), [capturePhoto, whenReady]);
  const startRecording = useCallback(
    () => whenReady(record, undefined),
    [record, whenReady]
  );

  const stopRecording = useCallback(() => {
    // A recording still waiting for the camera to start is simply not started.
    if (pendingRef.current) {
      pendingRef.current.drop();
      return;
    }
    if (!recordingRef.current) return;
    cancelStartRef.current = true;
    const generation = generationRef.current;
    viewRef.current?.stopRecording();
    setTimeout(() => {
      if (recordingRef.current && generationRef.current === generation) {
        viewRef.current?.stopRecording();
      }
    }, STOP_RETRY_MS);
  }, []);

  const startCountdown = useCallback(
    (seconds: number) => {
      let left = seconds;
      setCountdown(left);
      if (latest.current.haptics) selectionTick();
      countdownRef.current = setInterval(() => {
        left -= 1;
        if (left > 0) {
          setCountdown(left);
          if (latest.current.haptics) selectionTick();
          return;
        }
        clearCountdown();
        void capturePhoto();
      }, 1000);
    },
    [capturePhoto, clearCountdown]
  );

  const setMode = useCallback(
    (next: CameraMode) => {
      if (recordingRef.current) return;
      clearCountdown();
      if (latest.current.haptics) selectionTick();
      setModeState(next);
    },
    [clearCountdown, setModeState]
  );

  const commitFlip = useCallback(() => {
    setFacing(facingRef.current === 'back' ? 'front' : 'back');
    // Zoom belongs to one camera; carried across it would be a different view on the other.
    setZoomState(0);
  }, [setFacing, setZoomState]);

  const endFlip = useCallback(() => {
    flippingRef.current = false;
  }, []);

  const flip = useCallback(() => {
    if (flippingRef.current || recordingRef.current) return;
    if (latest.current.haptics) selectionTick();
    turn.value = withTiming(Math.round(turn.value) + 1, {
      duration: reduced ? 0 : 320,
      easing: Easing.out(Easing.cubic),
    });
    if (reduced || !permission?.granted) {
      commitFlip();
      return;
    }
    flippingRef.current = true;
    cover.value = withSequence(
      withTiming(1, { duration: FLIP_OUT_MS, easing: Easing.in(Easing.quad) }, (finished) => {
        'worklet';
        if (finished) runOnJS(commitFlip)();
      }),
      // A delay rather than a second timing to 1: the hold is what gives the
      // native session time to swap before the cover lifts.
      withDelay(
        FLIP_HOLD_MS,
        withTiming(0, { duration: FLIP_IN_MS, easing: Easing.out(Easing.quad) }, () => {
          'worklet';
          runOnJS(endFlip)();
        })
      )
    );
  }, [commitFlip, cover, endFlip, permission?.granted, reduced, turn]);

  const press = useCallback(() => {
    if (mode === 'video') {
      if (recordingRef.current || pendingRef.current) stopRecording();
      else void startRecording();
      return;
    }
    if (countdownRef.current) {
      clearCountdown();
      return;
    }
    if (timer > 0) startCountdown(timer);
    else void takePhoto();
  }, [clearCountdown, mode, startCountdown, startRecording, stopRecording, takePhoto, timer]);

  const onReady = useCallback(() => {
    readyRef.current = true;
    setReady(true);
    pendingRef.current?.run();
  }, []);
  const onMountError = useCallback(
    (event: { message?: string }) => report(new Error(event?.message ?? 'The camera could not start.')),
    [report]
  );

  // Leaving the screen ends whatever was in flight.
  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      pendingRef.current?.drop();
      if (recordingRef.current) viewRef.current?.stopRecording();
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      takePhoto,
      startRecording,
      stopRecording,
      flip,
      get view() {
        return viewRef.current;
      },
    }),
    [flip, startRecording, stopRecording, takePhoto]
  );

  const recording = recordingSince !== null;
  const available = expoCamera !== null;
  // Not gated on `ready`: the shutter is usable as soon as there is a camera, and a
  // press that comes before it has started waits for it (see `whenReady`).
  const canCapture = available && !!permission?.granted && !capturing;

  const context = useMemo<CameraContextValue>(
    () => ({
      facing,
      mode,
      flash,
      zoom,
      timer,
      ready,
      permission,
      recording,
      recordingSince,
      capturing,
      countdown,
      maxDuration,
      setMode,
      setFlash,
      setZoom,
      setTimer,
      flip,
      press,
      takePhoto,
      startRecording,
      stopRecording,
      cancelCountdown: clearCountdown,
      requestPermission,
      available,
      canCapture,
      viewRef,
      onReady,
      onMountError,
      cover,
      turn,
      haptics,
      safeArea,
      mute,
      mirror,
      cameraProps,
    }),
    [
      available,
      cameraProps,
      canCapture,
      capturing,
      clearCountdown,
      countdown,
      cover,
      facing,
      flash,
      flip,
      haptics,
      maxDuration,
      mirror,
      mode,
      mute,
      onMountError,
      onReady,
      permission,
      press,
      ready,
      recording,
      recordingSince,
      requestPermission,
      safeArea,
      setFlash,
      setMode,
      setTimer,
      setZoom,
      startRecording,
      stopRecording,
      takePhoto,
      timer,
      turn,
      zoom,
    ]
  );

  const { root } = cameraVariants();

  return (
    <CameraContext.Provider value={context}>
      <View {...props} className={root({ className })}>
        {children}
      </View>
    </CameraContext.Provider>
  );
}

const CameraForwarded = forwardRef<CameraHandle, CameraProps>(CameraRoot);
CameraForwarded.displayName = 'Camera';

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

export interface CameraPreviewProps extends ViewProps {
  className?: string;
  /** Drawn over the picture, under the header and footer: a grid, a guide, a frame. */
  children?: ReactNode;
  /** Two fingers zoom. */
  pinchToZoom?: boolean;
  /** A double tap swaps front and back. */
  doubleTapToFlip?: boolean;
  /** Shown while camera access has not been given. */
  permissionTitle?: string;
  permissionDescription?: string;
  /** The button that asks for access. */
  permissionAction?: string;
  /** The button once access has been refused for good, which opens Settings. */
  settingsAction?: string;
  /** Read out for the viewfinder, which a screen reader adjusts to zoom. */
  accessibilityLabel?: string;
}

/**
 * The live picture, filling the camera. Until camera access is given it asks
 * for it in place, and once access is refused for good its button opens
 * Settings, since asking again would do nothing.
 */
function CameraPreview({
  className,
  children,
  pinchToZoom = true,
  doubleTapToFlip = true,
  permissionTitle = 'Camera access',
  permissionDescription = 'Allow access to the camera to take photos and record video.',
  permissionAction = 'Allow camera',
  settingsAction = 'Open Settings',
  accessibilityLabel = 'Camera viewfinder',
  style,
  ...props
}: CameraPreviewProps) {
  const camera = useCameraContext('Camera.Preview');
  const { setZoom, flip, cover } = camera;

  const zoomShared = useSharedValue(camera.zoom);
  const pinchStart = useSharedValue(0);
  useEffect(() => {
    zoomShared.value = camera.zoom;
  }, [camera.zoom, zoomShared]);

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onStart(() => {
        'worklet';
        pinchStart.value = zoomShared.value;
      })
      .onUpdate((event) => {
        'worklet';
        const next = zoomFromPinch(pinchStart.value, event.scale);
        if (Math.abs(next - zoomShared.value) < 0.002) return;
        zoomShared.value = next;
        runOnJS(setZoom)(next);
      })
      .enabled(pinchToZoom);
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((_event, success) => {
        'worklet';
        if (success) runOnJS(flip)();
      })
      .enabled(doubleTapToFlip);
    return Gesture.Simultaneous(pinch, doubleTap);
  }, [doubleTapToFlip, flip, pinchStart, pinchToZoom, setZoom, zoomShared]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));

  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'increment') setZoom(stepZoom(camera.zoom, 1));
      else if (event.nativeEvent.actionName === 'decrement') setZoom(stepZoom(camera.zoom, -1));
    },
    [camera.zoom, setZoom]
  );

  let content: ReactNode = null;
  if (!expoCamera) {
    content = (
      <Notice
        title="Camera unavailable"
        description="Install expo-camera to show the camera: npx expo install expo-camera"
      />
    );
  } else if (camera.permission && !camera.permission.granted) {
    const settings = !camera.permission.canAskAgain;
    content = (
      <Notice
        title={permissionTitle}
        description={permissionDescription}
        action={settings ? settingsAction : permissionAction}
        onAction={settings ? () => void Linking.openSettings() : camera.requestPermission}
      />
    );
  } else if (camera.permission?.granted) {
    const { CameraView } = expoCamera;
    content = (
      <>
        <GestureDetector gesture={gesture}>
          <View
            style={StyleSheet.absoluteFill}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(camera.zoom * 100) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={onAccessibilityAction}
          >
            <CameraView
              {...camera.cameraProps}
              ref={camera.viewRef}
              style={StyleSheet.absoluteFill}
              facing={camera.facing}
              mode={camera.mode === 'video' ? 'video' : 'picture'}
              flash={stillFlash(camera.mode, camera.flash)}
              enableTorch={torchFor(camera.mode, flashIn(camera.mode, camera.flash), camera.recording)}
              zoom={camera.zoom}
              mute={camera.mute}
              mirror={camera.mirror}
              onCameraReady={camera.onReady}
              onMountError={camera.onMountError}
            />
          </View>
        </GestureDetector>
        {children ? (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {children}
          </View>
        ) : null}
        {camera.countdown !== null ? <Countdown value={camera.countdown} /> : null}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, coverStyle]}
          className="bg-black"
        />
      </>
    );
  }

  return (
    <View {...props} style={[StyleSheet.absoluteFill, style]} className={cn('bg-black', className)}>
      {content}
    </View>
  );
}
CameraPreview.displayName = 'Camera.Preview';

function Countdown({ value }: { value: number }) {
  return (
    <Animated.View
      key={value}
      entering={FadeIn.duration(120)}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      className="items-center justify-center"
      accessibilityLiveRegion="polite"
    >
      <Text
        weight="semibold"
        className="text-white"
        style={{ fontSize: 120, lineHeight: 132, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

function Notice({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center gap-3 px-10">
      <View className="opacity-60">
        <CameraIcon size={32} color={ON_GLASS} />
      </View>
      <Text size="lg" weight="semibold" className="text-center text-white">
        {title}
      </Text>
      <Text size="sm" className="text-center text-white/70">
        {description}
      </Text>
      {action && onAction ? (
        <AnimatedPressable
          onPress={onAction}
          accessibilityRole="button"
          className="mt-2 h-11 items-center justify-center rounded-full bg-white px-5"
        >
          <Text size="sm" weight="semibold" className="text-black">
            {action}
          </Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Header, footer, controls                                                   */
/* -------------------------------------------------------------------------- */

export interface CameraHeaderProps extends ViewProps {
  className?: string;
  children?: ReactNode;
}

/** The band along the top, over the picture: flash, the clock, the timer. */
function CameraHeader({ className, children, style, ...props }: CameraHeaderProps) {
  const camera = useCameraContext('Camera.Header');
  const insets = useSafeAreaInsets();
  const { header } = cameraVariants();
  return (
    <View
      {...props}
      pointerEvents="box-none"
      style={[
        { position: 'absolute', left: 0, right: 0, top: (camera.safeArea ? insets.top : 0) + 8 },
        style,
      ]}
      className={header({ className })}
    >
      {children}
    </View>
  );
}
CameraHeader.displayName = 'Camera.Header';

export interface CameraFooterProps extends ViewProps {
  className?: string;
  children?: ReactNode;
}

/** The band along the bottom, over the picture: zoom, the modes, the shutter row. */
function CameraFooter({ className, children, style, ...props }: CameraFooterProps) {
  const camera = useCameraContext('Camera.Footer');
  const insets = useSafeAreaInsets();
  const { footer } = cameraVariants();
  return (
    <View
      {...props}
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (camera.safeArea ? insets.bottom : 0) + 16,
        },
        style,
      ]}
      className={footer({ className })}
    >
      {children}
    </View>
  );
}
CameraFooter.displayName = 'Camera.Footer';

export interface CameraControlsProps extends ViewProps {
  className?: string;
  children?: ReactNode;
}

/**
 * The row the shutter sits in, with what goes either side of it. Library and
 * Flip are the same size, so the shutter lands in the middle.
 */
function CameraControls({ className, children, ...props }: CameraControlsProps) {
  useCameraContext('Camera.Controls');
  const { controls } = cameraVariants();
  return (
    <View {...props} pointerEvents="box-none" className={controls({ className })}>
      {children}
    </View>
  );
}
CameraControls.displayName = 'Camera.Controls';

/* -------------------------------------------------------------------------- */
/* Settings over the picture                                                  */
/* -------------------------------------------------------------------------- */

interface ChromeButtonProps extends Omit<PressableProps, 'children'> {
  active?: boolean;
  className?: string;
  children: ReactNode;
}

function ChromeButton({ active = false, disabled, className, children, ...props }: ChromeButtonProps) {
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      hitSlop={6}
      pressScale={0.92}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: active }}
      className={chromeButton({ active, disabled: !!disabled, className })}
    >
      {children}
    </AnimatedPressable>
  );
}

export interface CameraButtonProps extends Omit<PressableProps, 'children'> {
  className?: string;
  /** Drawn inverted, white with a black glyph, for a setting that is on. */
  active?: boolean;
  /** An icon. It is drawn white, or black when `active`, unless it is given a colour of its own. */
  children: ReactNode;
}

/**
 * A round control over the picture for an action of your own: closing the
 * camera, a grid, a setting. It is drawn like Flash and Timer, so a row of
 * them reads as one set. Give it an `accessibilityLabel`; an icon has nothing
 * to read out.
 */
function CameraButton({ className, active = false, children, ...props }: CameraButtonProps) {
  useCameraContext('Camera.Button');
  return (
    <ChromeButton {...props} active={active} className={className}>
      <IconColorProvider color={active ? ON_ACTIVE : ON_GLASS}>{children}</IconColorProvider>
    </ChromeButton>
  );
}
CameraButton.displayName = 'Camera.Button';

export interface CameraFlashProps extends Omit<PressableProps, 'children' | 'onPress'> {
  className?: string;
  /** What each setting is read out as; `auto`'s is also shown beside the icon. */
  labels?: Partial<Record<CameraFlashMode, string>>;
  accessibilityLabel?: string;
}

/**
 * The flash. For a photo it steps off, auto, on; for a video, off and on, and
 * on lights the torch while recording.
 */
function CameraFlashControl({
  className,
  labels,
  accessibilityLabel = 'Flash',
  ...props
}: CameraFlashProps) {
  const camera = useCameraContext('Camera.Flash');
  const shown = flashIn(camera.mode, camera.flash);
  const label = { ...FLASH_LABELS, ...labels }[shown];
  const active = shown === 'on';
  const color = active ? ON_ACTIVE : ON_GLASS;
  return (
    <ChromeButton
      {...props}
      active={active}
      onPress={() => {
        if (camera.haptics) selectionTick();
        camera.setFlash(nextFlash(camera.mode, camera.flash));
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: label }}
      className={className}
    >
      {shown === 'off' ? <FlashOffIcon size={20} color={color} /> : <FlashIcon size={20} color={color} />}
      {shown === 'auto' ? (
        <Text size="xs" className={chromeText({ active })}>
          {label}
        </Text>
      ) : null}
    </ChromeButton>
  );
}
CameraFlashControl.displayName = 'Camera.Flash';

export interface CameraTimerProps extends Omit<PressableProps, 'children' | 'onPress'> {
  className?: string;
  /** What off is read out as. */
  offLabel?: string;
  accessibilityLabel?: string;
}

/**
 * The self-timer: off, 3 s, 10 s. While it counts, the seconds left fill the
 * preview, and a press on the shutter cancels. Photos only, so it is dimmed in
 * video.
 */
function CameraTimerControl({
  className,
  offLabel = 'Off',
  accessibilityLabel = 'Timer',
  ...props
}: CameraTimerProps) {
  const camera = useCameraContext('Camera.Timer');
  const active = camera.timer > 0;
  const disabled = camera.mode === 'video' || camera.countdown !== null;
  const color = active ? ON_ACTIVE : ON_GLASS;
  return (
    <ChromeButton
      {...props}
      active={active}
      disabled={disabled}
      onPress={() => {
        if (camera.haptics) selectionTick();
        camera.setTimer(nextTimer(camera.timer));
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: active ? `${camera.timer} seconds` : offLabel }}
      className={className}
    >
      <TimerIcon size={20} color={color} />
      {active ? (
        <Text size="xs" className={chromeText({ active })}>
          {`${camera.timer}s`}
        </Text>
      ) : null}
    </ChromeButton>
  );
}
CameraTimerControl.displayName = 'Camera.Timer';

export interface CameraDurationProps extends ViewProps {
  className?: string;
  /** Show it in photo mode too, at `00:00`. By default it appears in video only. */
  always?: boolean;
}

/**
 * The recording clock, `mm:ss`. It reads `00:00` in video before recording,
 * and turns red with a dot while it runs. Hidden in photo mode.
 */
function CameraDuration({ className, always = false, ...props }: CameraDurationProps) {
  const camera = useCameraContext('Camera.Duration');
  const since = camera.recordingSince;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (since === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [since]);

  if (!always && camera.mode !== 'video' && since === null) return null;
  const recording = since !== null;
  const clock = formatDuration(recording ? now - since : 0);

  return (
    <View
      {...props}
      accessible
      accessibilityRole="text"
      accessibilityLabel={recording ? `Recording, ${clock}` : clock}
      className={durationPill({ recording, className })}
    >
      {recording ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
      <Text size="sm" weight="semibold" className="text-white" style={{ fontVariant: ['tabular-nums'] }}>
        {clock}
      </Text>
    </View>
  );
}
CameraDuration.displayName = 'Camera.Duration';

export interface CameraZoomProps extends ViewProps {
  className?: string;
  /**
   * The chips to show, each a value in expo-camera's 0–1 range with the label
   * you give it. Left out, one `1×` chip that undoes any zoom. The values that
   * match a given magnification differ from phone to phone, so measure them on
   * the devices you target before labelling them as one.
   */
  stops?: CameraZoomStop[];
  /** Show a bar of where the zoom sits in the range, which can be dragged, while zoomed in. */
  bar?: boolean;
}

/**
 * Zoom stops above the shutter, and a bar that shows how far in the zoom is
 * once it is past the first.
 */
function CameraZoom({ className, stops, bar = true, ...props }: CameraZoomProps) {
  const camera = useCameraContext('Camera.Zoom');
  const chips = stops ?? DEFAULT_ZOOM_STOPS;
  const active = activeStop(camera.zoom, chips);
  const [dragging, setDragging] = useState(false);
  const showBar = bar && (camera.zoom > 0.005 || dragging);

  return (
    <View {...props} pointerEvents="box-none" className={cn('items-center gap-2', className)}>
      {showBar ? (
        <ZoomBar zoom={camera.zoom} onChange={camera.setZoom} onDragging={setDragging} />
      ) : null}
      <View className="flex-row items-center gap-1 rounded-full bg-black/40 p-1">
        {chips.map((stop, index) => {
          const selected = index === active;
          return (
            <AnimatedPressable
              key={`${stop.label}-${index}`}
              onPress={() => {
                if (camera.haptics) selectionTick();
                camera.setZoom(stop.value);
              }}
              hitSlop={4}
              pressScale={0.92}
              accessibilityRole="button"
              accessibilityLabel={stop.accessibilityLabel ?? `Zoom ${stop.label}`}
              accessibilityState={{ selected }}
              className={cn(
                'h-8 min-w-8 items-center justify-center rounded-full px-2',
                selected && 'bg-white'
              )}
            >
              <Text size="xs" className={chromeText({ active: selected })}>
                {stop.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}
CameraZoom.displayName = 'Camera.Zoom';

function ZoomBar({
  zoom,
  onChange,
  onDragging,
}: {
  zoom: number;
  onChange: (zoom: number) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((event) => {
          'worklet';
          runOnJS(onDragging)(true);
          runOnJS(onChange)(zoomFromTrack(event.x, ZOOM_BAR_WIDTH));
        })
        .onUpdate((event) => {
          'worklet';
          runOnJS(onChange)(zoomFromTrack(event.x, ZOOM_BAR_WIDTH));
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(onDragging)(false);
        }),
    [onChange, onDragging]
  );

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') onChange(stepZoom(zoom, 1));
    else if (event.nativeEvent.actionName === 'decrement') onChange(stepZoom(zoom, -1));
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Zoom"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(zoom * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        style={{ width: ZOOM_BAR_WIDTH, height: 28 }}
        className="flex-row items-center justify-between"
      >
        {Array.from({ length: ZOOM_TICKS }, (_, index) => (
          <View
            key={index}
            className={index % 5 === 0 ? 'h-3 w-px bg-white/80' : 'h-2 w-px bg-white/40'}
          />
        ))}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: zoom * ZOOM_BAR_WIDTH - 1, top: 2, bottom: 2 }}
          className="w-0.5 rounded-full bg-white"
        />
      </View>
    </GestureDetector>
  );
}

export interface CameraModesProps extends ViewProps {
  className?: string;
  /** What each mode is called. */
  labels?: Partial<Record<CameraMode, string>>;
}

/** Video or photo, as a pill with a thumb that slides between them. Locked while recording. */
function CameraModes({ className, labels, ...props }: CameraModesProps) {
  const camera = useCameraContext('Camera.Modes');
  const reduced = useReducedMotion();
  const [layouts, setLayouts] = useState<Partial<Record<CameraMode, { x: number; width: number }>>>({});
  const thumbX = useSharedValue(0);
  const thumbWidth = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    const target = layouts[camera.mode];
    if (!target) return;
    if (!placed.current || reduced) {
      placed.current = true;
      thumbX.value = target.x;
      thumbWidth.value = target.width;
      return;
    }
    const spring = { damping: 22, stiffness: 260, mass: 0.8 };
    thumbX.value = withSpring(target.x, spring);
    thumbWidth.value = withSpring(target.width, spring);
  }, [camera.mode, layouts, reduced, thumbWidth, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: thumbWidth.value,
    transform: [{ translateX: thumbX.value }],
  }));

  const names = { ...MODE_LABELS, ...labels };

  return (
    <View
      {...props}
      accessibilityRole="tablist"
      className={cn('flex-row items-center rounded-full bg-black/40 p-1', className)}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: 4, bottom: 4 }, thumbStyle]}
        className="rounded-full bg-white"
      />
      {MODE_ORDER.map((item) => {
        const selected = camera.mode === item;
        return (
          <Pressable
            key={item}
            onLayout={(event: LayoutChangeEvent) => {
              const { x, width } = event.nativeEvent.layout;
              setLayouts((current) =>
                current[item]?.x === x && current[item]?.width === width
                  ? current
                  : { ...current, [item]: { x, width } }
              );
            }}
            onPress={() => {
              if (!selected) camera.setMode(item);
            }}
            disabled={camera.recording}
            accessibilityRole="tab"
            accessibilityLabel={names[item]}
            accessibilityState={{ selected, disabled: camera.recording }}
            className="h-8 items-center justify-center rounded-full px-4"
          >
            <Text
              size="xs"
              className={cn('uppercase tracking-widest', chromeText({ active: selected }))}
            >
              {names[item]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
CameraModes.displayName = 'Camera.Modes';

/* -------------------------------------------------------------------------- */
/* The shutter row                                                            */
/* -------------------------------------------------------------------------- */

export interface CameraLibraryProps extends Omit<PressableProps, 'children'> {
  className?: string;
  /** The thumbnail: the last capture, or the newest photo in the library. An icon without one. */
  source?: ImageSourcePropType;
  accessibilityLabel?: string;
}

/** The way into the photos. What it opens is `onPress`'s to decide. */
function CameraLibrary({
  className,
  source,
  accessibilityLabel = 'Photos',
  ...props
}: CameraLibraryProps) {
  useCameraContext('Camera.Library');
  return (
    <AnimatedPressable
      {...props}
      pressScale={0.94}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white/15',
        className
      )}
    >
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <ImageIcon size={22} color={ON_GLASS} />
      )}
    </AnimatedPressable>
  );
}
CameraLibrary.displayName = 'Camera.Library';

export interface CameraFlipProps extends Omit<PressableProps, 'children' | 'onPress'> {
  className?: string;
  accessibilityLabel?: string;
}

/** Front and back. Not while recording: the clip would cut between two cameras. */
function CameraFlip({ className, accessibilityLabel = 'Switch camera', ...props }: CameraFlipProps) {
  const camera = useCameraContext('Camera.Flip');
  const { turn } = camera;
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));
  const disabled = camera.recording;
  return (
    <AnimatedPressable
      {...props}
      onPress={camera.flip}
      disabled={disabled}
      pressScale={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: camera.facing === 'back' ? 'Back camera' : 'Front camera' }}
      accessibilityState={{ disabled }}
      className={cn(
        'h-12 w-12 items-center justify-center rounded-full bg-black/40',
        disabled ? 'opacity-40' : 'opacity-100',
        className
      )}
    >
      <Animated.View style={iconStyle}>
        <CameraSwitchIcon size={24} color={ON_GLASS} />
      </Animated.View>
    </AnimatedPressable>
  );
}
CameraFlip.displayName = 'Camera.Flip';

export interface CameraShutterProps extends Omit<PressableProps, 'children' | 'onPress'> {
  className?: string;
  /** In video, holding the shutter records until it is let go. A tap still starts and stops. */
  holdToRecord?: boolean;
  /** Replaces what a press does. The shutter still draws the camera's state. */
  onPress?: () => void;
  /**
   * Read out instead of the label it gives itself, which says what a press
   * will do: take a photo, cancel the timer, record or stop.
   */
  accessibilityLabel?: string;
}

/**
 * The shutter. A tap takes a photo, after the timer if one is set; in video a
 * tap starts and stops, and a hold records for as long as it is held. The disc
 * is white for a photo and red for a video, and squares off while recording. A
 * ring fills towards `maxDuration` when there is one.
 */
function CameraShutter({
  className,
  holdToRecord = true,
  onPress,
  accessibilityLabel,
  ...props
}: CameraShutterProps) {
  const camera = useCameraContext('Camera.Shutter');
  const reduced = useReducedMotion();
  const destructive = useCSSVariable('--color-destructive');
  const video = camera.mode === 'video';
  const recording = camera.recording;

  const pressed = useSharedValue(0);
  const stop = useSharedValue(recording ? 1 : 0);
  const progress = useSharedValue(0);
  const holding = useRef(false);

  useEffect(() => {
    const target = recording ? 1 : 0;
    stop.value = reduced ? target : withTiming(target, { duration: 220 });
  }, [recording, reduced, stop]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (recording && camera.maxDuration) {
      progress.value = withTiming(1, { duration: camera.maxDuration * 1000, easing: Easing.linear });
    }
  }, [camera.maxDuration, progress, recording]);

  const discStyle = useAnimatedStyle(() => {
    const size = SHUTTER_DISC + (SHUTTER_STOP - SHUTTER_DISC) * stop.value;
    const radius = size / 2 + (8 - size / 2) * stop.value;
    return {
      width: size,
      height: size,
      borderRadius: radius,
      transform: [{ scale: 1 - pressed.value * 0.08 }],
    };
  });

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LENGTH * (1 - progress.value),
  }));

  // Stopping is always allowed; starting waits for the camera.
  const disabled = !recording && !camera.canCapture;
  const label =
    accessibilityLabel ??
    (video
      ? recording
        ? 'Stop recording'
        : 'Record video'
      : camera.countdown !== null
        ? 'Cancel timer'
        : 'Take photo');

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPress={onPress ?? camera.press}
      onLongPress={
        video && holdToRecord && !onPress
          ? () => {
              if (camera.recording) return;
              holding.current = true;
              void camera.startRecording();
            }
          : undefined
      }
      delayLongPress={HOLD_TO_RECORD_MS}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 160 });
        if (holding.current) {
          holding.current = false;
          camera.stopRecording();
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={
        video && holdToRecord && !recording ? 'Hold to record for as long as you hold it' : undefined
      }
      accessibilityState={{ disabled, busy: camera.capturing }}
      // Dimmed only without a camera to use or while a photo is being taken.
      style={{ width: SHUTTER, height: SHUTTER, opacity: disabled ? 0.6 : 1 }}
      className={cn('items-center justify-center', className)}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: SHUTTER / 2, borderWidth: SHUTTER_RING }]}
        className="border-white"
      />
      {camera.maxDuration ? (
        <Svg pointerEvents="none" width={SHUTTER} height={SHUTTER} style={StyleSheet.absoluteFill}>
          <AnimatedCircle
            cx={SHUTTER / 2}
            cy={SHUTTER / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={typeof destructive === 'string' ? destructive : undefined}
            strokeWidth={SHUTTER_RING}
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            animatedProps={ringProps}
            rotation={-90}
            origin={`${SHUTTER / 2}, ${SHUTTER / 2}`}
          />
        </Svg>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={discStyle}
        className={video ? 'bg-destructive' : 'bg-white'}
      />
    </Pressable>
  );
}
CameraShutter.displayName = 'Camera.Shutter';

export const Camera = Object.assign(CameraForwarded, {
  Preview: CameraPreview,
  Header: CameraHeader,
  Footer: CameraFooter,
  Controls: CameraControls,
  Button: CameraButton,
  Flash: CameraFlashControl,
  Timer: CameraTimerControl,
  Duration: CameraDuration,
  Zoom: CameraZoom,
  Modes: CameraModes,
  Library: CameraLibrary,
  Flip: CameraFlip,
  Shutter: CameraShutter,
});
