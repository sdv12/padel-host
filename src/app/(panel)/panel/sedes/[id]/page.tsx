import { notFound, redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { obtenerSedePorId } from "@/lib/data/sedes";
import { obtenerCanchasDeSede } from "@/lib/data/canchas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormSede } from "@/components/panel/FormSede";
import { CanchasManager } from "@/components/panel/CanchasManager";
import { HorarioYFeriados } from "@/components/panel/HorarioYFeriados";
import { GaleriaFotosSede } from "@/components/panel/GaleriaFotosSede";
import { PoliticaSedeForm } from "@/components/panel/PoliticaSedeForm";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { Aviso } from "@/components/ui/Aviso";
import { sedeTieneMercadoPago } from "@/lib/data/mercadopago";
import type { DiaCerrado, HorarioSemanal, SedeFoto } from "@/lib/supabase/database.types";

export default async function EditarSedePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  if (id === "nueva") {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Nueva sede</h1>
        <FormSede sede={null} duenoId={sesion.dueno.id} />
      </div>
    );
  }

  const sede = await obtenerSedePorId(id);
  if (!sede) notFound();
  if (sede.dueno_id !== sesion.dueno.id) return <p className="text-muted">Esta sede no te pertenece.</p>;

  const canchas = await obtenerCanchasDeSede(sede.id);
  const supabase = await crearClienteServidor();
  const [{ data: horarios }, { data: diasCerrados }, { data: fotos }, mpConectado] = await Promise.all([
    supabase.from("horario_semanal").select("*").eq("sede_id", sede.id).returns<HorarioSemanal[]>(),
    supabase.from("dias_cerrados").select("*").eq("sede_id", sede.id).order("fecha").returns<DiaCerrado[]>(),
    supabase.from("sede_fotos").select("*").eq("sede_id", sede.id).order("orden").returns<SedeFoto[]>(),
    sedeTieneMercadoPago(sede.id),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{sede.nombre}</h1>
        <EstadoBadge estado={sede.estado} />
      </div>
      {sede.estado === "pendiente" && (
        <div className="mt-3">
          <Aviso tono="warn">Esta sede está pendiente de aprobación: no aparece en el catálogo todavía.</Aviso>
        </div>
      )}
      {sede.estado_suscripcion === "vencida" && (
        <div className="mt-3">
          <Aviso tono="warn">La suscripción de esta sede está vencida y no aparece en el directorio. Renovala para volver a publicarla.</Aviso>
        </div>
      )}

      <FormSede sede={sede} duenoId={sesion.dueno.id} />

      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-ink">Fotos</h2>
        <p className="mt-1 text-sm text-muted">Se muestran en el orden en que las subís.</p>
        <div className="mt-4">
          <GaleriaFotosSede sedeId={sede.id} fotosIniciales={fotos ?? []} />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-ink">Canchas</h2>
        <p className="mt-1 text-sm text-muted">Agregá o editá las canchas de esta sede y sus precios.</p>
        <CanchasManager sedeId={sede.id} canchasIniciales={canchas} />
      </div>

      <div className="mt-12">
        <HorarioYFeriados sedeId={sede.id} horarios={horarios ?? []} diasCerrados={diasCerrados ?? []} />
      </div>

      <div className="mt-12">
        <PoliticaSedeForm sede={sede} mpConectado={mpConectado} />
      </div>
    </div>
  );
}
