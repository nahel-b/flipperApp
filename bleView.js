import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, ScrollView, TextInput, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import { UUIDContext } from './uuidContext';

const manager = new BleManager();


export default function App() {
  const [messages, setMessages] = useState([]);
  const [log, setLog] = useState([]);
  const [connected, setConnected] = useState(false);


  const { serviceUuid, setServiceUuid, characteristicUuid, setCharacteristicUuid, resetUuids, loading } = React.useContext(UUIDContext);

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

          const allServices = await connectedDevice.services();
          for (const service of allServices) {
            const characteristics = await service.characteristics();
            console.log('Service:', service.uuid);
            setLog((prev) => [...prev, `Service: ${service.uuid}`]);
            
            characteristics.forEach(c => {
              console.log('Characteristic:', c.uuid, 
                'isNotifiable:', c.isNotifiable, 
                'isWritableWithResponse:', c.isWritableWithResponse, 
                'isWritableWithoutResponse:', c.isWritableWithoutResponse, 
                'isReadable:', c.isReadable
              );
              setLog((prev) => [...prev, `Characteristic: ${c.uuid}, isNotifiable: ${c.isNotifiable}, isWritable: ${c.isWritableWithResponse || c.isWritableWithoutResponse}, isReadable: ${c.isReadable}`]);
            });
          }

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
        <Text style={styles.label}>UUID Service:</Text>
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
      
      <Button title={connected ? "Se reconnecter" : "Scanner et se connecter"} onPress={scanAndConnect} />
      <ScrollView style={{ marginTop: 20 }}>

        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Messages:</Text>
        
        {messages.map((msg, i) => (
          <View key={i} style={{  }}>
            <Text>{msg}</Text>
          </View>
        ))}

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Log:</Text>

        {log.map((msg, i) => (
          <View key={i} style={{  }}>
            <Text>{msg}</Text>
          </View>
        ))}
        {connected && <Text style={{ color: 'green' }}>Connecté</Text>}
        {!connected && <Text style={{ color: 'red' }}>Non connecté</Text>}
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
