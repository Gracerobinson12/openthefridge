import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, T } from '../components/ui';
import { colors } from '../lib/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
      <T w="heavy" size={26}>Nothing on this shelf</T>
      <Button title="Back to the Fridge" onPress={() => router.replace('/')} />
    </View>
  );
}
