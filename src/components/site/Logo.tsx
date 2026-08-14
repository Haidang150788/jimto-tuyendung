import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="Jim Tồ"
      width={2441}
      height={1041}
      priority
      className={className ?? "h-11 w-auto"}
    />
  );
}
