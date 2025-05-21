'use client';

import { useState, useEffect } from 'react';
import { getTrackingStatus } from '@/lib/mixpanelClient';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TrackingStatusBadge() {
  const [status, setStatus] = useState<ReturnType<typeof getTrackingStatus> | null>(null);

  useEffect(() => {
    setStatus(getTrackingStatus());
  }, []);

  if (!status) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <Badge 
              variant={status.enabled ? 'default' : 'outline'} 
              className={status.enabled ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
            >
              Analytics: {status.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <InfoIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.message}</p>
          {!status.enabled && status.mode === 'open-source' && (
            <p className="text-xs mt-1">
              In open source mode, no usage data is collected to respect user privacy.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TrackingStatusSection() {
  const [status, setStatus] = useState<ReturnType<typeof getTrackingStatus> | null>(null);

  useEffect(() => {
    setStatus(getTrackingStatus());
  }, []);

  if (!status) return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Analytics Tracking</h3>
          <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
        </div>
        <Badge 
          variant={status.enabled ? 'default' : 'outline'} 
          className={status.enabled ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
        >
          {status.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
      {!status.enabled && status.mode === 'open-source' && (
        <div className="mt-2 text-sm">
          <p>
            Analytics tracking is disabled in open source mode to respect user privacy. 
            No usage data is collected when running your own instance.
          </p>
          <p className="mt-1">
            To enable tracking, set <code className="bg-slate-100 px-1 py-0.5 rounded">NEXT_PUBLIC_CLOUD_MODE=true</code> in your environment variables.
          </p>
        </div>
      )}
    </div>
  );
} 