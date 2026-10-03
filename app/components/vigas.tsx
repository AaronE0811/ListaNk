"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trash2, SquarePen, CirclePlus, X } from "lucide-react";

// Interface para el modelo de Vigas
interface Viga {
  id?: number; // Clave primaria opcional al crear
  Codigo: number | string;
  Descripcion: string;
}

const estadoInicialForm: Viga = {
  Codigo: "",
  Descripcion: "",
};

export function CardVigas() {
  const [listadoVigas, setListadoVigas] = useState<Viga[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Estados para el Modal y Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<Viga | null>(null);
  const [formData, setFormData] = useState<Viga>(estadoInicialForm);

  // 1. Cargar datos iniciales desde la tabla "vigas"
  useEffect(() => {
    async function obtenerDatosVigas() {
      const { data, error } = await supabase.from("Vigas").select("*");
      if (error) {
        console.error("Error al obtener datos de vigas:", error);
      } else if (data) {
        setListadoVigas(data as Viga[]);
      }
    }
    obtenerDatosVigas();
  }, []);

  // 2. Abrir Modal para Crear
  const abrirModalCrear = () => {
    setItemEditando(null);
    setFormData(estadoInicialForm);
    setModalAbierto(true);
  };

  // 3. Abrir Modal para Editar
  const abrirModalEditar = (item: Viga) => {
    setItemEditando(item);
    setFormData(item);
    setModalAbierto(true);
  };

  // 4. Manejar Guardar (Agregar o Modificar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemEditando && itemEditando.id) {
      // ACTUALIZAR (UPDATE)
      const { error } = await supabase
        .from("Vigas")
        .update({
          Codigo: Number(formData.Codigo),
          Descripcion: formData.Descripcion,
        })
        .eq("id", itemEditando.id);

      if (error) {
        console.error("Error al actualizar viga:", error);
      } else {
        setListadoVigas((prev) =>
          prev.map((i) =>
            i.id === itemEditando.id ? { ...formData, id: itemEditando.id } : i,
          ),
        );
        setModalAbierto(false);
      }
    } else {
      // INSERTAR (CREATE)
      const { data, error } = await supabase
        .from("Vigas")
        .insert([
          {
            Codigo: Number(formData.Codigo),
            Descripcion: formData.Descripcion,
          },
        ])
        .select();

      if (error) {
        console.error("Error al insertar viga:", error);
      } else if (data) {
        setListadoVigas((prev) => [...prev, data[0] as Viga]);
        setModalAbierto(false);
      }
    }
  };

  // 5. Eliminar registro
  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este registro de viga?",
    );
    if (!confirmacion) return;

    const { error } = await supabase.from("vigas").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar viga:", error);
    } else {
      setListadoVigas((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Filtrado de búsqueda
  const datosFiltrados = listadoVigas.filter((item) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;

    const codigoTexto = String(item.Codigo ?? "").toLowerCase();
    const descripcionTexto = String(item.Descripcion ?? "").toLowerCase();

    return codigoTexto.includes(termino) || descripcionTexto.includes(termino);
  });

  return (
    <div className="vigas w-[90%] md:w-2/3 h-auto m-6 bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-wide">
          Vigas
        </h1>
        {/* Botón Principal para Agregar */}
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <CirclePlus size={18} />
          <span>Agregar Viga</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla de vigas */}
      <div className="overflow-x-auto rounded border border-gray-200 max-h-96 overflow-y-auto">
        <table className="min-w-full border-collapse text-center text-[12px] md:text-[14px]">
          <thead className="bg-blue-100 text-blue-900 sticky top-0">
            <tr>
              <th className="p-2 border w-1/4">Código</th>
              <th className="p-2 border w-1/2">Descripción</th>
              <th className="p-2 border w-1/4">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosFiltrados.map((i) => (
              <tr key={i.id ?? i.Codigo} className="hover:bg-gray-50">
                <td className="p-2 border">{i.Codigo}</td>
                <td className="p-2 border text-left">{i.Descripcion}</td>
                <td className="p-2 border">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      title="Editar"
                      className="bg-green-500 text-white p-1.5 rounded hover:bg-green-600 transition-colors"
                      onClick={() => abrirModalEditar(i)}
                    >
                      <SquarePen size={16} />
                    </button>
                    <button
                      title="Eliminar"
                      className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(i.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {datosFiltrados.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No se encontraron registros de vigas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL (Crear / Editar) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {itemEditando ? "Editar Viga" : "Nueva Viga"}
            </h2>

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Código
                </label>
                <input
                  type="number"
                  required
                  value={formData.Codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, Codigo: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <input
                  type="text"
                  required
                  value={formData.Descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, Descripcion: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {itemEditando ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardVigas;
