# Impress — Contour Cut: zoom y pan de vista habilitados

**Corrección del paquete anterior** `Impress-Shopify-Stickers-Contour-Fijo-Zoom-Pan.zip`.

## Instalar

Este ZIP contiene únicamente los siguientes archivos del tema para reemplazar:

1. `assets/impress-sticker-editor.js`
2. `sections/impress-sticker-configurator.liquid`

En Shopify Admin → Tienda online → Temas → Editar código, reemplaza cada archivo en la ruta correspondiente. No subas este ZIP como tema completo. No requiere cambios en productos, metafields, precios o variantes.

## Comportamiento

- **Contour Cut:** el arte permanece fijo y centrado. No se puede mover (reposicionar), escalar ni rotar mediante el editor.
- **Contour Cut sí permite navegación de la vista:** rueda del mouse para zoom, 100%–400%, y botón central + arrastrar para desplazar la vista (*pan*). El botón de restablecer vuelve al 100%.
- **Square/Circular:** conservan el arrastre con el botón izquierdo para mover el arte, además del zoom/pan independientes.
- **El zoom y pan no modifican la posición impresa, dimensiones, precio, variante de Shopify ni archivo PNG exportado.**
- Los controles de vista aparecen cuando existe un arte cargado y se está en la pestaña «Editar diseño»; no aparecen en «Vista final».

## Pruebas locales

Probado con Chromium: zoom/pan en Contour Cut, bloqueo de arrastre izquierdo, escala y rotación, rango de zoom, prevención del scroll de la página, precio e ID de variante, exportación PNG idéntica antes y después de navegar, y movimiento normal en Square.

No se probó una transacción real de Shopify.
