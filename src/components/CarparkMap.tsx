import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType } from '../types/carpark';
import { getLotAvailabilityStatus, formatDistance } from '../data/singaporeCarparks';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userLocation: { lat: number; lng: number };
  searchRadiusKm: number;
  vehicleType: VehicleType;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  searchRadiusKm,
  vehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: false,
      });

      // CartoDB Dark Matter tiles (modern dark map, fast, no API key needed)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control
        .zoom({
          position: 'bottomright',
        })
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker & Search Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update or create user location marker
    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: rgba(56, 189, 248, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #38bdf8; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(56,189,248,0.8);"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindTooltip('Your Location', { direction: 'top', offset: [0, -10] });
    }

    // Radius Circle
    if (searchRadiusKm > 0 && searchRadiusKm < 50) {
      const radiusMeters = searchRadiusKm * 1000;
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        radiusCircleRef.current.setRadius(radiusMeters);
      } else {
        radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusMeters,
          color: '#38bdf8',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#38bdf8',
          fillOpacity: 0.05,
          dashArray: '4, 6',
        }).addTo(map);
      }
    } else if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
  }, [userLocation, searchRadiusKm]);

  // Update Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    carparks.forEach((carpark) => {
      let lotsAvail = carpark.lots.car.available;
      let lotsTotal = carpark.lots.car.total;

      if (vehicleType === 'motorcycle' && carpark.lots.motorcycle) {
        lotsAvail = carpark.lots.motorcycle.available;
        lotsTotal = carpark.lots.motorcycle.total;
      } else if (vehicleType === 'heavyVehicle' && carpark.lots.heavyVehicle) {
        lotsAvail = carpark.lots.heavyVehicle.available;
        lotsTotal = carpark.lots.heavyVehicle.total;
      }

      const status = getLotAvailabilityStatus(lotsAvail, lotsTotal);
      const isSelected = selectedCarpark?.id === carpark.id;

      // Clean badge showing lots directly
      const markerHtml = `
        <div class="carpark-marker" style="cursor: pointer;">
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${isSelected ? '#0284c7' : '#0f172a'};
            border: ${isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.18)'};
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
          ">
            <span style="
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: ${lotsAvail === 0 ? '#f43f5e' : lotsAvail < 20 ? '#fbbf24' : '#10b981'};
              display: inline-block;
            "></span>
            <span>${lotsAvail}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: markerHtml,
        iconSize: [48, 26],
        iconAnchor: [24, 13],
      });

      const marker = L.marker([carpark.coordinates.lat, carpark.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 900 : 100,
      });

      // Popup content
      const popupHtml = `
        <div style="padding: 12px; min-width: 220px; font-family: inherit;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #f8fafc; line-height: 1.2;">${carpark.name}</div>
            <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">${carpark.agency}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">${carpark.address}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(255,255,255,0.04); border-radius: 6px; margin-bottom: 8px;">
            <span style="font-size: 11px; color: #cbd5e1;">Available Lots</span>
            <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: ${
              lotsAvail === 0 ? '#f43f5e' : lotsAvail < 20 ? '#fbbf24' : '#34d399'
            };">${lotsAvail} / ${lotsTotal}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            <span>${carpark.rates.weekdayPeak}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="
                flex: 1;
                text-align: center;
                background: #0284c7;
                color: #ffffff;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
              "
            >
              Directions ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectCarpark(carpark);
      });

      markersGroup.addLayer(marker);
    });
  }, [carparks, selectedCarpark, onSelectCarpark, vehicleType]);

  // When selected carpark changes, smoothly center map
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      16,
      { duration: 0.8 }
    );
  }, [selectedCarpark]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 shadow-lg pointer-events-none flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>&gt;40 Lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span>15-40</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>&lt;15 / Full</span>
        </div>
      </div>
    </div>
  );
};
