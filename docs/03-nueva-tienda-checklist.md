# Checklist · Nueva tienda ECOMS en ~2 horas

Una tienda Shopify por producto, en `productoN.ecoms.cl`, con el theme ECOMS MASTER desde GitHub.
Marca cada casilla en orden. Lo que dice **(una vez)** se hace solo la primera vez, no en cada tienda.

---

## 0. Antes de empezar (una vez)

- [ ] **Dropi:** confirmar con soporte que la cuenta admite varias tiendas Shopify conectadas.
- [ ] **Flow / Transbank:** confirmar si el mismo comercio sirve para varios sitios o subdominios.
- [ ] **Mercado Pago:** confirmar que la misma cuenta se puede conectar en varias tiendas.
- [ ] **Meta Business:** verificar el dominio `ecoms.cl` (registro TXT en Cloudflare). Cubre todos los subdominios.
- [ ] **GitHub:** que exista la rama `main` con el theme neutro (sin datos de ninguna tienda).

Si Dropi o la pasarela no admiten varias tiendas, conviene crear una landing nueva dentro de una tienda existente (plantilla `product.ecoms-flex-landing`) en lugar de una tienda nueva.

---

## 1. Datos del producto (antes de abrir Shopify) · 20 min

- [ ] Nombre comercial, subdominio (`producto.ecoms.cl`) y SKU de Dropi.
- [ ] Costo, precio de venta y precio de comparación (solo si es un precio anterior real).
- [ ] Packs y descuentos: cantidades (ej. 5 / 10 / 20) y % de cada uno.
- [ ] Ficha real del proveedor: material, medidas, capacidad, peso soportado, sistema de uso, colores, contenido de la caja.
- [ ] Fotos (mín. 4, máx. ~1600 px, sin base64) y video demostrativo.
- [ ] Costo y plazo de envío real con Dropi. Umbral de envío gratis, si aplica.
- [ ] Política de cambios y devoluciones.

## 2. Crear la tienda Shopify · 15 min

- [ ] Crear la tienda y elegir el plan.
- [ ] *Configuración → Detalles de la tienda*: nombre, email, dirección, RUT/razón social.
- [ ] *Configuración → Mercados*: Chile, moneda CLP, idioma español.
- [ ] Formato de moneda: *Configuración → General → Moneda → Cambiar formato* → `${{amount_no_decimals_with_comma_separator}}` en los 4 campos.
- [ ] *Configuración → Políticas*: cambios y devoluciones, envío, privacidad, términos.

## 3. Theme desde GitHub · 15 min

- [ ] En el repositorio: crear la rama `tienda-{nombre}` desde `main`.
- [ ] Shopify → *Tienda online → Temas → Agregar tema → Conectar desde GitHub* → rama `tienda-{nombre}`.
- [ ] *View logs* del tema: "0 failed".
- [ ] *Personalizar → Configuración del tema*:
  - [ ] ECOMS · Plantilla y marca: plantilla (Flex / Direct / Brand), **Nombre visible de la tienda**, colores, logo, favicon.
  - [ ] ECOMS · Carrito: envío gratis **apagado** por ahora.
- [ ] Header (anuncios y menú) y footer (logo, textos, redes). Sin WhatsApp ni cifras sin verificar.

## 4. Dropi y producto · 25 min

- [ ] Instalar la app de Dropi y conectar la tienda.
- [ ] Importar el producto desde Dropi y revisar título, descripción, fotos, precio y SKU.
- [ ] Plantilla del producto: `ecoms-flex-landing` (u otra `ecoms-*`).
- [ ] Metacampos (*Configuración → Datos personalizados → Productos*): `ecoms.subtitle`, `ecoms.benefits`, `ecoms.material`, `ecoms.dimensions`, `ecoms.capacity`, `ecoms.max_weight`, `ecoms.usage`, `ecoms.colors`, `ecoms.package_contents`.
- [ ] **Envío y entrega → perfil General:**
  - [ ] la ubicación **Fulfillment Dropi** debe estar en "Fulfillment locations" (si no, el producto sale "Agotado");
  - [ ] zona Chile con la tarifa real;
  - [ ] *Order routing*: Dropi primero.
- [ ] El producto muestra **"Agregar al carrito"**, no "Agotado".

## 5. Descuentos de packs · 10 min

Por cada pack con descuento: *Descuentos → Crear → Monto de descuento en productos → Automático*.

- [ ] Valor: el % del pack.
- [ ] Se aplica a: **productos específicos** → este producto.
- [ ] Requisito mínimo: **Cantidad mínima de artículos = unidades del pack** (ej. 10 para el 10 %, 20 para el 20 %).
- [ ] Sin combinación con otros descuentos de producto.
- [ ] En el editor, bloque Packs: mismas cantidades y %, **Pack seleccionado al cargar**, **Nombre de las unidades** y marcar **Los descuentos ya existen en Shopify**.

## 6. Pagos · 15 min

- [ ] *Configuración → Pagos*: Mercado Pago y/o Webpay (Flow, Getnet u otra).
- [ ] Revisar si Shopify cobra comisión por pasarela externa en el plan.
- [ ] App de boletas electrónicas (SII), si corresponde.
- [ ] *Configuración → Notificaciones → Autenticar dominio de envío*: agregar sus registros en Cloudflare.

## 7. Subdominio · 15 min

- [ ] Shopify: *Configuración → Dominios → Conectar dominio existente* → `producto.ecoms.cl`.
- [ ] Cloudflare (zona `ecoms.cl`): CNAME `producto` → destino que indique Shopify (normalmente `shops.myshopify.com`), en **nube gris (DNS only)**.
- [ ] Verificar en Shopify, esperar el SSL y marcarlo como dominio principal.

## 8. Medición · 10 min

- [ ] Canal **Facebook e Instagram**: píxel y API de conversiones.
- [ ] Canal **Google y YouTube**: GA4 y Google Ads.
- [ ] Probar los eventos con Meta Test Events y Google Tag Assistant: vista de producto, agregar al carrito, inicio de pago y compra.

## 9. Pruebas antes de publicar · 20 min

- [ ] Móvil (360, 375, 390 y 430 px) y escritorio: galería, packs, botón principal y botón fijo con el mismo total.
- [ ] Carrito con cada pack: **el total del carrito coincide con el precio del pack**.
- [ ] Contenido: FAQ sin respuestas inventadas, especificaciones reales, reseñas solo reales y cuenta regresiva solo con fecha de una promoción real.
- [ ] Compra real de prueba (luego reembolsar):
  - [ ] el pedido llega a Dropi con la cantidad correcta;
  - [ ] llega el email de confirmación;
  - [ ] llega el seguimiento.
- [ ] Si hay envío gratis: tarifa de $0 creada en Shopify → recién entonces activar **El envío gratis ya existe en Shopify** en el tema. Probar un pedido bajo y uno sobre el umbral en el checkout.

## 10. Publicar

- [ ] *Temas → Publicar* el tema `tienda-{nombre}`.
- [ ] Quitar la contraseña de la tienda.
- [ ] Anotar la tienda en la tabla de abajo.

---

## Registro de tiendas

| Subdominio | Tienda Shopify (`.myshopify.com`) | Rama GitHub | Plantilla | Pasarela | Dropi | Publicada |
|---|---|---|---|---|---|---|
| `ecoms.cl` | `va2nzt-wh` | `claude/gifted-maxwell-sxrubg` (pasará a `tienda-colgador`) | ecoms-flex-landing | | ✅ | |
