"use client"

import { useEffect, useState } from "react";
import { InfrastructureAlert, RegionFocus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin, ZoomIn, ZoomOut, Layers, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapMockProps {
  alerts: InfrastructureAlert[];
  selectedAlert?: InfrastructureAlert | null;
  onAlertClick: (alert: InfrastructureAlert) => void;
  selectedRegion: string;
}

export function MapMock({ alerts, selectedAlert, onAlertClick, selectedRegion }: MapMockProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-slate-900 animate-pulse" />;

  return (
    <div className="relative w-full h-full bg-[#192227] overflow-hidden rounded-xl border border-white/5 shadow-2xl">
      {/* Abstract Map Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Grid Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Region Labels (Simplified UI Representation) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="grid grid-cols-3 gap-24 opacity-20">
          <span className="text-4xl font-bold font-headline select-none">ND</span>
          <span className="text-4xl font-bold font-headline select-none">MN</span>
          <span className="text-4xl font-bold font-headline select-none">WI</span>
          <span className="text-4xl font-bold font-headline select-none">SD</span>
          <span className="text-4xl font-bold font-headline select-none">IA</span>
          <span className="text-4xl font-bold font-headline select-none">IL</span>
        </div>
      </div>

      {/* Markers */}
      <div className="absolute inset-0">
        {alerts.map((alert) => {
          // Semi-random placement logic based on lat/lon for visual representation
          const left = alert.lon ? ((alert.lon + 97) / 15) * 100 : Math.random() * 80 + 10;
          const top = alert.lat ? ((49 - alert.lat) / 7) * 100 : Math.random() * 80 + 10;

          const isSelected = selectedAlert?.id === alert.id;
          const isCritical = alert.severity === 'Critical';

          return (
            <button
              key={alert.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10",
                isSelected && "z-20 scale-150"
              )}
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => onAlertClick(alert)}
            >
              <div className="relative">
                {isCritical && (
                  <div className="absolute inset-0 rounded-full bg-destructive pulse-critical" />
                )}
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-colors",
                  isSelected 
                    ? "bg-primary border-white" 
                    : alert.severity === 'Critical'
                      ? "bg-destructive border-white/50"
                      : alert.severity === 'Warning'
                        ? "bg-yellow-500 border-white/50"
                        : "bg-accent border-white/50"
                )}>
                  <MapPin className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="rounded-full shadow-lg h-9 w-9">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full shadow-lg h-9 w-9">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full shadow-lg h-9 w-9">
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute left-4 bottom-4">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <Compass className="h-3 w-3 animate-spin-slow" />
          <span>46° 15&apos; N / 93° 10&apos; W</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute left-4 top-4 bg-background/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl hidden md:block">
        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">Alert Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>Critical Closure</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Hazard Warning</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Operational Update</span>
          </div>
        </div>
      </div>
    </div>
  );
}