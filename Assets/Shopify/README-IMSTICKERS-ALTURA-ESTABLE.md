# IM Stickers Hero — altura estable entre diapositivas

## Instalación

En tu tema de desarrollo de Shopify, reemplaza **solo**:

- `assets/imstickers-hero.css`

No reemplaces la sección Liquid ni el JavaScript; todos tus ajustes y diapositivas existentes permanecen intactos.

## Cambio

El contenedor del slideshow ahora reserva la altura necesaria para la diapositiva más alta a cada ancho de pantalla. Así el hero no cambia de altura al avanzar, retroceder o activar autoplay, en móvil y desktop, sin ocultar texto de diapositivas más largas.

Los controles existentes de **Altura mínima en desktop** y **Altura de imagen en móvil** siguen funcionando. No se añadieron ajustes nuevos.

## Validación local

Comprobado con Chromium a 320, 390, 749, 750, 980, 1280 y 1440 px: las alturas de las cuatro diapositivas coinciden al navegar. También comprobado con una diapositiva de texto excepcionalmente largo, sin recortes por una altura fija rígida. Revisa el resultado con tus imágenes y contenido finales en la vista previa de Shopify antes de publicar.
