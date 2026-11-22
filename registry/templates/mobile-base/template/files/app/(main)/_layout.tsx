import { Stack } from 'expo-router';

// Zone de la fonctionnalité : déjà réservée aux abonnés par app/_layout.tsx.
// Onglets, pile, modales : tout se déclare ici.
export default function MainLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
