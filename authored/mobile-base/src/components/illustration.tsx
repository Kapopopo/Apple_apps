import { Image, View } from 'react-native';
import { illustrations, type IllustrationName } from '@/config/illustrations';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/** Image si la clé en a une, icône sinon. */
export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  const { icon, image } = illustrations[name];
  return (
    <View className={cn('items-center justify-center overflow-hidden rounded-3xl bg-accent', className)}>
      {image ? (
        <Image source={image} resizeMode="cover" className="h-full w-full" />
      ) : (
        <Icon as={icon} size={72} className="text-primary" />
      )}
    </View>
  );
}

/** Fond plein cadre sur la couleur primaire, l'image étant voilée pour garder le texte lisible. */
export function IllustrationBackdrop({ name, iconSize = 128 }: { name: IllustrationName; iconSize?: number }) {
  const { icon, image } = illustrations[name];
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-primary">
      {image ? (
        <>
          <Image source={image} resizeMode="cover" className="absolute h-full w-full" />
          <View className="absolute inset-0 bg-primary/70" />
        </>
      ) : (
        <View className="rounded-full bg-primary-foreground/10 p-section">
          <Icon as={icon} size={iconSize} className="text-primary-foreground" />
        </View>
      )}
    </View>
  );
}
