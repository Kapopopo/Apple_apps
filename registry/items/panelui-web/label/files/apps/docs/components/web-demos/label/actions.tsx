'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'panelui-web/button';
import { Input } from 'panelui-web/input';
import { Label } from 'panelui-web/label';

const KEY = 'pk_live_51HqT2c8Rwz';

export default function LabelActions() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="action-password">
          <Label.Text>Password</Label.Text>
          <Label.Action>
            <a href="#reset">Forgot it?</a>
          </Label.Action>
        </Label>
        <Input id="action-password" type="password" defaultValue="correct horse" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="action-key">
          <Label.Text>Publishable key</Label.Text>
          <Label.Action>
            <Button
              variant="ghost"
              size="sm"
              className="-my-1 h-6 px-1.5 text-xs"
              onClick={() => {
                try {
                  void navigator.clipboard?.writeText(KEY).catch(() => {});
                } catch {}
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Label.Action>
        </Label>
        <Input id="action-key" readOnly value={KEY} className="font-mono" />
      </div>
    </div>
  );
}
