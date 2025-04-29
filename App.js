import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BleView from './bleView';
import MapScreen from './mapScreen';

import { UUIDProvider } from './uuidContext';
import {

  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export default function App() {
  return (
    <UUIDProvider>
    <View style={styles.container}>

      <SafeAreaProvider>
      <MapScreen />
      </SafeAreaProvider>
    </View>
    </UUIDProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
