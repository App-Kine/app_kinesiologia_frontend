# Atribución del modelo 3D

## `torso.glb`

- **Nombre original**: Torso sculpt w arms
- **Autor**: ver perfil en Sketchfab
- **Fuente**: https://sketchfab.com/3d-models/torso-sculpt-w-arms-ae14020046d64958afce52d935b93b7a
- **Licencia**: Creative Commons Attribution (CC BY) — requiere atribución al autor original cuando se use o se distribuya.

## Limitaciones de este modelo

Este es un **sculpt artístico**, no un modelo anatómico médico. Tiene:

- 13 sub-meshes (`Object_0` a `Object_12`) sin separación por sistemas (piel/huesos/pulmones).
- 1 solo material — todo el modelo se ve uniforme.
- Bounding box no centrada en origen: X ∈ [0, 20], Y ∈ [0, 5], Z ∈ [0, 10].

Por estas razones, el sistema de capas de la pantalla de auscultación muestra
el aviso "El modelo actual no tiene capas anatómicas separadas". La UI funciona
pero el toggle de piel/huesos/pulmones no oculta nada porque el modelo no tiene
esos meshes diferenciados.

## Cómo reemplazarlo por un modelo anatómico real

Para que el sistema de capas funcione, el GLB tiene que tener meshes con
nombres que matcheen alguna de estas keywords (case-insensitive):

| Capa | Keywords reconocidas |
|---|---|
| Piel | `skin`, `body`, `piel`, `torso`, `cuerpo` |
| Huesos | `skeleton`, `bone`, `rib`, `hueso`, `costilla`, `sternum`, `esternon` |
| Pulmones | `lung`, `pulmon`, `respiratory`, `respiratorio` |

Las keywords están definidas en
`src/app/project/pages/estudiante-auscultacion/estudiante-auscultacion.page.ts`
(constante `KEYWORDS`). Editá ahí si tu modelo final usa otros nombres.

Para sumar/cambiar el modelo:

1. Poner el nuevo .glb en esta carpeta (ej. `torso.glb`).
2. Actualizar `ATTRIBUTION.md` (este archivo) con su origen y licencia.
3. En `estudiante-auscultacion.page.ts`, ajustar `modelUrl` si cambia el nombre del archivo.
4. Recalibrar las posiciones de los hotspots en
   `src/app/project/data/puntos-auscultacion.data.ts` usando
   https://modelviewer.dev/editor/
