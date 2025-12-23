"use client";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "glass row-span-1 rounded-3xl group/bento hover:shadow-2xl hover:shadow-neon-blue/20 transition duration-300 shadow-none p-6 justify-between flex flex-col space-y-4",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="mb-2">
          {icon}
        </div>
        <div className="font-sans font-bold text-white text-xl mb-2">
          {title}
        </div>
        <div className="font-sans font-normal text-gray-400 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
