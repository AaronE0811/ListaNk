"use client";
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Header from "./components/header";
import CardCeramica from "./components/tablas";
import CardLaminas from "./components/tablasLaminas";
import CardLaminasPVC from "./components/tablasPVC";
import { CardVigas } from "./components/vigas";
import { Analytics } from "@vercel/analytics/next";

export default function Home() {
  useEffect(() => {
    async function probarConexion() {
      const { data, error } = await supabase.from("ceramica").select("*");
      if (error) {
        console.log("error al conectar bd", error);
      } else {
        console.log("conexion exitosa", data);
      }
    }
    probarConexion();
  }, []);
  return (
    <main className="min-h-screen font-light text-[14px] text-center  flex flex-col items-center bg-white w-full">
      <Header />
      <CardCeramica />
      <CardLaminas />
      <CardLaminasPVC />
      <CardVigas />
      <Analytics />
    </main>
  );
}
