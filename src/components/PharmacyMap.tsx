import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PharmacyWithDistance, UserLocation } from '../types/pharmacy';
import { colors } from '../theme';

const ABIDJAN = { lat: 5.3599, lng: -4.0083 };

interface Props {
  pharmacies: PharmacyWithDistance[];
  userLocation: UserLocation | null;
}

function buildMapHtml(pharmacies: PharmacyWithDistance[], userLocation: UserLocation | null) {
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [ABIDJAN.lat, ABIDJAN.lng];

  const markersJs = pharmacies
    .map((p) => {
      const color = p.is_on_duty_now ? colors.success : '#9CA3AF';
      const popup = `<b>${p.name}</b><br>${p.commune} • ${p.distance_km.toFixed(1)} km${p.phone ? `<br><a href="tel:${p.phone}">${p.phone}</a>` : ''}`;
      return `L.circleMarker([${p.latitude},${p.longitude}],{radius:8,color:"${color}",fillColor:"${color}",fillOpacity:1,weight:2}).bindPopup(\`${popup}\`).addTo(map);`;
    })
    .join('\n');

  const userJs = userLocation
    ? `L.circleMarker([${userLocation.latitude},${userLocation.longitude}],{radius:9,color:"${colors.primary}",fillColor:"${colors.primary}",fillOpacity:1,weight:3}).bindPopup("Ma position").addTo(map);`
    : '';

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('map').setView([${center[0]},${center[1]}],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
${markersJs}
${userJs}
</script>
</body></html>`;
}

export default function PharmacyMap({ pharmacies, userLocation }: Props) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const node = containerRef.current as unknown as HTMLElement;
    if (!node) return;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.srcdoc = buildMapHtml(pharmacies, userLocation);
    node.innerHTML = '';
    node.appendChild(iframe);

    return () => { node.innerHTML = ''; };
  }, [pharmacies, userLocation]);

  return <View ref={containerRef} style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
