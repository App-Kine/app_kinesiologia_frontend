/**
 * Orden de los tests/aplicaciones dentro de un curso (pedido cliente 2026-06).
 *
 * Criterio HÍBRIDO:
 *   1. `orden` manual del profesor (1..N) primero. Las que no tienen orden
 *      (NULL/undefined) van al final.
 *   2. Como desempate (y cuando nadie reordenó a mano), orden NATURAL por
 *      nombre: reconoce los números, así "Nivel 1, 2, 3 … 10" quedan en su
 *      orden correcto (no "1, 10, 2").
 *
 * Lo usan tanto el panel del estudiante como el del profesor para que ambos
 * vean exactamente la misma secuencia.
 */
export interface AplicacionOrdenable {
  orden?: number | null;
  test_nombre?: string | null;
}

const SIN_ORDEN = Number.MAX_SAFE_INTEGER;

export function compararAplicaciones(a: AplicacionOrdenable, b: AplicacionOrdenable): number {
  const oa = a.orden == null ? SIN_ORDEN : a.orden;
  const ob = b.orden == null ? SIN_ORDEN : b.orden;
  if (oa !== ob) return oa - ob;
  return (a.test_nombre || '').localeCompare(b.test_nombre || '', 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

/** Devuelve una copia ordenada (no muta el arreglo original). */
export function ordenarAplicaciones<T extends AplicacionOrdenable>(arr: T[]): T[] {
  return [...arr].sort(compararAplicaciones);
}
