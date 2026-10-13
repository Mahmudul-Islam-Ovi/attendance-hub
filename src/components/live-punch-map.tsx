"use client";

import React, { useEffect, useRef } from "react";

interface LivePunchMapProps {
  employeeLat: number;
  employeeLng: number;
  officeLat?: number;
  officeLng?: number;
  officeRadius?: number;
  officeName?: string;
  isInside?: boolean;
  height?: string;
}

export default function LivePunchMap({
  employeeLat,
  employeeLng,
  officeLat,
  officeLng,
  officeRadius = 200,
  officeName = "Office HQ",
  isInside = true,
  height = "220px",
}: LivePunchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      // Employee pulsing marker (read-only)
      const employeeIcon = L.divIcon({
        className: "employee-live-marker",
        html: `
          <div style="position: relative; width: 28px; height: 28px;">
            <div style="
              position: absolute;
              inset: -6px;
              border-radius: 50%;
              background: ${isInside ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"};
              animation: pulse 2s infinite ease-out;
            "></div>
            <div style="
              position: relative;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: ${isInside ? "#10b981" : "#ef4444"};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Office building marker
      const officeIcon = L.divIcon({
        className: "office-building-marker",
        html: `
          <div style="
            background: #4f46e5;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
          ">
            <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const map = L.map(mapContainerRef.current, {
        center: [employeeLat, employeeLng],
        zoom: 16,
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      // Add zoom control in top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      // If office location is provided, render office and radius
      const markersGroup = L.featureGroup();

      if (officeLat && officeLng) {
        // Office Geofence Circle
        L.circle([officeLat, officeLng], {
          radius: officeRadius,
          color: isInside ? "#10b981" : "#ef4444",
          fillColor: isInside ? "#10b981" : "#ef4444",
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "3, 5",
        }).addTo(map);

        const offMarker = L.marker([officeLat, officeLng], {
          icon: officeIcon,
          interactive: false,
        }).addTo(map);
        markersGroup.addLayer(offMarker);
      }

      // Employee live position (Read-Only)
      const empMarker = L.marker([employeeLat, employeeLng], {
        icon: employeeIcon,
        interactive: false,
      }).addTo(map);
      markersGroup.addLayer(empMarker);

      // Auto fit bounds to show both employee and office
      if (officeLat && officeLng) {
        try {
          map.fitBounds(markersGroup.getBounds().pad(0.2));
        } catch (_) {
          map.setView([employeeLat, employeeLng], 16);
        }
      }

      mapInstanceRef.current = map;

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
  }, [employeeLat, employeeLng, officeLat, officeLng, officeRadius, isInside]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 1 }} />

      {/* Floating Read-Only Badge */}
      <div className="absolute top-2.5 left-2.5 z-[1000] flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md text-[11px] font-bold rounded-lg shadow-sm border border-slate-200">
        <span
          className={`w-2 h-2 rounded-full ${
            isInside ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
          }`}
        />
        <span className={isInside ? "text-emerald-700" : "text-rose-700"}>
          {isInside ? "✓ সীমানার ভেতরে (Verified)" : "⚠ সীমানার বাইরে (Out of range)"}
        </span>
      </div>

      <div className="absolute bottom-1.5 right-2 z-[1000] text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded-md pointer-events-none">
        🔒 Tamper-Proof Live GPS
      </div>
    </div>
  );
}
