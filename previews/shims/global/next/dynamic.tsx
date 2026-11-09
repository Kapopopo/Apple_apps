import { lazy, Suspense, type ComponentType } from 'react';
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>) {
  const C = lazy(async () => { const m = await loader(); return 'default' in (m as object) ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> }; });
  return (props: P) => <Suspense fallback={null}><C {...props} /></Suspense>;
}
