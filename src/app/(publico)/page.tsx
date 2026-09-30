import { Hero } from "@/components/site/Hero";
import { CatalogoSedes } from "@/components/site/CatalogoSedes";
import { BolsaPartidos } from "@/components/site/BolsaPartidos";

export default async function Inicio({ searchParams }: { searchParams: Promise<{ zona?: string }> }) {
  const { zona } = await searchParams;
  return (
    <>
      <Hero />
      <CatalogoSedes zona={zona} />
      <BolsaPartidos limite={6} />
    </>
  );
}
