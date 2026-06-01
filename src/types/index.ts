export type EstadoTarea = 'Por Hacer' | 'En Progreso' | 'En QA' | 'Terminado';
export type PrioridadTarea = 'Baja' | 'Media' | 'Alta' | 'Critica';

export interface Tarea {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  puntosHistoria: number;
  asignadoA?: string;
}

export interface Columna {
  id: EstadoTarea;
  titulo: string;
  tareas: Tarea[];
}