import { Footer } from '@/components/footer';

export default function FooterDemo() {
  return (
    <div className="pl-root w-full max-w-6xl overflow-hidden rounded-pl-xl">
      <Footer
        columns={[
          { title: 'Navigation', links: ['Accueil', 'Fonctionnalités', 'Tarifs', 'Avis'].map((label) => ({ label, href: '#' })) },
          {
            title: 'Informations',
            links: ['Mentions légales', 'Confidentialité', 'Conditions', 'Contact'].map((label) => ({ label, href: '#' })),
          },
        ]}
      />
    </div>
  );
}
