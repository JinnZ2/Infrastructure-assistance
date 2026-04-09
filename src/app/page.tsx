"use client"

import { useState, useMemo, useEffect, useCallback } from "react";
import { MOCK_ALERTS, REGIONS } from "@/lib/mock-data";
import { filterAlerts } from "@/lib/alert-service";
import { InfrastructureAlert } from "@/lib/types";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { MapMock } from "@/components/dashboard/MapMock";
import { AlertDetailPanel } from "@/components/dashboard/AlertDetailPanel";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Bell,
  ShieldCheck,
  Menu,
  ChevronLeft,
  ChevronRight,
  Database,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function InfraGuardDashboard() {
  const [alerts, setAlerts] = useState<InfrastructureAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<InfrastructureAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  // Load alerts
  useEffect(() => {
    setIsLoading(true);
    // Simulate async fetch — swap with real API call when ready
    const timer = setTimeout(() => {
      setAlerts(MOCK_ALERTS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Notify on critical alerts
  useEffect(() => {
    if (isLoading) return;
    const newCritical = alerts.filter(
      a => a.severity === 'Critical' && !notifiedIds.has(a.id)
    );
    if (newCritical.length > 0) {
      const ids = new Set(notifiedIds);
      newCritical.forEach(a => {
        ids.add(a.id);
        toast({
          title: `Critical: ${a.title}`,
          description: a.locationName || a.state || 'Regional alert',
          variant: 'destructive',
        });
      });
      setNotifiedIds(ids);
    }
  }, [alerts, isLoading, notifiedIds]);

  const filteredAlerts = useMemo(() => {
    return filterAlerts(alerts, searchQuery, selectedRegion);
  }, [alerts, searchQuery, selectedRegion]);

  const criticalCount = useMemo(() => {
    return alerts.filter(a => a.severity === 'Critical').length;
  }, [alerts]);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return (
    <div className={`flex h-screen w-full bg-background overflow-hidden ${isDark ? 'dark' : ''}`}>
      {/* Sidebar: Alert Feed */}
      <aside className={`
        flex flex-col border-r bg-card/30 backdrop-blur-sm transition-all duration-300 relative
        ${isSidebarOpen ? 'w-[350px]' : 'w-0'}
      `}>
        <div className="p-4 border-b flex items-center justify-between overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold font-headline tracking-tight">InfraGuard</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:flex hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search active alerts..."
              className="pl-9 bg-secondary/50 border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search alerts"
            />
          </div>

          <div className="flex gap-2 overflow-hidden">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full bg-secondary/50 border-white/10 text-xs h-9" aria-label="Filter by region">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Region" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {REGIONS.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Bulletins</span>
              <Badge variant="secondary" className="text-[10px]">{isLoading ? '...' : filteredAlerts.length}</Badge>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-card/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  isActive={selectedAlert?.id === alert.id}
                  onClick={setSelectedAlert}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No alerts found for this filter.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card/50 overflow-hidden whitespace-nowrap">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              <span>{isLoading ? 'Loading...' : 'Real-time Syncing'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
              <span>{isLoading ? 'Fetching' : 'Connected'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm z-30">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <Button
                variant="outline"
                size="icon"
                className="mr-2"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground">Primary Monitoring Node</span>
                <span className="text-sm font-bold flex items-center gap-2">
                  Upper Midwest Sector-04
                  <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Operational</Badge>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-4 pr-4 border-r mr-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Critical Alerts</span>
                <span className="text-sm font-bold text-destructive flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive pulse-critical" />
                  {criticalCount} Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleDarkMode}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {criticalCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Button>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 cursor-pointer hover:bg-primary/30 transition-colors">
                <span className="text-xs font-bold text-primary">OP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Layout: Map and Detail View */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
          <div className="flex-1 transition-all duration-300 relative">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <MapMock
                alerts={filteredAlerts}
                selectedAlert={selectedAlert}
                onAlertClick={setSelectedAlert}
                selectedRegion={selectedRegion}
              />
            )}
          </div>

          {/* Collapsible Detail Panel */}
          {selectedAlert && (
            <div className="w-[450px] hidden xl:block bg-card/80 backdrop-blur-xl border rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
              <AlertDetailPanel
                alert={selectedAlert}
                onClose={() => setSelectedAlert(null)}
              />
            </div>
          )}

          {/* Mobile/Overlay Detail Panel */}
          {selectedAlert && (
            <div className="xl:hidden fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm p-4 flex items-center justify-center">
              <div className="w-full max-w-lg h-[90vh] bg-card border rounded-2xl shadow-2xl overflow-hidden relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-[110]"
                  onClick={() => setSelectedAlert(null)}
                  aria-label="Close detail panel"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <AlertDetailPanel
                  alert={selectedAlert}
                  onClose={() => setSelectedAlert(null)}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
