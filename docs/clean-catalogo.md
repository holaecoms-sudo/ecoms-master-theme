# Ecoms Clean · Catálogo y configuración

Configurado en la tienda el 13-10-2026. Todos los productos nuevos quedaron en **Draft** hasta revisión.

## Productos

| Producto | Handle | Precio | Costo Dropi | Rol | Zonas |
|---|---|---|---|---|---|
| Cepillo Eléctrico de Limpieza 9 en 1 | cepillo-electrico-de-limpieza-9-en-1 | $29.990 | $9.300 | Estrella 1 (landing propia) | baño, cocina |
| Limpiador a Vapor 1000 W + Guatero de Regalo | limpiador-a-vapor | $39.990 | $15.799 | Estrella 2 | cocina, baño |
| Aspiradora 2 en 1 | aspiradora-2-en-1 | $29.990 | $9.500 | Ticket medio · **faltan specs reales** | pisos |
| Pastillas Limpiadoras para Lavadora · 24 u | pastillas-limpiadoras-lavadora | $9.990 | $1.600 | Complemento | orden |
| Destapador de Cañerías en Polvo · 3 u | destapador-canerias-polvo | $8.990 | $2.430 | Complemento | baño, cocina |
| Mopa Giratoria de Microfibra con Exprimidor | mopa-giratoria-microfibra | $12.990 | $3.510 | Complemento | pisos |
| Cepillo Eléctrico Compacto Inalámbrico | cepillo-electrico-compacto | $14.990 | $3.770 | Alternativa económica (puede canibalizar al 9 en 1) | cocina, baño |
| Cepillo de Silicona para Baño con Dispensador | cepillo-silicona-bano | $15.990 | $7.500 | Complemento | baño |
| Mini Aspiradora y Sopladora 3 en 1 | mini-aspiradora-sopladora-3-en-1 | **pendiente** | ? | Complemento | orden |
| Colgador Smart Organizador 9 en 1 | colgador-smart-organizador-9-en-1 | $3.500 | — | Complemento (plantilla propia) | orden |

## Cómo se arma cada ficha (plantilla compartida `product.clean`)

Todos los productos de Clean usan la **misma landing** (misma estructura que la del cepillo: cifras, anatomía,
qué incluye, problema/solución, usos, comparativa, reseñas, fotos de uso, especificaciones, FAQ, venta cruzada y
banda final). El contenido sale de **metacampos del producto** (Admin → producto → Metacampos):

| Sección | Metacampo | Tipo |
|---|---|---|
| Antetítulo | `ecoms.eyebrow` | texto |
| Etiquetas bajo el título | `ecoms.chips` | lista de textos |
| Subtítulo / beneficios | `ecoms.subtitle` / `ecoms.benefits` | texto / lista |
| Íconos bajo la foto y beneficios de «problema» | `ecoms.highlights` | lista de «Ítem de contenido» (ícono + título) |
| Cifras clave | `ecoms.stats` | lista de «Ítem de contenido» (ícono, valor, etiqueta) |
| Anatomía | `ecoms.features` + `ecoms.feature_image` | ítems (ícono, título, texto) + imagen |
| Qué incluye (bloque y sección) | `ecoms.includes` | ítems (ícono o imagen, cantidad, título, texto, insignia) |
| Problema / solución | `ecoms.problem_heading`, `ecoms.problem_text`, `ecoms.before_image`, `ecoms.after_image` | texto, texto enriquecido, imágenes |
| Usos por zona (pestañas) | `ecoms.uses` | ítems (etiqueta, subtítulo, texto, imagen) |
| Comparativa | `ecoms.compare_us`, `ecoms.compare_them`, `ecoms.compare_rows` | textos + lista de filas |
| Reseñas | `ecoms.reviews` | lista de «Reseña» (solo reseñas reales) |
| Fotos de uso | `ecoms.ugc` | ítems con imagen |
| Especificaciones | `ecoms.package_contents`, `ecoms.dimensions`, `ecoms.material`, `ecoms.usage` | textos |
| Preguntas frecuentes | `ecoms.faqs` | lista de «Pregunta frecuente» |
| Banda final | `ecoms.cta_heading` | texto |
| «Completa tu pedido» | `ecoms.cart_suggestions` | lista de productos |
| «Llévalo en pack» | `ecoms.pack_product` + `ecoms.pack_discount` | producto + % (debe ser igual al descuento automático real) |
| «Elige tu pack» (1, 2 o 3) | `ecoms.pack2_pct`, `ecoms.pack3_pct` (opcional), `ecoms.pack_labels` (títulos: «2 packs · 48 pastillas»), `ecoms.unit_name` | % del pack de 2 (igual al descuento automático real) + nombre en plural. Sin `pack2_pct` no se muestran packs |

