"use client"

import { useState, useMemo } from "react";
import { MOCK_ALERTS, REGIONS } from "@/lib/mock-data";
import { InfrastructureAlert } from "@/lib/types";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { MapMock } from "@/components/dashboard/MapMock";
import { AlertDetailPanel } from "@/components/dashboard/AlertDetailPanel";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Bell, 
  ShieldCheck, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function InfraGuardDashboard() {
  const [selectedAlert, setSelectedAlert] = useState<InfrastructureAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const filteredAlerts = useMemo(() => {
    return MOCK_ALERTS.filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            alert.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === "all" || alert.state === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const criticalCount = useMemo(() => {
    return MOCK_ALERTS.filter(a => a.severity === 'Critical').length;
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden dark">
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
            />
          </div>
          
          <div className="flex gap-2 overflow-hidden">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full bg-secondary/50 border-white/10 text-xs h-9">
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

        <ScrollArea className="flex-1 px-4 pb-4 overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Bulletins</span>
              <Badge variant="secondary" className="text-[10px]">{filteredAlerts.length}</Badge>
            </div>
            {filteredAlerts.length > 0 ? (
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
              <span>Real-time Syncing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Connected</span>
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
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
              </Button>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 cursor-pointer hover:bg-primary/30 transition-colors">
                <span className="text-xs font-bold text-primary">OP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Layout: Map and Detail View */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
          <div className={`flex-1 transition-all duration-300 relative`}>
             <MapMock 
                alerts={filteredAlerts}
                selectedAlert={selectedAlert}
                onAlertClick={setSelectedAlert}
                selectedRegion={selectedRegion}
             />
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