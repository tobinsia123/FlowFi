import { Button } from "@/components/ui/button";
import { Instagram, BarChart3 } from "lucide-react";

interface EmptyStateProps {
  type: "instagram" | "analytics";
  onConnect?: () => void;
}

export function EmptyState({ type, onConnect }: EmptyStateProps) {
  if (type === "instagram") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Instagram className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Connect Instagram</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Link your creator account to analyze engagement volatility and get personalized hedge recommendations.
        </p>
        <Button onClick={onConnect} className="gap-2" size="lg">
          <Instagram className="h-4 w-4" />
          Connect Instagram
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Connect to see hedge recommendations</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your analytics will appear here once you connect Instagram.
      </p>
    </div>
  );
}
