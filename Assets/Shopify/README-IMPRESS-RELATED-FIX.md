# Impress Related Products — corrección para Stickers

## Problema encontrado
La versión anterior elegía únicamente la primera colección del producto y no buscaba otra si esa colección no tenía productos relacionados válidos. Si la colección contenía solo Stickers y servicios de terminación, el bloque quedaba vacío.

## Instalación
Reemplaza únicamente `sections/impress-related-products.liquid` en el tema de desarrollo. No cambies templates ni configuradores.

## Nuevo comportamiento
La sección intenta recomendaciones en este orden:
1. Productos seleccionados en el ajuste **Productos recomendados (opcional)**.
2. Colección elegida en **Colección de relacionados (opcional)**.
3. Colecciones asociadas al producto actual (hasta seis).
4. Catálogo general (`collections['all']`).

Se excluyen el producto actual, los servicios/terminaciones y los duplicados. El límite de tarjetas definido en el editor sigue vigente.

## Control manual de Stickers
En Shopify Admin → Tienda online → Temas → Personalizar → abre la página de producto **Stickers** → sección **Impress Related Products** → selecciona Banners, Flyers o Business Cards en **Productos recomendados (opcional)**. Esto es opcional: existe búsqueda automática si no eliges productos.

**Nota:** Shopify solo permite seleccionar desde el editor productos activos y publicados en la tienda en línea. El catálogo general también depende de qué productos estén publicados y accesibles en Liquid.

## Verificación
Se validó el esquema JSON, los campos numéricos y los cambios en Liquid de forma estática. La disponibilidad concreta de productos/colecciones debe verificarse en el preview de Shopify, que es donde se consultan los datos de tu tienda.
