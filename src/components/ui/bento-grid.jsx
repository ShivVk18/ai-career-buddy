import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className
      )}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded border border-border bg-background p-4 transition-editorial",
        className
      )}>
      {header}
      <div className="transition-editorial group-hover/bento:translate-y-[-2px]">
        {icon}
        <div
          className="mt-2 mb-1 font-clash font-bold uppercase tracking-tight text-foreground">
          {title}
        </div>
        <div
          className="font-general text-xs font-light leading-relaxed text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
};
