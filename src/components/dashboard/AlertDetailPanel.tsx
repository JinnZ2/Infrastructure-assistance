"use client"

import { useState, useCallback } from "react";
import { InfrastructureAlert } from "@/lib/types";
import { summarizeAlertDetails, SummarizeAlertDetailsOutput } from "@/ai/flows/summarize-alert-details";
import { triageAlert, TriageAlertOutput } from "@/ai/flows/triage-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Clock,
  MapPin,
  Share2,
  ExternalLink,
  Loader2,
  Info,
  ShieldAlert,
  CircleCheck,
} from "lucide-react";
import { format } from "date-fns";

interface AlertDetailPanelProps {
  alert: InfrastructureAlert | null;
  onClose: () => void;
}

const DEFAULT_ACTIONS = [
  "Verify affected infrastructure status",
  "Notify regional dispatch operators",
  "Evaluate alternate logistics routes",
  "Update internal tracking systems",
];

export function AlertDetailPanel({ alert, onClose }: AlertDetailPanelProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [triage, setTriage] = useState<TriageAlertOutput | null>(null);
  const [triageError, setTriageError] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);

  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set());

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
    setSummaryError(false);
    try {
      const result: SummarizeAlertDetailsOutput = await summarizeAlertDetails({
        alertDescription: alert.description,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to summarize alert", error);
      setSummaryError(true);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTriage = async () => {
    setIsTriaging(true);
    setTriageError(false);
    try {
      const result = await triageAlert({
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        category: alert.category,
        locationName: alert.locationName ?? alert.state ?? undefined,
      });
      setTriage(result);
      setCheckedActions(new Set());
    } catch (error) {
      console.error("Failed to triage alert", error);
      setTriageError(true);
    } finally {
      setIsTriaging(false);
    }
  };

  const toggleAction = (label: string) => {
    setCheckedActions(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const actionItems = triage
    ? triage.actions.map(a => a.label)
    : DEFAULT_ACTIONS;

  const completedCount = checkedActions.size;
  const totalCount = actionItems.length;

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'soon': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-accent/10 text-accent border-accent/20';
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Copy alert link"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?alert=${alert.id}`);
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View source" disabled>
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

          {/* AI Summary */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">AI Summary</h3>
              </div>
              {!summary && !isSummarizing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleSummarize}
                >
                  {summaryError ? 'Retry' : 'Generate Summary'}
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
            ) : summaryError ? (
              <p className="text-xs text-destructive">
                Failed to generate summary. Check your API key configuration and try again.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Summarize this complex alert into a concise executive bulletin.
              </p>
            )}
          </section>

          {/* AI Triage */}
          <section className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold">AI Triage</h3>
              </div>
              {!triage && !isTriaging && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleTriage}
                >
                  {triageError ? 'Retry' : 'Run Triage'}
                </Button>
              )}
            </div>

            {isTriaging ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing alert and generating response plan...
              </div>
            ) : triage ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={priorityColor(
                    triage.impactLevel === 'critical' ? 'immediate' :
                    triage.impactLevel === 'high' ? 'soon' : 'monitor'
                  )}>
                    {triage.impactLevel} impact
                  </Badge>
                </div>
                <p className="text-sm text-foreground/90">{triage.assessment}</p>
                {triage.affectedSystems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {triage.affectedSystems.map((sys, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{sys}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : triageError ? (
              <p className="text-xs text-destructive">
                Failed to run triage. Check your API key configuration and try again.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Get an AI-powered risk assessment with recommended response actions.
              </p>
            )}
          </section>

          {/* Interactive Action Checklist */}
          <section className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Action Checklist
              </h3>
              {totalCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {completedCount}/{totalCount}
                  {completedCount === totalCount && (
                    <CircleCheck className="inline-block ml-1 h-3 w-3 text-green-500" />
                  )}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {actionItems.map((item, i) => {
                const isChecked = checkedActions.has(item);
                const priority = triage?.actions[i]?.priority;
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-xs cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleAction(item)}
                    />
                    <span className={isChecked ? 'line-through text-muted-foreground' : ''}>
                      {item}
                    </span>
                    {priority && (
                      <Badge variant="outline" className={`ml-auto text-[9px] ${priorityColor(priority)}`}>
                        {priority}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
