"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Trash2,
  SquarePen,
  CirclePlus,
  X,
  Image as ImageIcon,
} from "lucide-react";

interface LaminaPVC {
  id?: number;
  Codigo: number | string;
  Descripcion: string;
  ImagenUrl?: string;
}

const estadoInicialForm: LaminaPVC = {
  Codigo: "",
  Descripcion: "",
  ImagenUrl: "",
};

export function CardLaminasPVC() {
  const [listado, setListado] = useState<LaminaPVC[]>([]);
  const [busqueda, setBusqueda] = useState("");

  // Estados para Modal de Formulario (Crear/Editar)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<LaminaPVC | null>(null);
  const [formData, setFormData] = useState<LaminaPVC>(estadoInicialForm);

  // Estado para el visor de imágenes en grande
  const [imagenAmpliada, setImagenAmpliada] = useState<{
    url: string;
    descripcion: string;
  } | null>(null);

  // Estado para el archivo seleccionado y estado de carga
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // 1. Cargar datos desde la tabla "LaminasPvc"
  useEffect(() => {
    async function obtenerDatos() {
      const { data, error } = await supabase.from("LaminasPvc").select("*");
      if (error) {
        console.error("Error al obtener datos de LaminasPvc:", error.message);
      } else if (data) {
        setListado(data as LaminaPVC[]);
      }
    }
    obtenerDatos();
  }, []);

  // Función para subir la imagen a Supabase Storage
  const subirImagenStorage = async (file: File): Promise<string | null> => {
    try {
      setSubiendoImagen(true);
      const fileExt = file.name.split(".").pop();
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `pvc/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Laminas_PVC")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Error al subir archivo a Storage:", uploadError.message);
        alert(`Error al subir imagen al Storage: ${uploadError.message}`);
        return null;
      }

      const { data } = supabase.storage
        .from("Laminas_PVC")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        alert("No se pudo obtener la URL pública de la imagen.");
        return null;
      }

      return data.publicUrl;
    } catch (err) {
      console.error("Error inesperado en subida de archivo:", err);
      return null;
    } finally {
      setSubiendoImagen(false);
    }
  };

  // Abrir modal crear
  const abrirModalCrear = () => {
    setItemEditando(null);
    setFormData(estadoInicialForm);
    setArchivoImagen(null);
    setModalAbierto(true);
  };

  // Abrir modal editar
  const abrirModalEditar = (item: LaminaPVC) => {
    setItemEditando(item);
    setFormData(item);
    setArchivoImagen(null);
    setModalAbierto(true);
  };

  // Guardar registro
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    let urlFinalImagen = formData.ImagenUrl || "";

    if (archivoImagen) {
      const urlSubida = await subirImagenStorage(archivoImagen);
      if (!urlSubida) return;
      urlFinalImagen = urlSubida;
    }

    const payload = {
      Codigo: Number(formData.Codigo),
      Descripcion: formData.Descripcion,
      ImagenUrl: urlFinalImagen,
    };

    if (itemEditando && itemEditando.id) {
      const { error } = await supabase
        .from("LaminasPvc")
        .update(payload)
        .eq("id", itemEditando.id);

      if (error) {
        console.error("Error al actualizar:", error.message);
        alert(`Error al actualizar en la base de datos: ${error.message}`);
      } else {
        setListado((prev) =>
          prev.map((i) =>
            i.id === itemEditando.id ? { ...payload, id: itemEditando.id } : i,
          ),
        );
        setModalAbierto(false);
      }
    } else {
      const { data, error } = await supabase
        .from("LaminasPvc")
        .insert([payload])
        .select();

      if (error) {
        console.error("Error al insertar:", error.message);
        alert(`Error al guardar en la base de datos: ${error.message}`);
      } else if (data) {
        setListado((prev) => [...prev, data[0] as LaminaPVC]);
        setModalAbierto(false);
      }
    }
  };

  // Eliminar registro
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta lámina de PVC?"))
      return;

    const { error } = await supabase.from("LaminasPvc").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error.message);
    } else {
      setListado((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Búsqueda local por Código o Descripción
  const datosFiltrados = listado.filter((item) => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;
    return (
      String(item.Codigo ?? "")
        .toLowerCase()
        .includes(termino) ||
      String(item.Descripcion ?? "")
        .toLowerCase()
        .includes(termino)
    );
  });

  return (
    <div className="w-[90%] md:w-2/3 h-auto m-6 bg-white shadow-lg rounded-lg p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-wide">
          Láminas PVC
        </h1>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <CirclePlus size={18} />
          <span>Agregar Lámina PVC</span>
        </button>
      </div>

      {/* Campo Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla con miniaturas clickeables */}
      <div className="overflow-x-auto rounded border border-gray-200 max-h-96 overflow-y-auto">
        <table className="min-w-full border-collapse text-center text-[12px] md:text-[14px]">
          <thead className="bg-blue-100 text-blue-900 sticky top-0">
            <tr>
              <th className="p-2 border">Imagen</th>
              <th className="p-2 border">Código</th>
              <th className="p-2 border">Descripción</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosFiltrados.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border w-16">
                  {item.ImagenUrl ? (
                    <img
                      src={item.ImagenUrl}
                      alt={item.Descripcion}
                      className="w-12 h-12 object-cover rounded mx-auto border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setImagenAmpliada({
                          url: item.ImagenUrl!,
                          descripcion: item.Descripcion,
                        })
                      }
                      title="Haz clic para ampliar imagen"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mx-auto text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </td>
                <td className="p-2 border">{item.Codigo}</td>
                <td className="p-2 border text-left">{item.Descripcion}</td>
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

      {/* Modal Visor de Imagen Ampliada */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-4 relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
              title="Cerrar vista"
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-3 pr-8 self-start">
              {imagenAmpliada.descripcion}
            </h3>

            {/* Contenedor de la imagen ampliada */}
            <div className="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-md bg-gray-50 border">
              <img
                src={imagenAmpliada.url}
                alt={imagenAmpliada.descripcion}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            {/* Botón inferior de cerrar */}
            <button
              onClick={() => setImagenAmpliada(null)}
              className="mt-4 px-5 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
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
              {itemEditando ? "Editar Lámina PVC" : "Nueva Lámina PVC"}
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

              {/* Input para la imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivoImagen(e.target.files[0]);
                    }
                  }}
                  className="w-full text-sm text-gray-500 border border-gray-300 rounded p-1"
                />
                {formData.ImagenUrl && !archivoImagen && (
                  <p className="text-xs text-gray-500 mt-1">
                    Imagen actual guardada. Si seleccionas otra, se reemplazará.
                  </p>
                )}
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
                  disabled={subiendoImagen}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-blue-300"
                >
                  {subiendoImagen
                    ? "Subiendo..."
                    : itemEditando
                      ? "Actualizar"
                      : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardLaminasPVC;
