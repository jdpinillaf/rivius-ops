import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
};

export function KpiCard({ label, value, description, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
