# IMPRESS — Roll-Up y X-Stand / Shopify

Nueva implementación para tu tema Shopify actual. **Un solo Liquid reutilizable para ambos productos**, con sus propios tamaños fijos, y dos plantillas de producto independientes. No se reemplaza ningún configurador existente.

## Archivos incluidos

- `sections/impress-stand-configurator.liquid` — sección compartida para los dos soportes.
- `assets/impress-stand-configurator.css` — ajustes visuales sobre el CSS de Banners existente.
- `assets/impress-stand-configurator.js` — opciones Shopify, precios, cantidad y formulario.
- `assets/impress-stand-editor.js` — editor de impresión y visualización ilustrativa del soporte; reutiliza `impress-editor-core.js`, `impress-artwork-source.js`, `impress-artwork-preview.js`, `impress-artwork-quality.js` y las herramientas UX existentes.
- `templates/product.impress-roll-up.json` — plantilla Roll-Up.
- `templates/product.impress-x-stand.json` — plantilla X-Stand.

Sube los archivos a las mismas rutas en tu **tema de desarrollo**; no subas el ZIP de reemplazos como un tema entero.

## Crear/configurar los productos en Shopify

Debes crear **dos productos Shopify reales**, o asignar las plantillas a productos ya creados. El ZIP no crea productos ni precios, y **no pone precios ficticios**.

**Roll-Up**: impresión de **33 pulgadas de ancho × 72 pulgadas de alto** (fijo).

**X-Stand**: impresión de **23.5 pulgadas de ancho × 60 pulgadas de alto** (fijo).

Para cada producto, en Shopify > Products > Variants, configura:

- Nombre de opción: **Base**
- Valor 1: **Con base**
- Valor 2: **Sin base**
- Define precio y disponibilidad reales para **cada variante**. La cantidad es la cantidad estándar del carrito, **no** otra dimensión de variante.

Opcionalmente, si ya tienes una dimensión de tamaño, puedes conservar un segundo campo de variante **Tamaño**, con **el mismo valor fijo en ambas variantes**: `33 x 72 in` en Roll-Up, o `23.5 x 60 in` en X-Stand. El script acepta el orden de opciones Base/Tamaño o Tamaño/Base. No uses un tamaño distinto o un precio inventado.

**Importante:** Para asegurar que nadie compre una combinación inexistente, el configurador deshabilita Añadir al carrito si no encuentra exactamente dos variantes válidas, una Con base y otra Sin base, o si la variante elegida está agotada. Si falta la configuración, se muestra un mensaje. El total se calcula con el precio real de Shopify multiplicado por la cantidad.

### Asignar las plantillas

1. Shopify Admin → **Products** → Roll-Up → **Theme template** → `impress-roll-up` → Guardar.
2. Shopify Admin → **Products** → X-Stand → **Theme template** → `impress-x-stand` → Guardar.
3. Comprueba que los productos estén publicados en **Online Store** y que las dos variantes tengan precio/disponibilidad.
4. Comprueba que las entradas «Próximamente» del catálogo enlacen a estos productos cuando estén listos. **Este ZIP no modifica las tarjetas del catálogo ni el navbar.**

## El editor y la visualización

- Ambos usan el editor de Impress con subida de original, PNG de vista editada, DPI estimado, zoom y pan, escalado, rotación del **arte**, deshacer/rehacer y servicios adicionales desde metafields existentes.
- **Editar diseño:** vista de impresión vertical con líneas de corte y guías de montaje que se pueden mostrar u ocultar.
- **Roll-Up:** guía azul a **0.25 pulgadas** desde el borde **superior e inferior**. Esta cifra es una **propuesta visual**, no una especificación confirmada de la máquina; acuerda las medidas de sujeción y el área visible con producción antes de imprimir.
- **X-Stand:** marcadores orientativos para puntos de tensión en las cuatro esquinas; confirmar posición, tipo de ojales y distancia útil con producción.
- **Vista con soporte:** con base muestra una representación gráfica de la estructura (cassette/riel para Roll-Up; varillas y patas para X-Stand). Sin base muestra el material sin herrajes.
- **Girar conjunto:** slider de vista 3D de -55 a +55 grados, y movimiento con mouse/tacto sobre el preview. Esta rotación afecta **al conjunto ilustrativo** y **no gira el arte que se enviará a imprenta**.
- La vista PNG exporta solo el diseño sobre el área de impresión a la proporción de tamaño físico. **No incluye soporte, guías, perspectiva 3D ni herrajes**. Conserva el archivo de origen para producción.

## Pruebas realizadas

Se revisaron los esquemas de las dos plantillas y de la nueva sección frente a los esquemas de tu tema. Las pruebas locales en Chromium a 390 y 1440 px verificaron la selección de variantes, total de Shopify simulado en los casos de prueba (no son precios de la tienda), cantidad, carga PNG, escala, modo final, rotación del conjunto, diferencia con/sin base y bloqueo de carrito ante variantes incorrectas. Se descargaron vistas PNG con proporciones **825 × 1800 px** (Roll-Up) y **705 × 1800 px** (X-Stand); no son archivos finales de producción.

**Pendiente de verificación en tu tienda:** variantes/precios reales, subida de original en Shopify, add-ons y carrito/checkout completos. Prueba ambas opciones en el tema de desarrollo antes de publicar.
