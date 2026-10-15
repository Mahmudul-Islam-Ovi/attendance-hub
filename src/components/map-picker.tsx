"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, Loader2 } from "lucide-react";
import { getAccurateCurrentPosition } from "@/lib/gps-client";

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onChange: (data: { latitude: number; longitude: number; address?: string }) => void;
  height?: string;
}

export default function MapPicker({
  latitude,
  longitude,
  radiusMeters,
  onChange,
  height = "340px",
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      // Custom marker icon using SVG
      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
            border: 2px solid #ffffff;
            cursor: pointer;
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const initialLat = latitude || 23.7330;
      const initialLng = longitude || 90.4172;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        scrollWheelZoom: true,
      });

      // Free OpenStreetMap tile server
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Circle representing geofence
      const circle = L.circle([initialLat, initialLng], {
        radius: radiusMeters,
        color: "#4f46e5",
        fillColor: "#6366f1",
        fillOpacity: 0.18,
        weight: 2,
        dashArray: "4, 6",
      }).addTo(map);

      // Draggable marker
      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      // Reverse geocoding helper
      async function reverseGeocode(lat: number, lng: number) {
        try {
          setAddressLoading(true);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(",");
              const shortAddr = parts.length > 4 ? parts.slice(0, 4).join(", ").trim() : data.display_name;
              onChange({ latitude: lat, longitude: lng, address: shortAddr });
              return;
            }
          }
        } catch (_) {
        } finally {
          setAddressLoading(false);
        }
        onChange({ latitude: lat, longitude: lng });
      }

      // Drag event
      marker.on("dragend", (e: any) => {
        const pos = e.target.getLatLng();
        circle.setLatLng(pos);
        reverseGeocode(pos.lat, pos.lng);
      });

      // Click on map to move marker
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Force recalculate dimensions
      setTimeout(() => {
        if (isMounted && map) map.invalidateSize();
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  // Update marker & circle when latitude / longitude changes externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.00001 ||
        Math.abs(currentPos.lng - longitude) > 0.00001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // Handle current GPS location with high precision and cache-busting
  const handleDetectGPS = async () => {
    setLocating(true);
    try {
      const res = await getAccurateCurrentPosition({
        desiredAccuracy: 20,
        maxWaitTimeMs: 5500,
        timeoutMs: 12000,
        reverseGeocode: true,
      });

      const lat = res.latitude;
      const lng = res.longitude;

      if (mapInstanceRef.current && markerRef.current && circleRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        circleRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.flyTo([lat, lng], 17);
      }

      onChange({ latitude: lat, longitude: lng, address: res.address });
    } catch (e) {
      console.error(e);
    } finally {
      setLocating(false);
      setAddressLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />

      {/* Floating GPS button */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-indigo-700 font-bold text-xs rounded-xl shadow-md border border-indigo-100 transition active:scale-95 disabled:opacity-60"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          {locating ? "Locating..." : "My GPS"}
        </button>
      </div>

      {/* Floating Info Pill at bottom */}
      <div className="absolute bottom-2 left-2 right-2 z-[1000] pointer-events-none flex justify-center">
        <div className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
          <span>📍 ম্যাপে ক্লিক করে বা পিন ড্র্যাগ করে অফিসের অবস্থান নির্ধারণ করুন</span>
          {addressLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-300" />}
        </div>
      </div>
    </div>
  );
}
