import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ data }: { data: any[] }) {
  // Extract lat/lon points, ignoring nulls
  const positions: [number, number][] = data
    .filter((d) => d.lat !== null && d.lon !== null)
    .map((d) => [d.lat, d.lon]);

  if (positions.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500">No GPS data available</div>;
  }

  // Calculate bounding box for center
  const lats = positions.map(p => p[0]);
  const lons = positions.map(p => p[1]);
  const center: [number, number] = [
    (Math.max(...lats) + Math.min(...lats)) / 2,
    (Math.max(...lons) + Math.min(...lons)) / 2
  ];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden z-0 relative">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} />
      </MapContainer>
    </div>
  );
}
