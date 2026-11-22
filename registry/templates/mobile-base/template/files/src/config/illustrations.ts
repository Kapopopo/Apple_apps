import type { LucideIcon } from 'lucide-react-native';
// Un import par icône : le point d'entrée du paquet embarque les 1 600 icônes dans le bundle.
import Bell from 'lucide-react-native/icons/bell';
import BookOpen from 'lucide-react-native/icons/book-open';
import Camera from 'lucide-react-native/icons/camera';
import Clock from 'lucide-react-native/icons/clock';
import Heart from 'lucide-react-native/icons/heart';
import Leaf from 'lucide-react-native/icons/leaf';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Star from 'lucide-react-native/icons/star';
import Target from 'lucide-react-native/icons/target';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Zap from 'lucide-react-native/icons/zap';
import type { ImageSourcePropType } from 'react-native';

export type IllustrationName =
  'sparkles' | 'target' | 'trending-up' | 'heart' | 'star' | 'zap' | 'shield-check' | 'clock' | 'leaf' | 'book-open' | 'camera' | 'bell';

/**
 * Pour une vraie image (plein écran, en tête du paywall), ajouter `image` à la clé voulue :
 *   sparkles: { icon: Sparkles, image: require('../../assets/welcome.jpg') },
 */
export const illustrations: Record<IllustrationName, { icon: LucideIcon; image?: ImageSourcePropType }> = {
  sparkles: { icon: Sparkles },
  target: { icon: Target },
  'trending-up': { icon: TrendingUp },
  heart: { icon: Heart },
  star: { icon: Star },
  zap: { icon: Zap },
  'shield-check': { icon: ShieldCheck },
  clock: { icon: Clock },
  leaf: { icon: Leaf },
  'book-open': { icon: BookOpen },
  camera: { icon: Camera },
  bell: { icon: Bell },
};
