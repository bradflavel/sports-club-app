'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Dumbbell, Tent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { enableModule, disableModule } from '@/features/activities/services/module-service';
import type { OrganisationModule, ActivityType } from '@/lib/supabase/database.types';

const ICON_MAP = { Trophy, Award, Dumbbell, Tent } as Record<
  string,
  React.ComponentType<{ className?: string }>
>;

interface ModuleSettingsProps {
  orgId: string;
  modules: OrganisationModule[];
  onModuleChange: () => void;
}

export function ModuleSettings({ orgId, modules, onModuleChange }: ModuleSettingsProps) {
  const { toast } = useToast();
  const [togglingTypes, setTogglingTypes] = useState<Set<ActivityType>>(new Set());

  const activityTypes = Object.keys(ACTIVITY_TYPE_CONFIG) as ActivityType[];

  const handleToggle = async (activityType: ActivityType, currentlyEnabled: boolean) => {
    setTogglingTypes((prev) => new Set(prev).add(activityType));

    const config = ACTIVITY_TYPE_CONFIG[activityType];
    const { error } = currentlyEnabled
      ? await disableModule(orgId, activityType)
      : await enableModule(orgId, activityType);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to update ${config.singularLabel} module.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: currentlyEnabled ? 'Module disabled' : 'Module enabled',
        description: `${config.singularLabel} has been ${currentlyEnabled ? 'disabled' : 'enabled'}.`,
      });
      onModuleChange();
    }

    setTogglingTypes((prev) => {
      const next = new Set(prev);
      next.delete(activityType);
      return next;
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {activityTypes.map((activityType) => {
        const config = ACTIVITY_TYPE_CONFIG[activityType];
        const Icon = ICON_MAP[config.icon];
        const moduleRow = modules.find((m) => m.activity_type === activityType);
        const isEnabled = moduleRow?.is_enabled ?? false;
        const isToggling = togglingTypes.has(activityType);

        return (
          <Card key={activityType}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {Icon && <Icon className="h-4 w-4" />}
                {config.singularLabel}
              </CardTitle>
              <Switch
                checked={isEnabled}
                disabled={isToggling}
                onCheckedChange={() => handleToggle(activityType, isEnabled)}
              />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
