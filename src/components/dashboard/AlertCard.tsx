"use client"

import { InfrastructureAlert } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CloudLightning,
  Waves,
  Flame,
  Construction,
  MapPin,
  Info
} from "lucide-react";

interface AlertCardProps {
  alert: InfrastructureAlert;
  isActive?: boolean;
  onClick?: (alert: InfrastructureAlert) => void;
}

export function AlertCard({ alert, isActive, onClick }: AlertCardProps) {
  const getIcon = () => {
    switch (alert.category) {
      case 'Weather': return <CloudLightning className="h-4 w-4" />;
      case 'Flood': return <Waves className="h-4 w-4" />;
      case 'Wildfire': return <Flame className="h-4 w-4" />;
      case 'Bridge':
      case 'Road': return <Construction className="h-4 w-4" />;
      case 'Rail':
      case 'Pipeline': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'Critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Info': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 group",
        isActive ? "ring-2 ring-primary bg-primary/5" : "bg-card/50",
        alert.severity === 'Critical' && "border-l-4 border-l-destructive"
      )}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-1.5", getSeverityColor())}>
              {alert.severity}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {alert.title}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{alert.locationName || alert.state || 'Regional'}</span>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-full",
          isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {getIcon()}
        </div>
      </div>
    </Card>
  );
}