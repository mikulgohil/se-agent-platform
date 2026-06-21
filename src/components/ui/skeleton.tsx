import { cn } from "@/lib/utils";

/** Content-shaped placeholder. Use instead of spinners while data loads. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden />;
}
