import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import type { Tarea, PrioridadTarea } from '../types';
import { AlertCircle, ArrowUp, ArrowDown, Minus, Trash2 } from 'lucide-react';

interface TaskCardProps {
  tarea: Tarea;
  index: number;
  onEliminar: (id: string) => void;
  onCambiarPrioridad: (id: string, prioridad: PrioridadTarea) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ tarea, index, onEliminar, onCambiarPrioridad }) => {
  const getPriorityIcon = (prio: string) => {
    switch (prio) {
      case 'Critica': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Alta': return <ArrowUp className="w-4 h-4 text-orange-500" />;
      case 'Media': return <Minus className="w-4 h-4 text-blue-500" />;
      default: return <ArrowDown className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Draggable draggableId={tarea.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 mb-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all select-none group relative ${
            snapshot.isDragging ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/10' : ''
          }`}
        >
          {/* Botón de Eliminar (Aparece al hacer hover sobre la tarjeta) */}
          <button
            onClick={() => onEliminar(tarea.id)}
            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-50"
            title="Eliminar tarea"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            {tarea.codigo}
          </span>
          
          <h4 className="mt-2 text-sm font-semibold text-slate-800 pr-6">
            {tarea.titulo}
          </h4>
          
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {tarea.descripcion || 'Sin descripción.'}
          </p>
          
          <div className="mt-4 flex items-center justify-between">
            {/* Cambiar Prioridad Directamente (UPDATE) */}
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              {getPriorityIcon(tarea.prioridad)}
              <select
                value={tarea.prioridad}
                onChange={(e) => onCambiarPrioridad(tarea.id, e.target.value as PrioridadTarea)}
                className="text-[10px] font-medium text-slate-600 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>
            
            {tarea.puntosHistoria > 0 && (
              <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full">
                {tarea.puntosHistoria}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};