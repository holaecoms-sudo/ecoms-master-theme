# Verticales (sub-marcas) · ECOMS MASTER

Una **vertical** es una sub-marca dentro de la tienda (ej. **Ecoms Clean**). Cambia logo, colores, menú, redes y favicon **solo** en sus páginas; el resto de la tienda queda igual.

## Cómo se activa
1. Plantillas cuyo sufijo es la clave o empieza con `clave-`: `collection.clean`, `product.clean`, `product.clean-flex`…
2. Productos con el tag `vertical-<clave>` (ej. `vertical-clean`), si el espacio tiene activado «Activar también en productos con el tag». Sirve para que un producto mantenga su landing propia (ej. `product.ecoms-direct-landing`) con la identidad de la vertical.
3. **Fase 2 (tienda propia):** en *Configuración del tema → ECOMS · Verticales → Vertical por defecto* escribe la clave; toda la tienda usa esa identidad. Sin tocar código.

## Dónde se configura
*Personalizar → Configuración del tema → ECOMS · Verticales* (3 espacios):
clave, nombre, tagline, logo claro/oscuro (o archivo del tema por defecto), alto del logo, favicon, estilo base de las fichas, colores (principal, acento, destacado, fondo suave, fondo, texto), esquema de colores para las partes nativas (carrito, formularios), menú, usuario y enlaces de Instagram y TikTok.

## Archivos
| Archivo | Rol |
|---|---|
| `snippets/ecoms-vertical.liquid` | Detecta la vertical activa (devuelve el número de espacio) |
| `snippets/ecoms-vertical-style.liquid` | Paleta, esquema de colores y favicon de la vertical (en `<head>`) |
| `snippets/ecoms-vertical-logo.liquid` | Logo de la vertical (claro u oscuro) |
| `sections/ecoms-vertical-hero.liquid` | Hero con logo, tagline y producto estrella |
| `sections/ecoms-zones.liquid` | Accesos por zona (filtra por tag de producto) |
| `sections/ecoms-product-row.liquid` | Fila de productos («Más vendidos») |
| `sections/ecoms-social-follow.liquid` | «Síguenos en @…» |
| `templates/collection.clean.json`, `templates/product.clean.json` | Plantillas de Ecoms Clean |
| `assets/ecoms-clean-*.png` | Logos e íconos de Ecoms Clean |

## Agregar una vertical nueva (ej. hogar)
1. *ECOMS · Verticales → Vertical 2*: clave `hogar`, nombre, logo, colores, redes, menú.
2. Duplicar `templates/collection.clean.json` y `templates/product.clean.json` como `collection.hogar.json` / `product.hogar.json` y ajustar textos en el editor.
3. Crear la colección `hogar` y asignar las plantillas.

## Checklist admin · Ecoms Clean
- [ ] Colección **Ecoms Clean**, handle exacto `clean`, automática con condición *Etiqueta del producto = `vertical-clean`*, plantilla `collection.clean`, orden «Más vendidos».
- [ ] A cada producto de limpieza: tag `vertical-clean` + tags de zona (`zona-bano`, `zona-cocina`, `zona-pisos`, `zona-orden`) y plantilla `product.clean` (o mantener su landing propia: el tag ya le da la identidad).
- [ ] Menú **Ecoms Clean** (*Tienda online → Menús*): ej. Inicio Clean (`/collections/clean`), Baño (`/collections/clean/zona-bano`), Cocina, Pisos y vidrios, Orden, Contacto → elegirlo en *ECOMS · Verticales → Vertical 1 → Menú*.
- [ ] (Opcional) Subir logo SVG/PNG y favicon en *ECOMS · Verticales → Vertical 1*; si no, se usan los del tema (`assets/ecoms-clean-*.png`).
- [ ] En la colección: elegir el producto estrella en el Hero y subir 3–6 imágenes en «Síguenos».
- [ ] Cloudflare: registro `clean` en nube naranja + Redirect Rule a `https://ecoms.cl/collections/clean`.
