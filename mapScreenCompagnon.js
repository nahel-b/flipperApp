import React,{useState,useEffect,} from 'react';
import { View, StyleSheet,PermissionsAndroid, TouchableOpacity, Text,Platform, Modal, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import base64 from 'react-native-base64';

import {

  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import parseAprs from './parserAPRS';

import { UUIDContext } from './uuidContext';

import { BleManager } from 'react-native-ble-plx';
const manager = new BleManager();



export default function MapScreen({ onScanConnect }) {

  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState(false);

  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);


  const [nbMessage, setNbMessage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [parsedMessages, setParsedMessages] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  


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

      console.log('flipperMessageEndecode :', firstMessage);

      setLog((prev) => [...prev, 'flipperMessageEndecode : ' + firstMessage]);

      const parsedMessages = listMessages.map((message) => {

        console.log('flipperMessageSplit :', message);
        setLog((prev) => [...prev, 'flipperMessageSplit : ' + message]);

        const parsedMessage = parseAprs(message);

        console.log('flipperMessageParsed :', parsedMessage);
        setLog((prev) => [...prev, 'flipperMessageParsed : ' + JSON.stringify(parsedMessage)]);

        setNbMessage((prev) => prev + 1);
        if(parsedMessage.pos) {
          console.log('Parsed:', parsedMessage);
        }

        // haptic pour le plaisir :)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return parsedMessage;
      });
      setParsedMessages((prev) => [...prev, ...parsedMessages]);

    
      setMessages((prev) => prev.slice(1));
    }, [messages.length]);

  
    const postBackend = async (data) => {
      try {
        const response = await fetch('https://pocfablab.osc-fr1.scalingo.io/api/position', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const responseData = await response.json();
        console.log('Réponse du backend:', responseData);
        setLog((prev) => [...prev, 'Réponse du backend: ' + JSON.stringify(responseData)]);
        setModalVisible(false);
      }
      catch (error) {
        console.error('Erreur lors de l\'envoi des données au backend:', error);
        setLog((prev) => [...prev, 'Erreur lors de l\'envoi des données au backend: ' + error]);
      }
    };
 

  const scanAndConnect = () => {


    // let trame1 = 'F4ABC-11>APRS,WIDE2-1:!4852.45N/00220.32E>000/000/A=035000 Balloon launch test';

    // let trame2 = 'F4ABC>APRS,TCPIP*,qAC,T2FRANCE:;BALLOON1 *112345z4802.45N/00220.33E-Test payload \n F4ABC>APRS,WIDE1-1:_092300z4852.45N/00260.31E_000/000g005t017r000p000P000h55b10130';

    // let trame3 = 'F4ABC>APRS,WIDE1-1:_092300z4852.45N/00260.31E_000/000g005t017r000p000P000h55b10130';

    // let trame4 = 'F4ABC>APRS,WIDE1-1::F1XYZ    :Hello from 30,000 feet!';

    // setMessages((prev) => [...prev, trame1]);
    // setMessages((prev) => [...prev, trame2]);
    // setMessages((prev) => [...prev, trame3]);
    // setMessages((prev) => [...prev, trame4]);



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
        marker.latitude && marker.longitude && (
        <Marker
          key={index}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude
          }}
          onPress={() => {
            setSelectedMarker(marker);
            setModalVisible(true);
          }}
        >
          <View style={{  justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity style={styles.markerContainer}>
              <View style={styles.temperatureContainer}>
                <FontAwesome5 name="satellite" size={20} color="black" />
                <Text style={styles.temperatureText}>{'trame'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Marker>
        )
      ))}
    </MapView>
    {/* Modal d'infos marker */}
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent,{marginBottom: insets.bottom}]}>
          <View style={{alignItems:'center', marginBottom:8}}>
            <View style={{width:40, height:4, backgroundColor:'#ccc', borderRadius:2, marginVertical:8}}/>
            <Text style={{fontWeight:'bold', fontSize:18}}>Détails de la trame APRS</Text>
          </View>
          <ScrollView>
            {selectedMarker && (
              <>
                <Text>Type : {selectedMarker.type}</Text>
                <Text>Callsign : {selectedMarker.callsign}{selectedMarker.ssid ? '-' + selectedMarker.ssid : ''}</Text>
                {selectedMarker.latitude && selectedMarker.longitude && (
                  <Text>Position : {selectedMarker.latitude.toFixed(5)}, {selectedMarker.longitude.toFixed(5)}</Text>
                )}
                {selectedMarker.altitude && (
                  <Text>Altitude : {selectedMarker.altitude} m</Text>
                )}
                {selectedMarker.temperature !== undefined && (
                  <Text>Température : {selectedMarker.temperature}°C</Text>
                )}
                {selectedMarker.humidity !== undefined && (
                  <Text>Humidité : {selectedMarker.humidity}%</Text>
                )}
                {selectedMarker.target && (
                  <Text>Cible : {selectedMarker.target}</Text>
                )}
                {selectedMarker.message && (
                  <Text>Message : {selectedMarker.message}</Text>
                )}
              </>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => postBackend(selectedMarker)}>
            <Text style={{color:'white', fontWeight:'bold'}}>Envoyer au dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={{color:'white', fontWeight:'bold'}}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <View style={{ position: 'absolute',width : "100%",justifyContent : "center", top : insets.top,}}>
       <Text style={{ fontSize: 24,textAlign : "center", fontWeight: 'bold' }}>📡 Application compagnon 📡</Text>
       <View style={{ flexDirection : "row", alignItems : "baseline",justifyContent : "center", }}>
        <View style={{ width : 10,height : 10,marginTop : 0, borderRadius : 10, backgroundColor : connected ? "green" : "red", marginRight : 5 }}></View>
       <Text style={{ fontSize: 18,opacity : 0.7,textAlign : "center" }}>{connected ? 'connecté' : 'non connecté'}</Text>
       </View>
       </View>


      <View style={styles.bottomBar}>
        {showLog && (
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5,width : "100%" }}>
            {log.map((msg, i) => (
              <View key={i} style={{backgroundColor : "white"}}>
                <Text>{msg}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity style={{}} onPress={() => setShowLog(!showLog)}>
          <Text style={styles.buttonText}>{showLog ? "Cacher le log" : "Afficher le log"}</Text>
        </TouchableOpacity>
        <Text style={{fontWeight : "bold"}} >Trame APRS recus : {nbMessage}</Text>
        <TouchableOpacity style={styles.button} onPress={scanAndConnect}>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  },
  modalContent: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
});
