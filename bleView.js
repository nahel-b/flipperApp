import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, ScrollView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';

const manager = new BleManager();

export default function App() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);


  useEffect(() => { 
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, 
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, 
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);
    }
  }, []);



  const scanAndConnect = () => {

    manager.startDeviceScan(null, null, async (error, device) => { 

      if (error) { console.log(error); return; }

      if (device?.name?.includes('Er3ilu')) {

        console.log('Appareil trouvé:', device.name);
        manager.stopDeviceScan();

        try {

          const connectedDevice = await device.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();

          setConnected(true);

          // Pour récupérer les messages envoytés par le flipper
          // non testé encore
          connectedDevice.monitorCharacteristicForService(
            '19ed82ae-ed21-4c9d-4145-228e61fe0000', // RT ?
            '19ed82ae-ed21-4c9d-4145-228e62fe0000', // TX 
            (error, characteristic) => {
              if (error) {
                console.log('Erreur moniteur:', error);
                return;
              }

              const value = characteristic?.value;
              if (value) {
                const decoded = base64.decode(value);
                setMessages((prev) => [...prev, decoded]);
              }
            }
          );



        } catch (erreur) {
          console.log('erreur :', erreur);
        }
      }
    });
  };

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60,justifyContent: 'center', alignItems: 'center' }}>

      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>📡 Application compagnon 📡</Text>
      <Button title="Scanner et se connecter" onPress={scanAndConnect} disabled={connected} />
      <ScrollView style={{ marginTop: 20 }}>
        
        {messages.map((msg, i) => (
          <View  style={{  }}>
          <Text >{msg}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
