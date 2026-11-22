import { useRouter } from 'expo-router';
import Settings from 'lucide-react-native/icons/settings';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { appConfig } from '@/config/app';
import { useAnswers } from '@/lib/storage';

// Accueil provisoire : à remplacer par la fonctionnalité de l'app (garder un accès aux réglages).
export default function Home() {
  const router = useRouter();
  const answers = Object.values(useAnswers()).flat();
  return (
    <SafeAreaView testID="home" className="flex-1 bg-background">
      <View className="flex-row justify-end px-pad">
        <Button testID="home-settings" size="icon" variant="ghost" accessibilityLabel="Réglages" onPress={() => router.push('/settings')}>
          <Icon as={Settings} />
        </Button>
      </View>
      <View className="flex-1 justify-center gap-stack px-gutter">
        <Text variant="h1">{appConfig.name}</Text>
        <Text className="text-muted-foreground">La fonctionnalité de l’app se code dans app/(main)/.</Text>
        {answers.length ? (
          <Text testID="home-answers" className="text-foreground">
            {answers.join(' · ')}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
