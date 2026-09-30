import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { FormPerfilDueno } from "@/components/panel/FormPerfilDueno";

export default async function PanelPerfilPage() {
  const sesion = await obtenerSesion();
  if (!sesion?.dueno) redirect("/ingresar");

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-bold text-ink">Tu perfil</h1>
      <p className="mt-1 text-muted">Estos datos se muestran en tu página pública de dueño.</p>
      <FormPerfilDueno dueno={sesion.dueno} />
    </div>
  );
}
