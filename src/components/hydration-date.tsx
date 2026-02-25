"use client";

interface HydrationDateProps {
  date: string | Date;
  options?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
}

const defaultOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export function HydrationDate({
  date,
  options = defaultOptions,
  locale = "en-US",
  className,
}: HydrationDateProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <span className={className} suppressHydrationWarning>
      {d.toLocaleDateString(locale, options)}
    </span>
  );
}

export function RelativeTime({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let text: string;
  if (diffMins < 1) text = "just now";
  else if (diffMins < 60) text = `${diffMins}m ago`;
  else if (diffHours < 24) text = `${diffHours}h ago`;
  else if (diffDays < 7) text = `${diffDays}d ago`;
  else text = d.toLocaleDateString("en-US", defaultOptions);

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
