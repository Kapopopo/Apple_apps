'use client';

import { BrainIcon, SparklesIcon, ZapIcon } from 'lucide-react';
import { Prompt, type PromptModelItem, type PromptTaskStatus } from 'panelui-web/prompt';
import { useEffect, useState } from 'react';

const MODELS: PromptModelItem[] = [
  { value: 'lumen', label: 'Lumen 4', icon: <SparklesIcon />, description: 'Balanced, for most questions' },
  { value: 'lumen-mini', label: 'Lumen 4 Mini', icon: <ZapIcon />, description: 'Quick answers to small asks' },
  { value: 'lumen-deep', label: 'Lumen 4 Deep', icon: <BrainIcon />, description: 'Slower, for hard problems' },
];

const TASKS = [
  'Read the open pull requests',
  'Group the changes by area',
  'Draft the release notes',
  'Check every link in the notes',
  'Bump the version to 2.4.0',
  'Run the test suite',
  'Tag the release and open a draft',
];

export default function PromptAgent() {
  // How many tasks are done; the next one is in progress.
  const [done, setDone] = useState(2);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || done >= TASKS.length) return;
    const timer = window.setTimeout(() => setDone((count) => count + 1), 1800);
    return () => window.clearTimeout(timer);
  }, [done, running]);

  const finished = done >= TASKS.length;
  const statusOf = (index: number): PromptTaskStatus =>
    index < done ? 'done' : index === done && running ? 'active' : 'pending';

  return (
    <div className="w-full max-w-xl">
      <Prompt
        status={running && !finished ? 'streaming' : 'idle'}
        onStop={() => setRunning(false)}
        onSubmit={() => {
          if (finished) setDone(0);
          setRunning(true);
        }}
      >
        <Prompt.Tasks
          defaultExpanded
          title={finished ? 'Release 2.4.0 is ready for review' : running ? 'Preparing release 2.4.0' : 'Paused'}
        >
          {TASKS.map((task, index) => (
            <Prompt.Task key={task} status={statusOf(index)}>
              {task}
            </Prompt.Task>
          ))}
        </Prompt.Tasks>
        <Prompt.Field>
          <Prompt.Textarea placeholder={running && !finished ? 'Steer the agent while it works' : 'Send anything to carry on'} />
          <Prompt.Footer>
            <Prompt.Tools>
              <Prompt.Menu>
                <Prompt.AttachItem />
              </Prompt.Menu>
              <Prompt.Model items={MODELS} defaultValue="lumen-deep" variant="ghost" />
            </Prompt.Tools>
            <Prompt.Submit />
          </Prompt.Footer>
        </Prompt.Field>
      </Prompt>
    </div>
  );
}
