import type { DemoProps } from '../../demo-types';
import { DEMO_COMPONENTS } from '../../demo-components';


const { UndoToast } = DEMO_COMPONENTS;

export const meta = { id: 'undo-toast', aliases: [] } as const;

export async function preload(): Promise<void> {
  await Promise.all([UndoToast.preload()]);
}

export default function ComponentDemo(props: DemoProps) {
  const { demoKey } = props;
return (
        <div className="py-8 w-full max-w-md mx-auto">
          <UndoToast
            key={demoKey}
            open={true}
            title="Project archived"
            description="5 seconds remaining to restore project"
            duration={8000}
            onUndo={() => console.log('Undone')}
          />
        </div>
      );
}
