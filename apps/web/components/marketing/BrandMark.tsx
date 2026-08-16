import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-molten font-display text-[15px] font-bold text-white glow-molten">
        T
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight">
          TIJARAH<span className="text-primary">.</span>
        </span>
        <span className="text-[10px] tracking-widest text-molten">تجارة</span>
      </span>
    </Link>
  );
}
