"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trash2, SquarePen, CirclePlus, X } from "lucide-react";

// Interfaz para la entidad Laminas
interface Laminas {
  id?: number;
  Codigo: number | string;
  Descripcion: string;
  CantidadPorTarima: number;
}

const estadoInicialForm: Laminas = {
  Codigo: "",
  Descripcion: "",
  CantidadPorTarima: 0,
};

export function CardLaminas() {
  const [listadoLaminas, setListadoLaminas] = useState<Laminas[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Estados para Modal y Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<Laminas | null>(null);
  const [formData, setFormData] = useState<Laminas>(estadoInicialForm);

  // 1. Cargar datos iniciales desde la tabla "Laminas"
  useEffect(() => {
    async function obtenerDatosLaminas() {
      const { data, error } = await supabase.from("Laminas").select("*");
      if (error) {
        console.error("Error al obtener datos de Laminas:", error);
      } else if (data) {
        setListadoLaminas(data as Laminas[]);
      }
    }
    obtenerDatosLaminas();
  }, []);

  // 2. Abrir Modal para Crear
  const abrirModalCrear = () => {
    setItemEditando(null);
    setFormData(estadoInicialForm);
    setModalAbierto(true);
  };

  // 3. Abrir Modal para Editar
  const abrirModalEditar = (item: Laminas) => {
    setItemEditando(item);
    setFormData(item);
    setModalAbierto(true);
  };

  // 4. Guardar (Crear o Actualizar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemEditando && itemEditando.id) {
      // ACTUALIZAR (UPDATE)
      const { error } = await supabase
        .from("Laminas")
        .update({
          Codigo: Number(formData.Codigo),
          Descripcion: formData.Descripcion,
          CantidadPorTarima: Number(formData.CantidadPorTarima),
        })
        .eq("id", itemEditando.id);

      if (error) {
        console.error("Error al actualizar la lámina:", error);
      } else {
        setListadoLaminas((prev) =>
          prev.map((i) =>
            i.id === itemEditando.id ? { ...formData, id: itemEditando.id } : i,
          ),
        );
        setModalAbierto(false);
      }
    } else {
      // INSERTAR (CREATE)
      const { data, error } = await supabase
        .from("Laminas")
        .insert([
          {
            Codigo: Number(formData.Codigo),
            Descripcion: formData.Descripcion,
            CantidadPorTarima: Number(formData.CantidadPorTarima),
          },
        ])
        .select();

      if (error) {
        console.error("Error al insertar la lámina:", error);
      } else if (data) {
        setListadoLaminas((prev) => [...prev, data[0] as Laminas]);
        setModalAbierto(false);
      }
    }
  };

  // 5. Eliminar registro
  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar esta lámina?",
    );
    if (!confirmacion) return;

    const { error } = await supabase.from("Laminas").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar la lámina:", error);
    } else {
      setListadoLaminas((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Filtrado de búsqueda local
  const datosFiltrados = listadoLaminas.filter((item) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;

    const codigoTexto = String(item.Codigo ?? "").toLowerCase();
    const descripcionTexto = String(item.Descripcion ?? "").toLowerCase();

    return codigoTexto.includes(termino) || descripcionTexto.includes(termino);
  });

  return (
    <div className="w-[90%] md:w-2/3 h-auto m-6 bg-white shadow-lg rounded-lg p-6">
      {/* Encabezado y Botón de Acción */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-wide">
          Láminas
        </h1>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <CirclePlus size={18} />
          <span>Agregar Lámina</span>
        </button>
      </div>

      {/* Campo de Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla de Láminas */}
      <div className="overflow-x-auto rounded border border-gray-200 max-h-96 overflow-y-auto">
        <table className="min-w-full border-collapse text-center text-[12px] md:text-[14px]">
          <thead className="bg-blue-100 text-blue-900 sticky top-0">
            <tr>
              <th className="p-2 border">Código</th>
              <th className="p-2 border">Descripción</th>
              <th className="p-2 border">Cantidad / Tarima</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosFiltrados.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border">{item.Codigo}</td>
                <td className="p-2 border text-left">{item.Descripcion}</td>
                <td className="p-2 border">{item.CantidadPorTarima}</td>
                <td className="p-2 border">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      title="Editar"
                      className="bg-green-500 text-white p-1.5 rounded hover:bg-green-600 transition-colors"
                      onClick={() => abrirModalEditar(item)}
                    >
                      <SquarePen size={16} />
                    </button>
                    <button
                      title="Eliminar"
                      className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear y Editar */}
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
              {itemEditando ? "Editar Lámina" : "Nueva Lámina"}
            </h2>

            <form onSubmit={handleGuardar} className="flex flex-col gap-3">
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
                  className="w-full border border-gray-300 rounded p-2 text-sm"
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
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad por Tarima
                </label>
                <input
                  type="number"
                  required
                  value={formData.CantidadPorTarima}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      CantidadPorTarima: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm"
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

export default CardLaminas;
