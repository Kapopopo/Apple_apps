'use client';

import { CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from 'panelui-web/button';
import { Input } from 'panelui-web/input';
import { useState } from 'react';

export default function InputAddons() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Input.Group>
        <Input.Addon className="border-e pe-3">https://</Input.Addon>
        <Input placeholder="your-studio" aria-label="Site address" />
        <Input.Addon align="end">.panel.site</Input.Addon>
      </Input.Group>
      <Input.Group>
        <Input type="number" defaultValue={40} aria-label="Storage limit" />
        <Input.Addon align="end">GB</Input.Addon>
      </Input.Group>
      <Input.Group>
        <Input readOnly value="pk_live_7Hq2…a91c" aria-label="Publishable key" className="font-mono text-xs" />
        <Input.Addon align="end" className="pe-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? 'Copied' : 'Copy key'}
            onClick={() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
            className="size-7"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </Input.Addon>
      </Input.Group>
    </div>
  );
}
