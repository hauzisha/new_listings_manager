import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { SystemSettings } from '@/lib/types';

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<SystemSettings>('/api/admin/settings'),
  });

  const { register, handleSubmit, watch, setValue, reset } = useForm<SystemSettings>({
    defaultValues: {
      recruiter_bonus_enabled: false,
      recruiter_bonus_amount: 0,
      agent_response_sla_hours: 24,
      stale_inquiry_threshold_days: 7,
    },
  });

  const recruiterBonusEnabled = watch('recruiter_bonus_enabled');

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: SystemSettings) => api.put<SystemSettings>('/api/admin/settings', data),
    onSuccess: () => {
      toast.success('Settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const onSubmit = (data: SystemSettings) => saveMutation.mutate(data);

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="p-5 md:p-6 max-w-2xl space-y-4">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="p-5 md:p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Card 1: Recruiter Bonus */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recruiter Bonus</CardTitle>
              <CardDescription className="text-sm">
                A bonus paid to agents who recruited a promoter when that promoter closes a deal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="recruiter-bonus-toggle" className="text-sm font-medium cursor-pointer">
                  Enable recruiter bonus
                </Label>
                <Switch
                  id="recruiter-bonus-toggle"
                  checked={recruiterBonusEnabled}
                  onCheckedChange={(checked) => setValue('recruiter_bonus_enabled', checked)}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="bonus-amount"
                  className={`text-sm font-medium ${!recruiterBonusEnabled ? 'text-muted-foreground' : ''}`}
                >
                  Bonus amount (KES)
                </Label>
                <Input
                  id="bonus-amount"
                  type="number"
                  min={0}
                  step={100}
                  disabled={!recruiterBonusEnabled}
                  className="h-10"
                  {...register('recruiter_bonus_amount', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Response Time SLA */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Response Time SLA</CardTitle>
              <CardDescription className="text-sm">
                Target time for agents to respond to new inquiries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="sla-hours" className="text-sm font-medium">
                  Response target (hours)
                </Label>
                <Input
                  id="sla-hours"
                  type="number"
                  min={1}
                  max={168}
                  className="h-10 max-w-[200px]"
                  {...register('agent_response_sla_hours', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Stale Inquiry Threshold */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Stale Inquiry Threshold</CardTitle>
              <CardDescription className="text-sm">
                Inquiries with no activity beyond this threshold are flagged as stale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="stale-days" className="text-sm font-medium">
                  Threshold (days)
                </Label>
                <Input
                  id="stale-days"
                  type="number"
                  min={1}
                  max={90}
                  className="h-10 max-w-[200px]"
                  {...register('stale_inquiry_threshold_days', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
