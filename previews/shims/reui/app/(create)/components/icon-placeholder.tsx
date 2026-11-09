/** Shim Atlas : sur reui.io, ce composant choisit l'icône selon la bibliothèque active. Ici : la variante lucide. */
import * as Lucide from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
type Props = SVGProps<SVGSVGElement> & { lucide?: string; tabler?: string; hugeicons?: string; phosphor?: string; remixicon?: string };
export function IconPlaceholder({ lucide, tabler: _t, hugeicons: _h, phosphor: _p, remixicon: _r, ...rest }: Props) {
  const icons = Lucide as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>;
  const Icon = (lucide && icons[lucide]) || icons.Circle;
  return <Icon {...rest} />;
}
export default IconPlaceholder;
