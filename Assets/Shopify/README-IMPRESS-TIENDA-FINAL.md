# Impress Shopify — Home, Catálogo, Producto y Navegación

Base: el `Shopify.zip` más reciente compartido en esta conversación (15 noviembre 2026).

## Elegir una sola opción de instalación

**Opción A — Reemplazos:** Usa `Impress-Shopify-Storefront-Actualizacion.zip`. En una copia del tema, reemplaza los archivos manteniendo las rutas `assets/`, `sections/` y `templates/`. NO se sube este archivo pequeño directamente como un tema completo.

**Opción B — Tema completo:** Usa `Impress-Shopify-Tema-Completo.zip` en **Online Store → Themes → Add theme → Upload zip file**. Es una copia del tema original con estos cambios aplicados, empaquetada desde la raíz de Shopify.

Las dos opciones contienen los mismos cambios; NO necesitas instalar ambas. Antes de publicar, prueba el tema en la tienda de desarrollo.

## Qué cambia

- Inicio: hero de pantalla ancha/alta configurable, catálogo con botón ancho «Ver todos», instrucciones, blog, clientes, reseñas, beneficios, FAQ, CTA y footer.
- `/collections/all`: catálogo de productos con tarjetas responsivas, precios reales de Shopify, ordenar, paginación, FAQ, blog y footer. El diseño también se usa para otras colecciones que usan `collection.json`.
- Páginas de stickers, banners, flyers, business cards: sus configuradores anteriores intactos + FAQ editable + productos relacionados. La plantilla genérica de producto incorpora FAQ sin sustituir las recomendaciones existentes.
- Navegación: logo, menú de productos desplegable tipo buscador (NO es campo de búsqueda), acceso a cuenta cuando esté habilitado, carrito. Hover en desktop, toque/clic en móvil, cerrar con Escape o al salir.
- El menú recoge títulos, precios, imágenes y enlaces de productos reales de Shopify con plantillas `product.impress-*` o tag `impress-featured`. También puedes configurar productos manualmente agregando bloques «Item Card» y seleccionando el producto desde el editor.
- Se quitaron del anuncio las afirmaciones de envío gratis y descuento de 25% no verificadas. No se agregaron promociones inventadas.
- El footer mantiene los datos existentes, con accesos al catálogo y a productos configurados.

## Puntos a completar en Shopify (sin tocar código)

1. **Blog:** en Online Store → Blog posts, publica artículos propios. Luego ve a **Customize → Home → Impress Blog Posts** y selecciona el blog. Si no tiene artículos publicados, el bloque se oculta en la tienda (visible como nota en el editor).
2. **Reseñas:** en **Customize → Home → Impress Reviews**, agrega bloques con citas reales, el nombre de la persona/negocio y estrellas SOLO si realmente corresponden a una evaluación. Sin reseñas reales, no se muestra una sección ficticia.
3. **Servicios:** a los productos internos «Artwork Design», «Finishing Services», «Rush Production» y futuros servicios, añade el tag **`impress-addon`** en Shopify Products. Así se ocultan del catálogo público y de los relacionados, aunque siguen disponibles para añadirse al carrito desde la configuración.
4. **Productos del menú:** verifica que cada producto de impresión tenga asignada su plantilla de producto Impress (`impress-sticker`, `impress-banner`, `impress-flyer`, `impress-business-card`). Eso permite que aparezcan automáticamente en el desplegable. Como alternativa, etiqueta el producto `impress-featured` o añádelo manualmente mediante bloques en Customize → Header → Impress Header.
5. **Login:** se muestra cuando las cuentas de clientes están activadas en la configuración de Shopify.
6. **Hero/CTA:** Customize → Home → Impress Hero para ajustar altura, ancho y slides. Confirma los enlaces de producto en el hero, Showcase, CTA y footer (se conservaron/actualizaron los recursos de producto existentes en tu tema).
7. **FAQ:** cada plantilla tiene sus propios bloques editables de preguntas; cambia respuestas si tus políticas de diseño, producción o recogido lo requieren.

## Pruebas recomendadas en Shopify antes de publicar

- Home desktop y mobile: carrusel, «Todos los productos», blog y clientes; ningún botón con enlace vacío.
- Menú: hover, clic, toque móvil, Escape y carrito. Revisa acceso a cuenta si Shopify Accounts está habilitado.
- `/collections/all`: lista los productos de impresión; los servicios etiquetados `impress-addon` NO deben mostrarse. Comprueba ordenación y paginación.
- Cada una de las cuatro plantillas de producto: configurar una variante, subir un archivo, verificar DPI, zoom/pan, servicios, precio total, carrito y checkout.
- FAQ y relacionados bajo cada producto, footer en todas las páginas.
- Blog/reseñas solo aparecen después de disponer de contenido real.

## Alcance y validación

Se comprobaron el JSON de las plantillas y schemas, referencias de secciones y recursos, balance de bloques Liquid y las interacciones aisladas del menú en Chromium (desktop y móvil). No hay conexión a tu tienda Shopify, así que NO se ha verificado el render completo real de Liquid, el inventario, el checkout o el contenido de blogs/reseñas.

El cambio es de navegación y presentación: NO se modificaron las funciones de configuradores, su Core, la lógica de add-ons, variantes, DPI ni carrito.
