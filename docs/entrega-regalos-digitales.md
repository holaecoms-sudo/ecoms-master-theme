# Entrega del ebook y el calendario (beauty.ecoms.cl)

Archivos listos en el repo: `assets/guia-rutina-10-segundos.pdf` (ebook, desde 2 unidades) y `assets/calendario-glow-30-dias.pdf` (calendario, desde 3 unidades).

## 1. Subir los PDF (1 minuto)
Shopify admin → Contenido → Archivos → Subir los dos PDF. Copiar el enlace de cada uno (permanente, a diferencia del enlace de assets del tema, que cambia con cada tema).

## 2. Agregarlos al correo de confirmación
Configuración → Notificaciones → Confirmación del pedido → Editar código. Pegar justo antes del resumen del pedido, reemplazando LINK_EBOOK y LINK_CALENDARIO:

```liquid
{% assign ec_qty = 0 %}
{% for line in subtotal_line_items %}{% assign ec_qty = ec_qty | plus: line.quantity %}{% endfor %}
{% if ec_qty >= 2 %}
<h3>Tus regalos de Ecoms Beauty</h3>
<p><a href="LINK_EBOOK">Descarga tu ebook: rutina de 10 segundos</a></p>
{% if ec_qty >= 3 %}<p><a href="LINK_CALENDARIO">Descarga tu Calendario Glow 30 días</a></p>{% endif %}
{% endif %}
```

## 3. Revisar
- El formulario de Releasit debe pedir el correo, si no el cliente no recibe la confirmación.
- Hacer un pedido de prueba con 2 y con 3 unidades y revisar que lleguen los enlaces correctos.
- Opcional: repetir los enlaces por WhatsApp.
