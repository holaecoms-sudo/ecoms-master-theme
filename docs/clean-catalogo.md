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

## Cómo se arma cada ficha (plantilla `product.clean`)

Todo sale de metacampos del producto, así una sola plantilla sirve para todos:

- `ecoms.subtitle`: texto bajo el título
- `ecoms.benefits`: lista con check
- `ecoms.package_contents`, `ecoms.dimensions`, `ecoms.material`, `ecoms.usage`: tabla de especificaciones (filas vacías se ocultan)
- `ecoms.faqs`: lista de metaobjetos `ecoms_faq` (pregunta + respuesta). Cada producto lleva sus preguntas + 3 generales (envío, pago, cambios)
- `ecoms.cart_suggestions`: productos para «Completa tu pedido» en el carrito

Reseñas: la sección se oculta si el producto no tiene reseñas reales.

## Antes de activar un producto

1. Revisar textos (Admin → producto → Vista previa).
2. Subir 4–6 fotos propias (1:1, 2048 px).
3. Confirmar datos marcados como pendientes.
4. Cambiar a **Active**.
