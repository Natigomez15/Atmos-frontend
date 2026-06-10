self.addEventListener('push', function(evento) {
  if (!evento.data) return
  let datos = {}
  try {
    datos = evento.data.json()
  } catch (error) {
    datos = { title: 'Alerta ATMOS', body: evento.data.text() }
  }

  const titulo = datos.title || datos.titulo || 'Alerta ATMOS'
  const cuerpo = datos.body || datos.cuerpo || 'Se genero una nueva alerta.'
  const url = datos.url || datos.datos?.url || '/alerts'
  const opciones = {
    body:    cuerpo,
    icon:    datos.icon || datos.icono || '/favicon.svg',
    badge:   '/favicon.svg',
    vibrate: [200, 100, 200],
    tag:     datos.tag || datos.datos?.tag || datos.tipo_alerta || 'atmos-alerta',
    renotify: datos.renotify === true,
    data: {
      url,
      tipo_alerta: datos.tipo_alerta || datos.datos?.tipo_alerta,
      severidad: datos.severidad || datos.datos?.severidad,
    },
    actions: [
      { action: 'ver',    title: 'Ver alerta' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  }
  evento.waitUntil(
    self.registration.showNotification(titulo, opciones)
  )
})

self.addEventListener('notificationclick', function(evento) {
  evento.notification.close()
  if (evento.action === 'cerrar') return
  const urlDestino = new URL(evento.notification.data?.url || '/alerts', self.location.origin).href
  evento.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientesVentana) {
      for (const cliente of clientesVentana) {
        if (cliente.url === urlDestino && 'focus' in cliente) {
          return cliente.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino)
      }
    })
  )
})
