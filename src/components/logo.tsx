import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = "/", className = "" }: LogoProps) {
  const logoContent = (
    <Image
      src="/logo.png"
      alt="LynxPrompt"
      width={160}
      height={32}
      className={`h-8 w-auto ${className}`}
      priority
    />
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
