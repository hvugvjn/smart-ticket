import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface MapMiniProps {
  pickup: Location;
  drop: Location;
  stops?: Location[];
  zoom?: number;
}

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ pickup, drop, stops }: { pickup: Location; drop: Location; stops: Location[] }) {
  const map = useMap();

  useEffect(() => {
    const allPoints: [number, number][] = [
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng],
      ...stops.map(s => [s.lat, s.lng] as [number, number]),
    ];
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, pickup, drop, stops]);

  return null;
}

function EnableInteraction() {
  const map = useMap();
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const container = map.getContainer();
    const handleClick = () => {
      if (!enabled) {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoom.enable();
        setEnabled(true);
      }
    };
    
    container.addEventListener("click", handleClick, { once: true });
    return () => container.removeEventListener("click", handleClick);
  }, [map, enabled]);
  
  return null;
}

export function MapMini({ pickup, drop, stops = [], zoom = 10 }: MapMiniProps) {
  const mapRef = useRef<L.Map | null>(null);

  const routePoints: [number, number][] = [
    [pickup.lat, pickup.lng],
    ...stops.map(s => [s.lat, s.lng] as [number, number]),
    [drop.lat, drop.lng],
  ];

  const center: [number, number] = [
    (pickup.lat + drop.lat) / 2,
    (pickup.lng + drop.lng) / 2,
  ];

  return (
    <div
      role="application"
      aria-label="Route map - click to interact"
      className="rounded-xl overflow-hidden border border-white/10 cursor-pointer"
      style={{ height: 220 }}
    >
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <EnableInteraction />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds pickup={pickup} drop={drop} stops={stops} />

        <Polyline
          positions={routePoints}
          pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.8 }}
        />

        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <strong>Pickup:</strong> {pickup.name}
          </Popup>
        </Marker>

        <Marker position={[drop.lat, drop.lng]} icon={dropIcon}>
          <Popup>
            <strong>Drop:</strong> {drop.name}
          </Popup>
        </Marker>

        {stops.map((stop, index) => (
          <CircleMarker
            key={index}
            center={[stop.lat, stop.lng]}
            radius={6}
            pathOptions={{
              fillColor: "#f59e0b",
              fillOpacity: 0.9,
              color: "#fff",
              weight: 2,
            }}
          >
            <Popup>{stop.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
