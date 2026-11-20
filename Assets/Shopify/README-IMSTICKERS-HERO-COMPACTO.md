# IM Stickers Hero — versión más simple y compacta

## Instalación
Reemplaza únicamente estos archivos del tema de desarrollo:

- `sections/imstickers-hero.liquid`
- `assets/imstickers-hero.css`

**No reemplaces `assets/imstickers-hero.js`**: la navegación, autoplay, swipe y controles de diapositivas funcionan igual. La sección original `impress-hero` permanece intacta.

## Cambios
- Se eliminó la etiqueta pequeña que aparecía antes del título.
- Se eliminó la línea con la estrellita que aparecía entre título y descripción.
- Ambos campos desaparecen también de los controles de cada diapositiva (los textos anteriormente guardados simplemente dejan de mostrarse).
- Se reducen los espacios verticales y el valor predeterminado de altura mínima para **nuevas** instancias pasa de 560 a 520px.
- Se conserva la solución anterior de altura constante entre diapositivas y los controles de navegación en la parte inferior.

**Nota:** si ya modificaste la altura mínima en el editor de Shopify, Shopify conserva ese valor; puedes ponerla en 520px si quieres el nuevo tamaño exacto.
