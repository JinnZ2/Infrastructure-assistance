"use client"

/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { InfrastructureAlert } from "@/lib/types";
import { REGIONS } from "@/lib/mock-data";

interface AlertMapProps {
  alerts: InfrastructureAlert[];
  selectedAlert?: InfrastructureAlert | null;
  onAlertClick: (alert: InfrastructureAlert) => void;
  selectedRegion: string;
}

const DEFAULT_CENTER: [number, number] = [45.5, -92.0];
const DEFAULT_ZOOM = 6;

function severityColor(severity: string): string {
  switch (severity) {
    case "Critical": return "#ef4444";
    case "Warning": return "#eab308";
    case "Info": return "#19e6e6";
    default: return "#6b7280";
  }
}

function severityRadius(severity: string): number {
  switch (severity) {
    case "Critical": return 12;
    case "Warning": return 10;
    default: return 8;
  }
}

/** Moves the map when the selected alert or region changes. */
function MapController({
  selectedAlert,
  selectedRegion,
}: {
  selectedAlert: InfrastructureAlert | null | undefined;
  selectedRegion: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedAlert?.lat != null && selectedAlert?.lon != null) {
      map.flyTo([selectedAlert.lat, selectedAlert.lon], 9, { duration: 0.8 });
    }
  }, [selectedAlert, map]);

  useEffect(() => {
    if (selectedRegion === "all") {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
      return;
    }
    const region = REGIONS.find((r) => r.id === selectedRegion);
    if (region) {
      const { lat_min, lat_max, lon_min, lon_max } = region.bbox;
      map.flyToBounds(
        [
          [lat_min, lon_min],
          [lat_max, lon_max],
        ],
        { duration: 0.6, padding: [30, 30] }
      );
    }
  }, [selectedRegion, map]);

  return null;
}

export function AlertMap({
  alerts,
  selectedAlert,
  onAlertClick,
  selectedRegion,
}: AlertMapProps) {
  const visibleAlerts = useMemo(
    () => alerts.filter((a) => a.lat != null && a.lon != null),
    [alerts]
  );

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController
          selectedAlert={selectedAlert}
          selectedRegion={selectedRegion}
        />

        {visibleAlerts.map((alert) => {
          const isSelected = selectedAlert?.id === alert.id;
          const color = severityColor(alert.severity);
          const radius = severityRadius(alert.severity);

          return (
            <CircleMarker
              key={alert.id}
              center={[alert.lat!, alert.lon!]}
              radius={isSelected ? radius + 4 : radius}
              pathOptions={{
                color: isSelected ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.7,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onAlertClick(alert),
              }}
            >
              <Popup>
                <div className="text-xs min-w-[180px]">
                  <div className="font-bold text-sm mb-1">{alert.title}</div>
                  <div className="text-gray-600">
                    {alert.locationName || alert.state} &middot;{" "}
                    <span
                      style={{ color }}
                      className="font-semibold"
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-500">{alert.source} &middot; {alert.category}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute left-4 top-4 bg-background/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden md:block z-[400]">
        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">
          Alert Legend
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-[#eab308]" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-[#19e6e6]" />
            <span>Info</span>
          </div>
        </div>
      </div>
    </div>
  );
}
