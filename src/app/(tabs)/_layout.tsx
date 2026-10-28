import { Slot } from 'expo-router';
import { View } from 'react-native';
import { TabBar } from '../../components/TabBar';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
      <TabBar />
    </View>
  );
}
