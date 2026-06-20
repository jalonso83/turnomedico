// TurnoMedico Service Worker

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Tienes una notificación de TurnoMedico',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      appointmentId: data.appointmentId,
    },
    actions: [],
  };

  // Add actions based on notification type
  if (data.type === 'REMINDER_24H' || data.type === 'REMINDER_1H') {
    options.actions = [
      { action: 'confirm', title: 'Confirmar asistencia' },
      { action: 'cancel', title: 'Cancelar cita' },
    ];
  } else if (data.type === 'YOUR_TURN') {
    options.actions = [
      { action: 'open', title: 'Ver turno' },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TurnoMedico', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if (event.action === 'confirm') {
    const appointmentId = event.notification.data?.appointmentId;
    if (appointmentId) {
      event.waitUntil(
        fetch(`/api/v1/appointments/${appointmentId}/confirm`, {
          method: 'POST',
        }).catch(() => {})
      );
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Install event
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
