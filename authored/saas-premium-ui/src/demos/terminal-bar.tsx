import { TerminalBar } from '@/components/terminal-bar';

export default function TerminalBarDemo() {
  return (
    <div className="pl-root flex w-full max-w-2xl flex-col items-center gap-4 rounded-pl-xl px-4 py-10">
      <TerminalBar commands={['npx create-app@latest mon-projet', 'npm install outil-exemple', 'outil init --template minimal']} />
      <p className="text-sm text-pl-fg-2">Cliquer sur la commande pour la copier.</p>
    </div>
  );
}
