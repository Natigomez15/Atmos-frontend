self.addEventListener('push', function(evento) {
  if (!evento.data) return
  const datos = evento.data.json()
  const opciones = {
    body:    datos.cuerpo,
    icon:    datos.icono || '/favicon.svg',
    badge:   '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: datos.url || '/alerts' },
    actions: [
      { action: 'ver',    title: 'Ver alerta' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo, opciones)
  )
})

self.addEventListener('notificationclick', function(evento) {
  evento.notification.close()
  if (evento.action === 'cerrar') return
  const urlDestino = evento.notification.data?.url || '/alerts'
  evento.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientesVentana) {
      for (const cliente of clientesVentana) {
        if (cliente.url.includes(urlDestino) && 'focus' in cliente) {
          return cliente.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino)
      }
    })
  )
})
