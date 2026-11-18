# Impress — Animaciones de pasos (scroll + hover)

## Instalación

En Shopify Admin > Online Store > Themes > Edit code, reemplaza **solo**:

`sections/impress-order-instructions.liquid`

Este ZIP no es un tema completo. Los íconos de los pasos no se modificaron, así que **no necesitas volver a subir los PNG**. Los textos y bloques existentes se mantienen.

## Qué cambió

- Al entrar cada tarjeta a la ventana visible, aparece con un pequeño deslizamiento y una transición suave. Las tarjetas de escritorio aparecen **escalonadas** de izquierda a derecha.
- Si sales de la sección y vuelves desde arriba o desde abajo, la animación puede reproducirse de nuevo.
- Al pasar el cursor sobre una tarjeta, toda la tarjeta se eleva ligeramente. La animación de aparición y el hover tienen transformaciones separadas, así que no se interfieren.
- En móvil, las tarjetas aparecen conforme llegan a la pantalla, sin una demora artificial por su posición en la lista.
- Si el visitante tiene activada la preferencia de movimiento reducido, se desactivan las animaciones.
- Si JavaScript está deshabilitado o falla, el contenido se mantiene visible.

## Controles en Shopify Theme Editor

Personalizar > **Impress Steps Process** > **Scroll and hover animations**:

- **Stagger steps on scroll**: activa/desactiva la animación de entrada.
- **Reveal speed**: duración de la transición (predeterminado: 550 ms).
- **Delay between steps**: separación entre tarjetas (predeterminado: 100 ms en escritorio).
- **Lift steps on hover**: activa/desactiva el movimiento al pasar el cursor.
- **Hover lift distance**: distancia que se eleva cada tarjeta (predeterminado: 8 px).

## Pruebas

Probado localmente en Chromium: aparición al hacer scroll, salida y vuelta a entrar, elevación hover, disposición móvil y movimiento reducido. No se modificaron editores de producto, precios, carrito, variantes ni metafields.
