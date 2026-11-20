# IM Stickers Hero — independiente del hero actual

## Instalación
1. Copia `sections/imstickers-hero.liquid` a `sections/` de tu **tema de desarrollo**.
2. Copia `assets/imstickers-hero.css` y `assets/imstickers-hero.js` a `assets/`.
3. En Shopify, abre **Online Store > Themes > Customize**.
4. En la página donde quieres el hero, selecciona **Add section > IM Stickers Hero**.
5. Puedes ocultar el hero anterior para comparar, sin eliminarlo ni sobrescribirlo.

## Configuración
- **Cada bloque "Diapositiva"** tiene título, etiqueta, frase, descripción, enlaces, color de fondo, imagen de escritorio y opcional de móvil, posición y escala.
- **Si no subes ninguna imagen**, toma las ilustraciones de ejemplo que YA están en la carpeta assets de tu tema (sticker collage, banners, business cards, flyers).
- **Slideshow:** autoplay, duración, pausa al pasar el mouse, flechas, puntos y deslizar en móvil. El editor de Shopify puede seleccionar diapositivas sin pelear con autoplay.
- **Estilo:** altura de desktop, alto de imagen móvil, ancho del contenido, colores y espaciados. El fondo negro es el estilo predeterminado; puedes activarlo como tarjeta contenida si lo deseas.
- El enlace principal por defecto corresponde al tipo de producto de cada diapositiva, y el secundario lleva a `/collections/all`; puedes cambiar ambos.
- La etiqueta H1/H2 se puede elegir por diapositiva. Usa un solo H1 por página para SEO y accesibilidad.
- La pequeña frase junto a la estrella decorativa NO representa una calificación. No se añaden números de reviews inventados.

## Notas
- Este ZIP **NO modifica** `sections/impress-hero.liquid`, ningún producto, plantilla, configurador, ni homepage JSON.
- El hero es nuevo e independiente; se agrega desde el Theme Editor.
- Su slideshow se pausa con el mouse / enfoque en botones, al salir de la pantalla y cuando la pestaña no es visible. Respeta movimiento reducido.
- Si quieres replicar exactamente el sticker collage de tu captura, sube una versión con licencia adecuada en la imagen del bloque; por defecto usa la ilustración existente de Impress.
