import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { PanelShell } from "@/components/panel/PanelShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion || !sesion.dueno) redirect("/ingresar");

  return <PanelShell dueno={sesion.dueno}>{children}</PanelShell>;
}
