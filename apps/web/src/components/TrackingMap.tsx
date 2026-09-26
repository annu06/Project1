import { divIcon } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { Order } from '../types';

const pinIcon = (kind: 'pickup' | 'dropoff' | 'vehicle') => divIcon({
  className: '',
  html: `<span class="map-pin map-pin--${kind}">${kind === 'vehicle' ? '➤' : ''}</span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(position, map.getZoom(), { duration: 0.8 }); }, [map, position]);
  return null;
}

export function TrackingMap({ order }: { order: Order }) {
  const pickup: [number, number] = [order.pickup.lat, order.pickup.lng];
  const dropoff: [number, number] = [order.dropoff.lat, order.dropoff.lng];
  const vehicle: [number, number] | null = order.currentLocation
    ? [order.currentLocation.lat, order.currentLocation.lng]
    : null;
  const center = vehicle ?? pickup;
  const trail = order.locationHistory.map((point) => [point.lat, point.lng] as [number, number]);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="tracking-map">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={pickup} icon={pinIcon('pickup')}><Popup>{order.pickup.address}</Popup></Marker>
      <Marker position={dropoff} icon={pinIcon('dropoff')}><Popup>{order.dropoff.address}</Popup></Marker>
      <Polyline positions={[pickup, ...trail, dropoff]} pathOptions={{ color: '#e7473c', weight: 3, dashArray: trail.length ? undefined : '8 8' }} />
      {vehicle && <><Marker position={vehicle} icon={pinIcon('vehicle')}><Popup>Delivery agent's latest location</Popup></Marker><Recenter position={vehicle} /></>}
    </MapContainer>
  );
}
