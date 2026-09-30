import { BolsaPartidos } from "@/components/site/BolsaPartidos";
import { PartidosRecomendados } from "@/components/site/PartidosRecomendados";

export const metadata = { title: "Partidos abiertos" };

export default function PartidosPage() {
  return (
    <div className="pt-10">
      <PartidosRecomendados />
      <BolsaPartidos titulo="Todos los partidos abiertos" />
    </div>
  );
}
