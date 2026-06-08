import { environment } from '../../../environments/environment';

/**
 * Logger ligero para los services del módulo docente.
 * Se basa en console.* pero envuelto en un tag uniforme para grep en consola.
 * En producción se silencia (nunca imprime ni vuelca objetos error completos).
 *
 * Uso:
 *   const log = createLogger('pregunta');
 *   log.info('listar', { profesorId });
 *   log.error('listar', err);
 */
export interface ScopedLogger {
  info: (op: string, data?: any) => void;
  warn: (op: string, data?: any) => void;
  error: (op: string, err: any) => void;
}

export function createLogger(scope: string): ScopedLogger {
  const tag = `[fe:${scope}]`;
  return {
    info: (op: string, data?: any) => {
      if (environment.production) return;
      if (data !== undefined) console.log(tag, op, data);
      else console.log(tag, op);
    },
    warn: (op: string, data?: any) => {
      if (environment.production) return;
      if (data !== undefined) console.warn(tag, op, data);
      else console.warn(tag, op);
    },
    error: (op: string, err: any) => {
      if (environment.production) return;
      // Nunca volcamos el objeto error completo (puede llevar URLs/headers);
      // solo el mensaje, y únicamente fuera de producción.
      console.error(tag, op, err?.message || err);
    },
  };
}
