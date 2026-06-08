/**
 * Logger ligero para los services del módulo docente.
 * Se basa en console.* pero envuelto en un tag uniforme para grep en consola.
 *
 * Uso:
 *   const log = createLogger('pregunta');
 *   log.info('listar', { profesorId });
 *   log.error('listar', err);
 */
import { environment } from '../../../../environments/environment';

export interface ScopedLogger {
  info: (op: string, data?: any) => void;
  warn: (op: string, data?: any) => void;
  error: (op: string, err: any) => void;
}

export function createLogger(scope: string): ScopedLogger {
  const tag = `[fe:${scope}]`;
  // En producción silenciamos los logs: pueden contener payloads/PII y no
  // queremos exponerlos en la consola del navegador.
  if (environment.production) {
    return { info: () => {}, warn: () => {}, error: () => {} };
  }
  return {
    info: (op: string, data?: any) => {
      if (data !== undefined) console.log(tag, op, data);
      else console.log(tag, op);
    },
    warn: (op: string, data?: any) => {
      if (data !== undefined) console.warn(tag, op, data);
      else console.warn(tag, op);
    },
    error: (op: string, err: any) => {
      console.error(tag, op, err?.message || err, err);
    },
  };
}
