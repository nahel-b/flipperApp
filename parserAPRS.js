export default function parseAprs(raw ) {

    const doubleColonIndex = raw.indexOf('::');
    if (raw.indexOf('::') !== -1) {
        const callsignMatch = raw.match(/^([A-Z0-9\-]+)>/);
        const callsign = callsignMatch?.[1] || '';
        const ssidMatch = callsign.match(/^([A-Z0-9]+)-([0-9]+)$/);
        const baseCallsign = ssidMatch ? ssidMatch[1] : callsign;
        const ssid = ssidMatch ? ssidMatch[2] : undefined;

        const target = raw.substring(doubleColonIndex + 2, doubleColonIndex + 11).trim();
        const message = raw.substring(doubleColonIndex + 12).trim();

        return {
        type: 'message',
        callsign: baseCallsign,
        ssid,
        target,
        message,
        //raw,
        };
    }

    // sinon les trois autres cas
    const [header, payload] = raw.split(':', 2);
    const callsignMatch = header.match(/^([A-Z0-9]+)(?:-([0-9]+))?>/);
    const callsign = callsignMatch?.[1] || '';
    const ssid = callsignMatch?.[2];

    // Objet
    if (payload.startsWith(';')) {
      const objectName = payload.substring(1, 9).trim();
      const pos = extractLatLon(payload.substring(18, 35));
      return {
        type: 'object',
        callsign,
        ssid,
        ...pos,
        message: payload.substring(35).trim(),
        //raw,
      };
    }
  
    // Weather
    if (payload.startsWith('_')) {
      const pos = extractLatLon(payload.substring(8, 25));
      const tempMatch = payload.match(/t(-?\d+)/);
      const humidityMatch = payload.match(/h(\d{2})/);
      const temp = tempMatch ? parseInt(tempMatch[1]) : undefined;
      const humidity = humidityMatch ? parseInt(humidityMatch[1]) : undefined;
      return {
        type: 'weather',
        callsign,
        ssid,
        ...pos,
        temperature: temp,
        humidity,
        //raw,
      };
    }
  
    // Position
    if (payload.startsWith('!') || payload.startsWith('=')) {
      const pos = extractLatLon(payload.substring(1, 18));
      const altMatch = payload.match(/A=(\d{6})/);
      const altitude = altMatch ? parseInt(altMatch[1]) : undefined;
      return {
        type: 'position',
        callsign,
        ssid,
        ...pos,
        altitude,
        //raw,
      };
    }
  
    // Fallback
    return { type: 'unknown',payload, callsign, ssid, raw };
  }
  
  
  function extractLatLon(posStr ) {
    const latRaw = posStr.substring(0, 8);
    const lonRaw = posStr.substring(9, 18);
    const lat = parseDMS(latRaw);
    const lon = parseDMS(lonRaw);
    return { latitude: lat, longitude: lon };
  }
  
  function parseDMS(dms ) {
    const deg = parseInt(dms.substring(0, 2));
    const min = parseFloat(dms.substring(2, 7));
    const sign = dms[7] === 'S' || dms[7] === 'W' ? -1 : 1;
    return sign * (deg + min / 60);
  }