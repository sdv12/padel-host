import { categoriaPorId } from "@/lib/categorias";

export function CategoryBadge({ id, size = "md" }: { id: string | null; size?: "sm" | "md" }) {
  const cat = categoriaPorId(id);
  if (!cat) return null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${pad}`}
      style={{
        background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
        color: cat.color,
        border: `1px solid color-mix(in srgb, ${cat.color} 33%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
      {cat.nombre}
    </span>
  );
}
