'use client';

import { RotateCcwIcon, Share2Icon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useState } from 'react';
import { Message } from 'panelui-web/message';

/** Three tries at the same answer. Retrying adds a fourth, and the switcher steps between them. */
const VERSIONS = [
  'A cron line runs on fixed times. `0 9 * * 1-5` is nine in the morning on weekdays.',
  'Read it left to right: minute, hour, day of the month, month, day of the week. `0 9 * * 1-5` means minute 0, hour 9, Monday to Friday.',
  'It fires at 09:00 every weekday. The fields are minute, hour, day, month and weekday, so `1-5` limits it to Monday to Friday.',
  'At 09:00 on Monday to Friday. Change the last field to `*` for every day of the week.',
];

export default function MessageActions() {
  const [count, setCount] = useState(3);
  const [index, setIndex] = useState(2);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  return (
    <Message from="assistant" className="w-full max-w-xl">
      <Message.Content>
        <Message.Bubble>
          {/* Keyed by the version, so the new text replaces the old one. */}
          <Message.BubbleContent key={index}>
            <p>
              {VERSIONS[index]!.split('`').map((part, at) => (at % 2 ? <code key={at}>{part}</code> : part))}
            </p>
          </Message.BubbleContent>
        </Message.Bubble>
        <Message.Actions>
          <Message.Branch count={count} index={index} onIndexChange={setIndex} />
          <Message.Action label="Copy" copy={() => VERSIONS[index]!} />
          <Message.Action label="Good answer" pressed={rating === 'up'} onClick={() => setRating(rating === 'up' ? null : 'up')}>
            <ThumbsUpIcon />
          </Message.Action>
          <Message.Action label="Bad answer" pressed={rating === 'down'} onClick={() => setRating(rating === 'down' ? null : 'down')}>
            <ThumbsDownIcon />
          </Message.Action>
          <Message.Action
            label="Try again"
            disabled={count === VERSIONS.length}
            onClick={() => {
              setCount(count + 1);
              setIndex(count);
              setRating(null);
            }}
          >
            <RotateCcwIcon />
          </Message.Action>
          <Message.Action label="Share">
            <Share2Icon />
          </Message.Action>
        </Message.Actions>
      </Message.Content>
    </Message>
  );
}
