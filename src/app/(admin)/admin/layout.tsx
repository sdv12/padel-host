import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/data/sesion";
import { AdminShell } from "@/components/panel/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.perfil?.rol !== "admin") redirect("/ingresar");

  return <AdminShell>{children}</AdminShell>;
}
