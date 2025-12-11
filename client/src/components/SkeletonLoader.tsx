import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  height?: string | number;
  width?: string | number;
  variant?: "default" | "circle" | "text";
  className?: string;
}

export function SkeletonLoader({
  height = "1rem",
  width = "100%",
  variant = "default",
  className,
}: SkeletonLoaderProps) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;
  const widthStyle = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      className={cn(
        "skeleton-shimmer bg-white/5",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded",
        variant === "default" && "rounded-lg",
        className
      )}
      style={{ height: heightStyle, width: widthStyle }}
      aria-hidden="true"
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonLoader height={24} width={180} />
          <SkeletonLoader height={16} width={120} />
        </div>
        <div className="text-right space-y-1">
          <SkeletonLoader height={28} width={100} />
          <SkeletonLoader height={12} width={60} />
        </div>
      </div>
      <div className="flex items-center gap-4 py-4 border-t border-white/10">
        <SkeletonLoader height={40} width={60} />
        <div className="flex-1">
          <SkeletonLoader height={2} width="100%" />
        </div>
        <SkeletonLoader height={40} width={60} />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
      <SkeletonLoader height="100%" width="100%" className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <SkeletonLoader variant="circle" height={40} width={40} />
          <SkeletonLoader height={12} width={80} />
        </div>
      </div>
    </div>
  );
}
