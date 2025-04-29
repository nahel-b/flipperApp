import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const SondeHubTelemetry = () => {
  const [sondesData, setSondesData] = useState([]);
  
  useEffect(() => {
    const fetchTelemetryData = async () => {
      try {
        const response = await fetch('https://api.v2.sondehub.org/sondes/telemetry?duration=1h');
        const data = await response.json();
        ; // Affiche les 5 premières sondes pour le débogage
        // Convert object of sondes to array format
        const sondesArray = Object.entries(data).map(([name, properties]) => {
            // Get the most recent date (usually the last entry in the object)
            const dates = Object.keys(properties);
            if (dates.length === 0) return null;
            
            const mostRecentDate = dates[dates.length - 1];
            const telemetryData = properties[mostRecentDate];
            
            return {
                name,
                ...telemetryData,
                timestamp: mostRecentDate // Include the timestamp for reference
            };
        }).filter(Boolean); // Remove null entries if any sonde had no data
        setSondesData(sondesArray);
        console.log('Données de télémétrie des sondes :', sondesArray[0].uploaders); // Affiche les 3 premières sondes pour le débogage
      } catch (error) { 
        console.error('Erreur lors de la récupération des télémétries des sondes :', error);
      }
    };

    fetchTelemetryData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {sondesData.length > 0 ? (
        <MapView
          style={{ flex: 1, height: 400 }}
          initialRegion={{
            latitude: sondesData[0].lat || 0,
            longitude: sondesData[0].lon || 0,
            latitudeDelta: 5,
            longitudeDelta: 5,
          }}
        >
          {sondesData.map((sonde, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: sonde.lat, longitude: sonde.lon }}
              title={sonde.name}
              description={`Type : ${sonde.type}  Altitude: ${sonde.alt || 'N/A'} `}
            />
          ))} 
        </MapView>
      ) : (
        <Text>Aucune donnée de télémétrie disponible</Text>
      )}
    </View>
  );
};

export default SondeHubTelemetry;
