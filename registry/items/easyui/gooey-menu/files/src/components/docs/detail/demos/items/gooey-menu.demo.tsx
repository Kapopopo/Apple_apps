import type { DemoProps } from '../../demo-types';
import { DEMO_COMPONENTS } from '../../demo-components';


const { GooeyMenu } = DEMO_COMPONENTS;

export const meta = { id: 'gooey-menu', aliases: [] } as const;

export async function preload(): Promise<void> {
  await Promise.all([GooeyMenu.preload()]);
}

export default function ComponentDemo(props: DemoProps) {
  const { demoKey } = props;
return (
        <div className="py-10 flex flex-col items-center justify-center">
          <GooeyMenu key={demoKey} />
        </div>
      );
}
