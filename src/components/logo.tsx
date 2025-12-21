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
      width={187}
      height={40}
      className={`h-10 w-auto ${className}`}
      priority
      unoptimized
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

