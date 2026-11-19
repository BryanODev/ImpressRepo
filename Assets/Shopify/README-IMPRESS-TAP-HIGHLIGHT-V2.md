# Impress — fix v2 para recuadros azules al tocar en móvil

## Instalación

Reemplaza / agrega estos 4 archivos desde el ZIP en tu tema Shopify:

- `layout/theme.liquid`
- `layout/password.liquid`
- `assets/impress-global-interactions.css`
- `assets/impress-global-interactions.js`

Si ya instalaste la actualización global anterior y tus layouts incluyen `impress-global-interactions.css` y `impress-global-interactions.js`, basta con reemplazar **los dos assets**. No reemplaces un layout si hiciste otros cambios posteriores que deseas conservar: en ese caso, comprueba que incluya las dos referencias.

## Qué se corrigió

La primera solución solo quitaba el tap highlight del navegador. El tema también crea recuadros mediante `:focus-visible` y, en ciertos elementos, sombras o pseudoelementos. La nueva versión:

1. Fuerza `-webkit-tap-highlight-color` transparente para enlaces, botones y elementos internos.
2. En dispositivos táctiles evita el recuadro de foco de los elementos pulsados, sin suprimir el foco visible cuando se navega con teclado físico.
3. Evita la selección de texto en etiquetas de botones y enlaces durante gestos de toque (el resto del texto se mantiene seleccionable).
4. Conserva el bloqueo previo de arrastre de imágenes y del menú contextual de imágenes como disuasivo; no impide técnicamente que se descarguen.

No cambia archivos de configuradores de impresión ni sus eventos de clic, carga, zoom, paneo o rueda.

## Si todavía aparece el recuadro

1. Confirma que subiste los archivos al **mismo tema** que estás viendo en el teléfono (un tema borrador y el tema publicado no son lo mismo).
2. Confirma que `layout/theme.liquid` incluye las referencias a `impress-global-interactions.css` y `impress-global-interactions.js`.
3. Cierra y vuelve a abrir la pestaña del sitio, o recarga evitando caché, para recibir los assets nuevos.
4. Si el efecto sigue, envía una captura o grabación de pantalla y el nombre del botón afectado: podría tratarse de un estado personalizado por otro app o un elemento específico de Shopify.

Comprobado con Chromium emulando un dispositivo móvil y un escritorio. La apariencia exacta en Safari/iOS requiere una prueba final en un dispositivo real.
