import { cn } from "@/lib/utils";

interface VegNonVegProps {
  isVeg: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function VegNonVeg({ isVeg, size = "md", className }: VegNonVegProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const dotSizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] border-2",
        sizeClasses[size],
        isVeg ? "border-green-600" : "border-[#8B4513]",
        className
      )}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <div
        className={cn(
          "rounded-full",
          dotSizeClasses[size],
          isVeg ? "bg-green-600" : "bg-[#8B4513]"
        )}
      />
    </div>
  );
}

export { VegNonVeg };
