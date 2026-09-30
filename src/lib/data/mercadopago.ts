import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function sedeTieneMercadoPago(sedeId: string): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("mi_sede_tiene_mp", { p_sede_id: sedeId });
  return Boolean(data);
}
