import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  label,
  icon,
  className,
}: NumberStepperProps) {
  const canDecrement = value > (min ?? 0);
  const canIncrement = max === undefined || value < max;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-base font-semibold tabular-nums">
          {value === 0 ? '—' : value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
