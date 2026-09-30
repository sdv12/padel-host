import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink">
      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-primary text-on-primary">?</span>
      ¿Quién Sacó?
    </Link>
  );
}
