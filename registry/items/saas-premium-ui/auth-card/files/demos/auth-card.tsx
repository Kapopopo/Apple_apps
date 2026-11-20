import { Sparkles } from 'lucide-react';
import { AuthCard } from '@/components/auth-card';
import { GlassTiles } from '@/sections/auth-modal';

export default function AuthCardDemo() {
  return (
    <div className="pl-root flex w-full max-w-4xl flex-wrap items-start justify-center gap-8 rounded-pl-xl p-4 sm:p-8">
      <div className="grid w-full max-w-[440px] place-items-center rounded-pl-xl bg-[#1a1c22] p-5">
        <AuthCard header={<GlassTiles />} titleIcon={<Sparkles />} />
      </div>
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6">
        <h1 className="pl-h2 text-center text-[34px] text-pl-fg">
          Ravi de vous <span className="pl-text-gradient">retrouver</span>
        </h1>
        <AuthCard
          variant="inline"
          subtitle="Entrez votre email : nous vous envoyons un code de connexion à 6 chiffres, sans mot de passe."
          submitLabel="Recevoir mon code"
          footerLink={{
            label: (
              <>
                Pas encore membre ? <strong>Voir les tarifs</strong>
              </>
            ),
            href: '#',
          }}
        />
      </div>
    </div>
  );
}
