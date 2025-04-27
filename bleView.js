import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, ScrollView, TextInput, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';

const manager = new BleManager();

export default function App() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [serviceUuid, setServiceUuid] = useState('19ed82ae-ed21-4c9d-4145-228e62fe0000'); // UUID mis à jour
  const [characteristicUuid, setCharacteristicUuid] = useState('19ed82ae-ed21-4c9d-4145-228e62fe0000'); // TX


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

      if (device?.name?.includes('Lora')) {

        console.log('Appareil trouvé:', device.name);
        manager.stopDeviceScan();

        try {

          const connectedDevice = await device.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();

          setConnected(true);

          // Pour récupérer les messages envoytés par le flipper
          // non testé encore
          connectedDevice.monitorCharacteristicForService(
            serviceUuid, // RT 
            characteristicUuid, // TX 
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
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>UUID Service (RT):</Text>
        <TextInput
          style={styles.input}
          value={serviceUuid}
          onChangeText={setServiceUuid}
          placeholder="Service UUID"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>UUID Caractéristique (TX):</Text>
        <TextInput
          style={styles.input}
          value={characteristicUuid}
          onChangeText={setCharacteristicUuid}
          placeholder="Characteristic UUID"
        />
      </View>
      
      <Button title="Scanner et se connecter" onPress={scanAndConnect} disabled={connected} />
      <ScrollView style={{ marginTop: 20 }}>
        
        {messages.map((msg, i) => (
          <View key={i} style={{  }}>
            <Text>{msg}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    width: '100%',
  }
});
