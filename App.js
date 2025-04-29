import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BleView from './bleView';
import MapScreen from './mapScreenCompagnon';
import ballonView from './ballonView';

import { UUIDProvider } from './uuidContext';
import {

  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <UUIDProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                if (route.name === 'Compagnon') {
                  return (
                    <MaterialCommunityIcons name="dolphin" size={24} color={color} />
                  );
                } else if (route.name === 'Ballon') {
                  return <MaterialCommunityIcons name="airballoon" size={24} color={color} />;
                } else if (route.name === 'BLE') {
                  return <MaterialCommunityIcons name="bluetooth" size={24} color={color} />;
                }
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: 'gray',
              tabBarShowLabel : true,
              headerShown: false,

              tabBarStyle: {
                marginTop: 10,
                borderTopWidth: 0,
              },
             
            })}
          >
            <Tab.Screen name="Compagnon" component={MapScreen} />
            <Tab.Screen name="Ballon" component={ballonView} />
            <Tab.Screen name="BLE" component={BleView} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </UUIDProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
