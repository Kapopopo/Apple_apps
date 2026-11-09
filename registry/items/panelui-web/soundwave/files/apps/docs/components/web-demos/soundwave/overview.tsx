'use client';

import { Button } from 'panelui-web/button';
import { Soundwave, useMicrophone, type MicrophoneControls } from 'panelui-web/soundwave';

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function MicButton({ mic }: { mic: MicrophoneControls }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={mic.active ? 'default' : 'outline'}
        size="sm"
        shape="pill"
        aria-pressed={mic.active}
        disabled={mic.status === 'requesting'}
        onClick={mic.toggle}
      >
        <MicIcon />
        {mic.active ? 'Stop listening' : 'Try it with your voice'}
      </Button>
      {mic.status === 'denied' || mic.status === 'unsupported' ? (
        <p className="text-xs text-muted-foreground">No microphone, or permission was refused.</p>
      ) : null}
    </div>
  );
}

export default function SoundwaveOverview() {
  const mic = useMicrophone();
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      {/* With no stream yet, the wave runs its own motion. */}
      <Soundwave variant="dots" color="info" height={72} source={mic.stream} />
      <MicButton mic={mic} />
    </div>
  );
}
