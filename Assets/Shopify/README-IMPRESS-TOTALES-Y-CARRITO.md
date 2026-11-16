# Impress Shopify — Totales de productos y conteo de pedidos (15 noviembre 2026)

## Instalar en Shopify

Este ZIP contiene **solo archivos agregados o modificados** sobre el último `Shopify.zip` proporcionado. No es un tema Shopify completo.

1. Abre **Online Store → Themes** y trabaja sobre una copia/tema de desarrollo.
2. En **Edit code**, abre cada carpeta `assets`, `blocks`, `sections` y `snippets`.
3. **Reemplaza** cada archivo modificado en su ruta exacta, y **crea** los 2 snippets nuevos en `snippets/`.
4. Guarda los cambios. No cambies tus variantes, índices ni metafields.
5. Prueba el tema y el carrito antes de publicarlo.

## Cambios visibles

### Total completo en todos los configuradores

Las páginas de **Stickers, Banners/Cruzacalles, Flyers y Business Cards** ahora muestran debajo de las opciones:

- Precio del producto (Shopify, con cantidad de banners incluida cuando aplica)
- Servicios adicionales (suma de los add-ons seleccionados)
- **TOTAL DEL PEDIDO**, que cambia al elegir otro tamaño, cantidad, acabado, laminado, Artwork Design, Rush, etc.

Si el producto no tiene add-ons asignados, igualmente muestra el precio base y `$0.00` en servicios. Si Shopify no tiene un precio válido para la combinación, el total se muestra como «—», no como cero ficticio. El sistema existente de variantes, el cobro y los precios de Shopify no cambian.

### Carrito como pedidos, no como productos/servicios

Un pedido de stickers con Artwork Design y Laminado ocupa **1 pedido visible**, aunque Shopify conserva las 3 líneas para el cobro. Un pedido de stickers y otro de banners se muestran como **2 pedidos**. La cantidad de unidades dentro de una sola línea tampoco aumenta el conteo de pedidos (por ejemplo, 3 banners de un mismo diseño son 1 pedido). Se actualizan el encabezado/contador del carrito, el título de la página de carrito y el contador del drawer.

**Importante:** los servicios siguen siendo líneas de producto distintas para Shopify y para el checkout. Solo se modifica la presentación del contador en el tema. No se modifican las reglas de validación de pago ni la política de cancelación de pedidos.

## Archivos incluidos

**Modificados (14)**

- `assets/impress-addons.js`
- `assets/impress-addons.css`
- `assets/impress-addon-cart.js`
- `assets/cart-icon.js`
- `assets/header-actions.js`
- `sections/impress-sticker-configurator.liquid`
- `sections/impress-banner-configurator.liquid`
- `sections/impress-header.liquid`
- `snippets/impress-paper-configurator.liquid`
- `snippets/impress-addon-picker.liquid`
- `snippets/cart-bubble.liquid`
- `snippets/cart-drawer.liquid`
- `snippets/cart-products.liquid`
- `blocks/_cart-title.liquid`

**Nuevos (2)**

- `snippets/impress-price-summary.liquid`
- `snippets/impress-cart-order-count.liquid`

## Pruebas locales

Se usó un navegador Chromium con formularios simulados para comprobar:

- Suma de producto + Artwork Design + laminado, en los tres componentes de configuración (sticker, banner, paper compartido por flyer y business card).
- Precio normal de producto sin add-ons.
- Actualización de precios al cambiar de tamaño, paquete o servicio.
- Banners con cantidades >1 y add-on por unidad.
- Contador de 1 pedido con 2 líneas anidadas y 2 pedidos cuando se agrega una línea de producto adicional.
- Comprobación de sintaxis JavaScript.

No se pudo realizar un checkout real de Shopify desde este entorno. Debes validar en el tema de desarrollo que los totales de la interfaz coincidan con el carrito y checkout reales.
