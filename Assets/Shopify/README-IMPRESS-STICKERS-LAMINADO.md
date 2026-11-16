# Impress — Corrección de UI de stickers y laminado

Base: `Shopify.zip` suministrado el 15 de noviembre de 2026.

## Instalación

Reemplaza **estos cuatro archivos** en el editor de código de tu tema Shopify (en los directorios indicados). No subas este ZIP como un tema completo.

- `assets/impress-addons.js`
- `assets/impress-addons.css`
- `snippets/impress-addon-picker.liquid`
- `sections/impress-sticker-configurator.liquid`

Se conservan la configuración central de índices, las variantes, el carrito de servicios y el comportamiento de Artwork Design y banners.

## Cambios

1. Las variantes de precio de laminación son ahora `input type="hidden"` (datos, no casillas visibles). Se eliminan los cuadros que aparecían antes del selector.
2. En stickers, los servicios agrupados por `custom.impress_addon_group` aparecen junto a las opciones de acabado, con dos tarjetas visuales: **Sin Laminado** y **Laminado**. Si agregas otro grupo de finishing en el futuro, se muestra como otro par de tarjetas, sin editar JS.
3. Si existe una variante de acabado válida para tamaño/cantidad, la tarjeta muestra su precio extra de Shopify; si no existe, queda deshabilitada.
4. Un servicio configurado como `2 in` se empareja con un sticker **cuadrado** `2 x 2 in` (también compatible con un diámetro `2 in`). Nunca se iguala `2 in` con `2 x 3 in`, ni se ignoran las unidades de medida.
5. No se modifican precios ni variantes de Shopify, ni el archivo de configuración del producto.

## Atención: la combinación que aparece en tu captura

La captura muestra **2 x 2 in / 250 piezas**, mientras que los precios de laminado que configuramos para 2 pulgadas cubren **200, 500 y 1,000 piezas**. Si tu producto de impresión usa 250, **no hay una variante de laminado del mismo tamaño y paquete**. Por eso el botón sigue deshabilitado aunque el diseño visual esté corregido.

Para ofrecer laminado a 250, configura una variante real de `Finishing Services` con:

- `custom.impress_addon_group`: `Laminado`
- `custom.impress_addon_size`: `2 in` (o `2 x 2 in`)
- `custom.impress_addon_pack`: `250`
- Precio de **ese paquete** en Shopify, definido por tu negocio.

Asigna esa variante al metafield del producto de stickers `custom.impress_addons`. Alternativamente, usa cantidades de paquete iguales a las variantes del servicio **solo si eso coincide con tu catálogo real**. No se inventa un precio ni se carga automáticamente la variante de 200 a un paquete de 250.

El precio base `$0.00` que aparece en la captura proviene de la variante del producto de impresión: también se debe ajustar en Shopify si no es intencional.

## Pruebas locales

- 8 variantes internas de laminado invisibles.
- Un solo grupo de tarjetas visible en el lugar del acabado de stickers.
- `2 x 2 in` + `200` detecta variante de servicio `2 in` + `200`.
- `2 x 2 in` + `250` **no** reutiliza el precio del paquete 200.
- Cuando se selecciona laminado y luego se cambia a una combinación sin precio, se bloquea la compra hasta corregir o deseleccionar el servicio.

El checkout real en Shopify debe verificarse en el tema de desarrollo.
