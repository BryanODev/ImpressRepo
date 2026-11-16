# Impress — Banners / Cruzacalles: terminaciones solicitadas (15 nov 2026)

Este paquete de **5 archivos de reemplazo** adapta el configurador de banners al mensaje del 9 de noviembre. Fue construido sobre los archivos **con add-ons y precios de finishing** de la actualización anterior. No cambia precios ni variantes en la tienda de Shopify: esas se administran en **Products**.

## 1. Instala los archivos en un tema duplicado

En Shopify Admin → Online Store → Themes → [tema DUPLICADO] → Edit code, reemplaza los archivos con estas rutas exactas:

- `assets/impress-banner-configurator.js`
- `assets/impress-banner-editor.js`
- `assets/impress-banner-configurator.css`
- `assets/impress-variant-mapping.js`
- `sections/impress-banner-configurator.liquid`

**No subas este ZIP como un tema completo:** contiene exclusivamente reemplazos + este README.

**Índices para Banners:** `mounting: 1, size: 0` porque el producto público presenta `Tamaño` como Opción 1 y `Terminación` como Opción 2. No se han cambiado los índices de Stickers, Flyers ni Business Cards. Si en tu producto específico el orden de las opciones fuera otro, verifica el orden en Shopify Admin antes de utilizar el tema.

## 2. Configura las opciones del producto Banners (Cruzacalles) en Shopify Admin

Ve a **Products → Banners (Cruzacalles) → Variants**.

Mantén **Tamaño** como opción 1 (index `0`) y **Terminación** como opción 2 (index `1`). No hace falta crear ninguna opción 3 ni un producto `Finishing Services` para estas terminaciones **obligatorias** del banner.

La segunda opción debe contener estas **cuatro variantes vendibles**:

| Valor exacto de la opción `Terminación` en Shopify | Cómo aparece en Impress | Producción |
|---|---|---|
| `Terminación sencilla` | Terminación sencilla | Doblar SOLO izquierda y derecha; SIN argollas |
| `Terminación sencilla con argollas` | Sencilla con argollas | Doblar izquierda y derecha; EXACTAMENTE 4 argollas, una por esquina |
| `Banner reforzado - Cada 2 pies` | Banner reforzado → Cada 2 pies | Doblar 4 lados; argollas separadas aprox. cada 2 pies |
| `Banner reforzado - Cada 1 pie` | Banner reforzado → Cada 1 pie | Doblar 4 lados; argollas separadas aprox. cada 1 pie |

> Los dos valores de **Banner reforzado** forman una sola tarjeta visual con selector condicional de 1 pie / 2 pies. Son variantes Shopify distintas para que puedas fijar precios diferentes por tamaño y separación. El agrupamiento depende de que estos valores incluyan `reforzado` y la separación (`1 pie` o `2 pies`); no cambies sus nombres a descripciones ambiguas. Los nombres de los CAMPOS Shopify (`Tamaño`, `Terminación`) pueden cambiar sin afectar el mapping por índice.

**Si conservas `Palos` y `Argollas`**, seguirán apareciendo como opciones anteriores con sus precios actuales. No se eliminan automáticamente; retíralas desde Shopify Admin solo después de que tu jefe confirme qué hacer con ellas. **La opción actual `Argollas` no se reinterpretará como cuatro argollas.**

## 3. Mantén estos nueve tamaños y precios BASE

Los precios comunicados por tu jefe para los banners existentes (Palos / Argollas, ambos al mismo precio) son:

| Tamaño | Precio base comunicado |
|---|---:|
| 2 × 3 pies | $20 |
| 2 × 4 pies | $24 |
| 3 × 5 pies | $34 |
| 3 × 6 pies | $42 |
| 3 × 8 pies | $54 |
| 3 × 10 pies | $65 |
| 4 × 6 pies | $54 |
| 4 × 8 pies | $72 |
| 4 × 10 pies | $90 |

**ATENCIÓN: el mensaje no incluye precios nuevos para terminación sencilla, sencilla con cuatro argollas, ni reforzado cada 1/2 pies.** Es necesario que tu jefe apruebe el importe de cada combinación antes de publicar las nuevas variantes. No hemos asumido, aplicado ni inventado precios adicionales.

Con 9 tamaños × 4 terminaciones habrá **36 combinaciones** nuevas si eliges crear las cuatro para cada tamaño (además de cualquier `Palos`/`Argollas` que conserves). Modifica los precios en Shopify, no en JavaScript. Los valores de tamaño como `2’ x 3’`, `2 x 3 ft` o `2′ × 3′` son aceptados por el editor.

## 4. Qué ve el cliente

1. **Terminación del banner**: tres botones: Sencilla, Sencilla con argollas, Reforzado (más opciones anteriores si aún figuran en Shopify).
2. Si elige **Reforzado**, aparece **Separación de argollas: Cada 2 pies / Cada 1 pie**.
3. **Tamaño**, **Orientación** (solo presentación) y **Cantidad** conservan su flujo actual.
4. Impress selecciona la combinación de variante real y el precio real de Shopify. No hay valores adicionales de terminación codificados en JavaScript. Una combinación que no existe o no está disponible deshabilita el botón de compra.
5. En el pedido se guardan la variante elegida, `Impress - Tipo de montaje` y `Impress - Separación de argollas` cuando aplica. La vista del editor ilustra cuatro esquinas o el espaciado alrededor del perímetro, pero **la posición física final de las argollas debe confirmarse en producción**.

## 5. ¿Y el producto Finishing Services?

Puedes conservarlo para **extras opcionales**: laminación de stickers, redondeo de esquinas, etc. Estas tres terminaciones de banners son elecciones **mutuamente excluyentes y obligatorias**, así que usan directamente la opción 2 del producto Banner (que ya ocupaba `Palos` / `Argollas`). Esto evita dos cargos por argollas. Si habías asignado un add-on `Argollas reforzadas` al banner, retíralo del metafield `custom.impress_addons` cuando su costo ya forme parte del precio del banner reforzado.

La lista de precios de stickers laminados/no laminados que compartió el jefe no se modifica con este ZIP. Esos dos productos Shopify siguen separados por ahora.

## 6. Prueba antes de publicar

- Tema duplicado, producto de prueba o vista previa: confirmar que `2’ x 3’` se reconoce y que aparecen las terminaciones configuradas.
- Seleccionar sencilla: sin argollas en la guía ni en el resumen.
- Seleccionar sencilla con argollas: exactamente 4 esquinas en la vista.
- Seleccionar reforzado: se habilita la selección 1 pie / 2 pies y cambia el número ilustrativo de argollas.
- Cambiar entre dos tamaños y cantidades: variante ID y precio correcto de Shopify.
- Añadir artwork y servicios de Artwork/Rush ya configurados: deben seguir funcionando sin cargos duplicados.
- Agregar al carrito real, verificar el pedido y hacer un checkout de prueba. Los tests locales fueron con variantes simuladas; **no hemos probado el checkout real de tu tienda**.

**Si no está decidido el precio de reforzado**, mantén esas variantes como no disponibles o continúa en tema no publicado hasta tener los precios aprobados.
