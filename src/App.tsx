import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Tarea, Columna, EstadoTarea, PrioridadTarea } from './types';
import { TaskCard } from './components/TaskCard';
import { KanbanSquare, Plus, Search, Filter } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://devspace-backend-fau5.onrender.com/api/tasks';

export default function App() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('Todas');
  
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaPrio, setNuevaPrio] = useState<PrioridadTarea>('Media');
  const [nuevosPuntos, setNuevosPuntos] = useState(1);

  const cargarTareas = async () => {
    try {
      const response = await axios.get<Tarea[]>(API_URL);
      const tareasMapeadas = response.data.map((t: any) => ({
        ...t,
        id: t._id
      }));
      setTareas(tareasMapeadas);
    } catch (error) {
      console.error('Error al conectar con la base de datos de DevSpace:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const estadoPrevio = [...tareas];
    const tareasActualizadas = tareas.map(t => {
      if (t.id === draggableId) {
        return { ...t, estado: destination.droppableId as EstadoTarea };
      }
      return t;
    });
    setTareas(tareasActualizadas);

    try {
      await axios.put(`${API_URL}/${draggableId}`, {
        estado: destination.droppableId
      });
    } catch (error) {
      console.error('Error al guardar movimiento en Mongo:', error);
      setTareas(estadoPrevio); 
    }
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;

    try {
      const payload = {
        titulo: nuevoTitulo,
        descripcion: nuevaDesc,
        estado: 'Por Hacer',
        prioridad: nuevaPrio,
        puntosHistoria: nuevosPuntos
      };

      const response = await axios.post(API_URL, payload);
      const nuevaTareaConId = { ...response.data, id: response.data._id };

      setTareas([nuevaTareaConId, ...tareas]);
      
      setNuevoTitulo('');
      setNuevaDesc('');
      setNuevaPrio('Media');
      setNuevosPuntos(1);
      setMostrarForm(false);
    } catch (error) {
      console.error('Error al guardar la nueva tarea en Atlas:', error);
    }
  };

  const handleEliminarTarea = async (id: string) => {
    if (window.confirm('¿Estás segura de que deseas eliminar esta tarea de MongoDB Atlas?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setTareas(tareas.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error al eliminar el registro:', error);
      }
    }
  };

  const handleCambiarPrioridad = async (id: string, nuevaPrioridad: PrioridadTarea) => {
    try {
      await axios.put(`${API_URL}/${id}`, { prioridad: nuevaPrioridad });
      setTareas(tareas.map(t => t.id === id ? { ...t, prioridad: nuevaPrioridad } : t));
    } catch (error) {
      console.error('Error al actualizar prioridad en Mongo:', error);
    }
  };

  const tareasFiltradas = tareas.filter(t => {
    const cumpleBusqueda = t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                          (t.codigo && t.codigo.toLowerCase().includes(busqueda.toLowerCase()));
    const cumplePrioridad = filtroPrioridad === 'Todas' || t.prioridad === filtroPrioridad;
    return cumpleBusqueda && cumplePrioridad;
  });

  const estados: EstadoTarea[] = ['Por Hacer', 'En Progreso', 'En QA', 'Terminado'];
  const columnas: Columna[] = estados.map(estado => ({
    id: estado,
    titulo: estado,
    tareas: tareasFiltradas.filter(t => t.estado === estado)
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar Superior */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">DevSpace</h1>
            <p className="text-xs text-slate-400 font-medium">Gestión Ágil / Persistencia Atlas Conectada</p>
          </div>
        </div>
        
        <button 
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Crear Tarea
        </button>
      </header>

      {/* Barra de Filtros */}
      <section className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto max-w-md flex-1">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por código o título..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Prioridad:</span>
          <select 
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="Todas">Todas</option>
            <option value="Critica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>
      </section>

      {/* Formulario de Registro */}
      {mostrarForm && (
        <div className="bg-white border-b border-slate-200 p-6 shadow-inner">
          <form onSubmit={handleCrearTarea} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Título de la Tarea</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Desarrollar endpoint de registro"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Prioridad</label>
              <select 
                value={nuevaPrio}
                onChange={(e) => setNuevaPrio(e.target.value as PrioridadTarea)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Story Points</label>
              <input 
                type="number" 
                min="1" 
                max="21"
                value={nuevosPuntos}
                onChange={(e) => setNuevosPuntos(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Descripción</label>
              <input 
                type="text" 
                placeholder="Añade detalles breves sobre los entregables..."
                value={nuevaDesc}
                onChange={(e) => setNuevaDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm">
                Guardar
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contenedor Principal del Tablero Kanban */}
      <main className="flex-1 p-6 overflow-x-auto">
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Sincronizando con base de datos en la nube...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full min-w-[1000px] items-start">
              {columnas.map((columna) => (
                <div key={columna.id} className="w-1/4 bg-slate-100 rounded-xl p-4 flex flex-col max-h-[75vh] border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{columna.titulo}</h3>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {columna.tareas.length}
                    </span>
                  </div>

                  <Droppable droppableId={columna.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto rounded-lg transition-colors p-1 max-h-[65vh] ${
                          snapshot.isDraggingOver ? 'bg-slate-200/60' : ''
                        }`}
                        style={{ minHeight: '150px' }}
                      >
                        {columna.tareas.map((tarea, index) => (
                          <TaskCard 
                            key={tarea.id} 
                            tarea={tarea} 
                            index={index} 
                            onEliminar={handleEliminarTarea}
                            onCambiarPrioridad={handleCambiarPrioridad}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}