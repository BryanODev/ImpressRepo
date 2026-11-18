# Impress — Porcentaje de ahorro para stickers

Este ZIP contiene **solo tres archivos para reemplazar** en el tema existente. No es un tema completo:

- `sections/impress-sticker-configurator.liquid`
- `assets/impress-sticker-configurator.js`
- `assets/impress-sticker-configurator.css`

## 1. Instalar

En **Tienda online → Temas → Editar código**, reemplaza los tres archivos en sus carpetas correspondientes. Usa una copia del tema si quieres conservar un punto de retorno.

No cambia el mapa de variantes por índice, los precios, las opciones de laminación, el editor de arte ni el carrito.

## 2. Crear el metafield una sola vez

En **Configuración → Metafields and metaobjects → Variants → Add definition**:

| Campo | Valor |
| --- | --- |
| Nombre | Impress Savings Percentage |
| Namespace and key | `custom.impress_savings` |
| Tipo | **Number → Integer** (un solo valor, no lista) |
| Storefront API access | Puedes dejarlo activado |

Guarda la definición. **Debe ser de Variants**, no de Products.

## 3. Establecer un porcentaje

En **Productos → Stickers en Vinil Waterproof → Variantes**, abre una variante específica. Al final, bajo los metafields de variante, establece `Impress Savings Percentage`, por ejemplo `35` (no escribas el signo `%`). Guarda.

Cada combinación de **Forma + Acabado + Tamaño/Cantidad** tiene su propia variante y, por lo tanto, su propio valor opcional. Si Gloss y Matte deben mostrar el mismo porcentaje, asígnalo en ambos. Puedes dejar valores vacíos si no quieres mostrar el distintivo.

## 4. Resultado

- Debajo de **Cantidad**, las opciones pueden aparecer como `500 · Ahorra 35%`.
- Junto a la etiqueta **Cantidad**, un distintivo verde muestra `Ahorra 35%` para la variante seleccionada.
- Si el valor está vacío, es 0 o está fuera del rango 1–100, no se muestra.
- Al cambiar tamaño, forma, acabado o cantidad, se toma el porcentaje **de la variante real seleccionada en Shopify**.
- El distintivo es **solo informativo**: **NO aplica descuentos, NO altera el precio y NO cambia el total del carrito**.

### Importante sobre la publicidad de ahorros

No muestres un porcentaje como "Ahorras" si no está respaldado por una comparación real de precio por sticker. Para ahorro por volumen, una base habitual es el costo unitario de la menor cantidad disponible de la misma forma, tamaño y acabado:

`% ahorro = 100 × (1 − (precio_paquete / cantidad) / precio_unitario_base)`.

Esta implementación permite que tú escribas el porcentaje, pero no verifica que sea matemáticamente correcto. Puedes usar valores enteros redondeados.

## 5. Pruebas recomendadas

1. Abre stickers y selecciona una variante con `35` en el metafield: debe decir `Ahorra 35%`.
2. Prueba una variante sin valor: la etiqueta debe desaparecer.
3. Cambia entre Circular, Square y Contour Cut, y entre Gloss / Matte: deben mostrarse los valores de cada variante.
4. Comprueba que la identificación de variante, el precio, el laminado y el carrito sigan sin cambios.

Se ejecutó una prueba local en Chromium de selección y cambios de variante. El render de Shopify con metafields reales debe probarse en tu tienda de desarrollo.
