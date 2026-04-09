"use client"

import { useState } from "react";
import { InfrastructureAlert } from "@/lib/types";
import { summarizeAlertDetails, SummarizeAlertDetailsOutput } from "@/ai/flows/summarize-alert-details";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Share2, 
  ExternalLink,
  Loader2,
  Info
} from "lucide-react";
import { format } from "date-fns";

interface AlertDetailPanelProps {
  alert: InfrastructureAlert | null;
  onClose: () => void;
}

export function AlertDetailPanel({ alert, onClose }: AlertDetailPanelProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  if (!alert) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
        <div className="p-4 rounded-full bg-secondary">
          <Info className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Select an alert</h3>
          <p className="text-sm">Click on an alert from the map or list to view full infrastructure details.</p>
        </div>
      </div>
    );
  }

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result: SummarizeAlertDetailsOutput = await summarizeAlertDetails({
        alertDescription: alert.description
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to summarize alert", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <Badge className={
            alert.severity === 'Critical' ? 'bg-destructive' : 
            alert.severity === 'Warning' ? 'bg-yellow-500' : 'bg-primary'
          }>
            {alert.severity}
          </Badge>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-2xl font-bold leading-tight font-headline mb-4">{alert.title}</h2>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(new Date(alert.timestamp), 'PPpp')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{alert.locationName || alert.state}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">{alert.source}</Badge>
            <Badge variant="outline" className="text-[10px]">{alert.category}</Badge>
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Alert Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{alert.description}</p>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">InfraGuard AI Summary</h3>
              </div>
              {!summary && !isSummarizing && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs gap-1.5"
                  onClick={handleSummarize}
                >
                  Generate Summary
                </Button>
              )}
            </div>
            
            {isSummarizing ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Summarizing details for rapid assessment...
              </div>
            ) : summary ? (
              <p className="text-sm italic text-foreground/90 border-l-2 border-primary pl-3 py-1">
                &quot;{summary}&quot;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Summarize this complex alert into a concise executive bulletin.
              </p>
            )}
          </section>

          <section className="pt-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Action Checklist</h3>
            <div className="space-y-2">
              {[
                "Verify affected infrastructure status",
                "Notify regional dispatch operators",
                "Evaluate alternate logistics routes",
                "Update internal tracking systems"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}