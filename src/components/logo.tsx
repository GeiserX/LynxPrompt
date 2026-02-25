import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({ href = "/", className = "", showText = true }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/lynxprompt.png"
        alt="LynxPrompt"
        width={42}
        height={42}
        className="h-10 w-auto"
        priority
        unoptimized
      />
      {showText && (
        <span className="text-xl font-bold tracking-tight">
          <span className="text-foreground">Lynx</span>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Prompt</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