Cada sección se oculta sola si el producto no tiene ese contenido. Las plantillas con bloques (la del cepillo)
siguen funcionando igual: los metacampos solo reemplazan los bloques cuando existen.

## Antes de activar un producto

1. Revisar textos (Admin → producto → Vista previa).
2. Subir 4–6 fotos propias (1:1, 2048 px).
3. Confirmar datos marcados como pendientes.
4. Cambiar a **Active**.

## Packs activos (descuentos automáticos reales)

| Pack | Descuento en Shopify | Metacampos |
|---|---|---|
| ~~Limpiador a Vapor + Pastillas~~ | Desactivado (distinto proveedor = doble flete). Las pastillas quedan solo como sugerencia en el carrito. | — |
| Pack 2 limpiadores a vapor | «Pack 2 limpiadores a vapor» (20% desde 2 unidades) | Limpiador: `pack2_pct` = 20, `unit_name` = limpiadores |
| Pack 2 y 3 pastillas para lavadora | «Pack 2 o más (pastillas y destapador) · 20%» (20% desde 2 unidades, mezclando pastillas y destapador) y «Pack 3 packs…» (30% desde 3 pastillas) | Pastillas: `pack2_pct` = 20, `pack3_pct` = 30, `pack_labels` = 1 pack · 24 / 2 packs · 48 / 3 packs · 72 pastillas |
| Pastillas + Destapador | El mismo «Pack 2 o más · 20%»: el destapador sale 20% más barato junto a cualquier pack de pastillas (y las pastillas también). Reemplaza al antiguo «Compra X lleva Y» al 50%, desactivado porque partía la línea del carrito y anulaba el pack de 2 | Pastillas: `pack_product` = Destapador, `pack_discount` = 20 |
| Cepillo 9 en 1 + Destapador de Cañerías | «Pack Cepillo 9 en 1 + Destapador: 50% en el destapador» (1 por pedido) | Cepillo: `pack_product` = Destapador, `pack_discount` = 50 |

Si cambias el % en Descuentos, cambia también `ecoms.pack_discount` del producto.

**Proveedores y envío:** cada proveedor de Dropi despacha por separado y cobra su propio flete. Arma los packs con
productos del **mismo proveedor** (ej.: cepillo, destapador y pastillas = VIDA Y HOGAR SPA) para pagar un solo envío.
El limpiador a vapor es de otro proveedor (IMPORTADORA PING): su pack con pastillas genera 2 despachos.

**Regla:** packs con descuento solo entre productos del mismo proveedor. Entre proveedores distintos, solo sugerencia
(«Completa tu pedido»), sin descuento.

**Limitación de Shopify:** un producto que ya recibe un descuento (ej.: «Pack 2 cepillos») no puede usarse como condición
de un «Compra X y llévate Y». Por eso el destapador al 50% aplica con 1 cepillo (o 3+), pero no junto al pack de 2.
Para que se acumulen haría falta una app de descuentos basada en Shopify Functions.
En pastillas + destapador se evita usando un solo descuento por cantidad que cubre ambos productos (sin «Compra X lleva Y»).

| Carrito | Total |
|---|---|
| 1 pastilla | $9.990 |
| 2 pastillas | $15.984 |
| 3 pastillas | $20.979 |
| 1 pastilla + destapador | $15.184 |
| 2 pastillas + destapador | $23.176 |
| 3 pastillas + destapador | $28.171 |
| 2 destapadores | $14.384 |
