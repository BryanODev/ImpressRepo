# IMPRESS — Resolución original + DPI efectivo (15 noviembre 2026)

## Instalación

**El archivo ZIP solo contiene reemplazos del tema**. No es un tema Shopify completo.

1. En Shopify, abre tu **tema de desarrollo o una copia del tema**, en *Online Store > Themes > Edit code*.
2. Sustituye cada archivo de `assets/`, `sections/` y `snippets/` por el archivo con la misma ruta dentro del ZIP. Crea `assets/impress-artwork-quality.js` (nuevo).
3. Asegúrate de que los scripts compartidos sigan apareciendo antes de los scripts de los editores. Las secciones del ZIP ya incluyen el nuevo script en el orden correcto.
4. Guarda, refresca la vista del producto y prueba un PNG/JPG/TIFF. No hay que configurar variantes ni metafields.

Incluí los controles más recientes para **Contour Cut: altura, posición fija y zoom/pan habilitados**, porque el Shopify.zip más reciente aportado al proyecto era anterior a esos dos parches.

## Qué se muestra

En la **esquina superior derecha de la vista previa**, después de cargar el archivo original:

- `Resolución · 900 × 900 px` — dimensiones del archivo raster ORIGINAL, no de una miniatura ni del PNG de previsualización.
- `300 DPI · Buena` — estimación de DPI efectivos al tamaño seleccionado.
- Estado verde/amarillo/rojo según los siguientes límites:

| Producto | Rojo (Baja) | Amarillo (Aceptable) | Verde (Buena) |
|---|---:|---:|---:|
| Stickers | menos de 150 | 150 a 299 | 300 o más |
| Flyers | menos de 150 | 150 a 299 | 300 o más |
| Business cards | menos de 150 | 150 a 299 | 300 o más |
| Banners | menos de 50 | 50 a 71 | 72 o más |

- Para **Contour Cut**, el DPI se calcula usando la **altura** escogida por el cliente, aunque Shopify conserve `2 × 2 in` como variante de precio.
- Para **Square, Circular, Flyers, Business Cards y Banners**, se evalúa la proporción del archivo raster al tamaño físico de la impresión y la **escala del arte** en el editor. El margen decorativo de la vista previa no infla artificialmente el DPI.
- En flyers y tarjetas de dos caras, se muestra la resolución **de la cara activa**; el frente y el dorso pueden tener distintas calificaciones.
- **Zoom y pan de vista** no alteran la evaluación, la posición del diseño, ni la exportación.
- **SVG**: indica `DPI: no aplica`, sin inventar calidad; puede contener imágenes incrustadas que requieren revisión.
- **PDF**: indica `DPI: por revisar`, porque puede mezclar imágenes raster con vectores. Se sigue usando solo la primera página como referencia visual.

## Límite importante

El cálculo es una **estimación de DPI efectivos**, no una revisión automatizada de calidad de impresión. No detecta desenfoque, compresión JPEG, texto demasiado fino ni resolución de imágenes incrustadas en PDFs/SVGs. Los cambios de DPI de un archivo sin nuevas muestras de píxeles no crean detalles. El original se sigue enviando sin convertir, el PNG editado no se convierte en archivo de producción y los umbrales **no bloquean el checkout**.

## Pruebas locales realizadas

- 600 × 600 px a 2 × 2 in: 300 DPI / verde; a 4 × 4 in: 150 DPI / amarillo.
- Banner de 3456 × 2304 px a 48 × 32 in: 72 DPI / verde; en un área de 96 × 64 in: 36 DPI / rojo.
- Los editores reales de stickers, banners y papel pasan pruebas con valores simulados de archivo.
- Cambio de tamaño/escala, Contour Cut, cambio de lado (frente/dorso) y estado de SVG/PDF sin falso DPI.
- Comprobación con decodificador real: PNG de 900 px conserva `900 × 900` como resolución original aunque su vista previa se reduzca a 600 × 600.

**Aún no verificado**: una compra real en Shopify con archivos PDF/TIFF originales en el checkout de la tienda.
