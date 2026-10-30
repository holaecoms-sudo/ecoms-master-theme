# Correos de Ecoms Beauty (Configuración → Notificaciones)

Antes de pegarlos: Configuración → Idiomas → dejar **Español** como idioma predeterminado, para que el resto del correo (y el checkout) salga en español.

En cada notificación: abrir → «Editar código» → borrar todo → pegar el archivo → guardar. Usar «Vista previa» para revisar.

| Notificación de Shopify | Archivo | Asunto sugerido |
|---|---|---|
| Confirmación del pedido | `confirmacion-pedido.liquid` | ¡Gracias por tu compra! Pedido {{ order_name }} confirmado |
| Confirmación de envío | `confirmacion-envio.liquid` | Tu pedido {{ order_name }} va en camino |
| Entregado | `pedido-entregado.liquid` | Tu pedido {{ order_name }} llegó. ¿Cómo te fue? |
| Carrito abandonado (Checkout abandonado) | `carrito-abandonado.liquid` | Dejaste tu pedido a medias |
| Pedido nuevo (alerta del equipo, «Nuevo pedido») | `alerta-pedido-nuevo-equipo.liquid` | [Pedido nuevo] {{ order_name }} · {{ total_price | money }} |

## Antes de publicar
1. En `confirmacion-pedido.liquid` reemplazar los tres enlaces de regalos: `REEMPLAZAR_LINK_EBOOK`, `REEMPLAZAR_LINK_GUIA_MELAXIN`, `REEMPLAZAR_LINK_CALENDARIO_MELAXIN`. Subir antes los PDF a Contenido → Archivos y copiar su enlace.
2. Subir el logo en Configuración → Marca (el correo lo toma solo).
3. Pedidos nuevos para el equipo: Configuración → Notificaciones → «Destinatarios de las notificaciones del personal» → agregar los correos de quienes despachan.
4. Enviar un pedido de prueba con 2 y con 4 barras del bálsamo, y con 2 y 3 de Melaxin, y revisar que cada correo muestre los regalos correctos.
