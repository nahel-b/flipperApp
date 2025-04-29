import React,{useState,useEffect,} from 'react';
import { View, StyleSheet, TouchableOpacity, Text,Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {

  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import parseAprs from './parserAPRS';

import { UUIDContext } from './uuidContext';

const default_marker = [{
  coordinate: {
    latitude: 45.1885,
    longitude: 5.7245,
  },
  title: 'Default Marker',
  temperature: 0,
},
{
  coordinate: {
    latitude: 45.187,
    longitude: 5.7245,
  },
  title: 'Default Marker',
  temperature: 0,
},
{
  coordinate: {
    latitude: 45.1886,
    longitude: 5.7245,
  },
  title: 'Default Marker',
  temperature: 0,
},
{
  coordinate: {
    latitude: 45.1885,
    longitude: 5.7245,
  },
  title: 'Default Marker',
  temperature: 0,
}
]



export default function MapScreen({ onScanConnect }) {

  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState(false);


  const [nbMessage, setNbMessage] = useState(0);
  const [messages, setMessages] = useState(['F4ABC>APRS,WIDE1-1::F1XYZ   :Hello from 30,000 feet! \n  F4ABC-11>APRS,WIDE2-1:!4852.45N/00220.32E>000/000/A=035000 Balloon launch test']);
  const [parsedMessages, setParsedMessages] = useState([]);
 
  


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


    useEffect(() => {
      if (messages.length === 0) return;
    
      const firstMessage = messages[0];

      const listMessages = firstMessage.split('\n');

      const parsedMessages = listMessages.map((message) => {
        const parsedMessage = parseAprs(message);
        console.log('Parsed:', parsedMessage);
        setNbMessage((prev) => prev + 1);
        if(parsedMessage.pos)
          {
            console.log('Parsed:', parsedMessage);
          }
        return parsedMessage;
      }
      );
      setParsedMessages((prev) => [...prev, ...parsedMessages]);

    
      setMessages((prev) => prev.slice(1));
    }, [messages.length]);
 

  const scanAndConnect = () => {

    // manager.startDeviceScan(null, null, async (error, device) => { 

    //   if (error) { console.log(error); return; }

    //   if (device?.name?.includes('Lora')) {

    //     console.log('Appareil trouvé:', device.name);
    //     manager.stopDeviceScan();

    //     try {

    //       const connectedDevice = await device.connect();
    //       await connectedDevice.discoverAllServicesAndCharacteristics();

    //       setConnected(true);

    //       const allServices = await connectedDevice.services();
    //       for (const service of allServices) {
    //         const characteristics = await service.characteristics();
    //         console.log('Service:', service.uuid);
    //         setLog((prev) => [...prev, `Service: ${service.uuid}`]);
            
    //         characteristics.forEach(c => {
    //           console.log('Characteristic:', c.uuid, 
    //             'isNotifiable:', c.isNotifiable, 
    //             'isWritableWithResponse:', c.isWritableWithResponse, 
    //             'isWritableWithoutResponse:', c.isWritableWithoutResponse, 
    //             'isReadable:', c.isReadable
    //           );
    //           setLog((prev) => [...prev, `Characteristic: ${c.uuid}, isNotifiable: ${c.isNotifiable}, isWritable: ${c.isWritableWithResponse || c.isWritableWithoutResponse}, isReadable: ${c.isReadable}`]);
    //         });
    //       }

    //       // Pour récupérer les messages envoytés par le flipper
    //       // non testé encore
    //       connectedDevice.monitorCharacteristicForService(
    //         serviceUuid, // RT 
    //         characteristicUuid, // TX 
    //         (error, characteristic) => {
    //           if (error) {
    //             console.log('Erreur moniteur:', error);
    //             return;
    //           }

    //           const value = characteristic?.value;
    //           if (value) {
    //             const decoded = base64.decode(value);
    //             setMessages((prev) => [...prev, decoded]);
    //           }
    //         }
    //       );

    //     } catch (erreur) {
    //       console.log('erreur :', erreur);
    //     }
    //   }
    // });

  }


  return (
     <View style={styles.container}>

     
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 45.1885,
        longitude: 5.7245,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      showsUserLocation={true}
      showsCompass={true}
    >
      {parsedMessages.map((marker, index) => (
        <Marker
        key={index}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude
        }} 
        
      >
        
        <View style={{  justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity style={styles.markerContainer} onPress={() => console.log(marker)}>
          <View style={styles.temperatureContainer}>
          <FontAwesome5 name="satellite" size={20} color="black" />
        {/* <Text style={{ fontSize: 12, color: 'black', fontWeight: 'bold' }}>{"infos"}</Text> */}
        </View>
        </TouchableOpacity>
        </View>
       
        {/* <View style={styles.markerContainer}>
          
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperatureText}>{marker.title}</Text>
            <Text style={styles.temperatureText}>{marker.temperature}°C</Text>
          </View>
          <View style={styles.marker} />
        </View> */}
      </Marker>
      ))}
    </MapView>
      
       <View style={{ position: 'absolute',width : "100%",justifyContent : "center", top : insets.top,}}>
       <Text style={{ fontSize: 24,textAlign : "center", fontWeight: 'bold' }}>📡 Application compagnon 📡</Text>
       <View style={{ flexDirection : "row", alignItems : "baseline",justifyContent : "center", }}>
        <View style={{ width : 10,height : 10,marginTop : 0, borderRadius : 10, backgroundColor : connected ? "green" : "red", marginRight : 5 }}></View>
       <Text style={{ fontSize: 18,opacity : 0.7,textAlign : "center" }}>{connected ? 'connecté' : 'non connecté'}</Text>
       </View>
       </View>
      <View style={styles.bottomBar}>
        <Text style={{fontWeight : "bold"}} >Trame APRS recus : {nbMessage}</Text>
        <TouchableOpacity style={styles.button} onPress={onScanConnect}>
          <Text style={styles.buttonText}>{ connected ? "Se reconnecter" : "Scanner et se connecter"}</Text>
        </TouchableOpacity>
       
      </View>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex : 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'green',
    borderWidth: 2,
    borderColor: 'white',
  },
  temperatureContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  temperatureText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
});
