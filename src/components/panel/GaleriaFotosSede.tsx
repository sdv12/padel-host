"use client";

import { useRef, useState, useTransition } from "react";
import { X, Upload } from "lucide-react";
import { subirFotoSede, borrarFotoSede } from "@/lib/actions/fotos";
import { urlPublicaSede } from "@/lib/storageUrls";
import type { SedeFoto } from "@/lib/supabase/database.types";

export function GaleriaFotosSede({ sedeId, fotosIniciales }: { sedeId: string; fotosIniciales: SedeFoto[] }) {
  const [fotos, setFotos] = useState(fotosIniciales);
  const [error, setError] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function subir(archivo: File) {
    setError("");
    const formData = new FormData();
    formData.set("archivo", archivo);
    iniciarTransicion(async () => {
      const res = await subirFotoSede(sedeId, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      // No tenemos el path exacto sin re-consultar; forzamos un refresh liviano vía location.
      window.location.reload();
    });
  }

  function quitar(foto: SedeFoto) {
    setFotos((prev) => prev.filter((f) => f.id !== foto.id));
    borrarFotoSede(foto.id, foto.path, sedeId);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {fotos.map((f) => (
          <div key={f.id} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPublicaSede(f.path)} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => quitar(f)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-canvas/90 text-ink opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Quitar foto"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={pendiente}
          className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          <Upload size={18} />
          <span className="text-[11px] font-bold">{pendiente ? "Subiendo..." : "Subir foto"}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) subir(archivo);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-xs font-medium text-warn">{error}</p>}
    </div>
  );
}
