import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function ModalsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="log-trade" />
      <Stack.Screen name="playbook-rule" />
      <Stack.Screen name="playbook-setup" />
      <Stack.Screen name="playbook-principle" />
    </Stack>
  );
}
