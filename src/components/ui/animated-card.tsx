import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  hover?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, delay = 0, hover = true, style, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "animate-fade-in opacity-0",
        hover && "card-hover",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
        ...style,
      }}
      {...props}
    />
  )
);
AnimatedCard.displayName = "AnimatedCard";

const AnimatedCardHeader = CardHeader;
const AnimatedCardTitle = CardTitle;
const AnimatedCardDescription = CardDescription;
const AnimatedCardContent = CardContent;
const AnimatedCardFooter = CardFooter;

export {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardDescription,
  AnimatedCardContent,
  AnimatedCardFooter,
};
