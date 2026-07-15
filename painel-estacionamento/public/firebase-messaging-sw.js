// Service Worker do Firebase Cloud Messaging — roda fora da aba, é o que permite a
// notificação aparecer mesmo com a página/app fechados. Não pode importar src/firebase.js
// (service worker não passa pelo bundler), por isso a mesma config é repetida aqui.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// >>> SUBSTITUA pelos mesmos valores usados em src/firebase.js <<<
firebase.initializeApp({
  apiKey: 'AIzaSyC2kHn0BEEzaiciw9m9Nr733IWgm5CvdQA',
  authDomain: 'srmatpark.firebaseapp.com',
  projectId: 'srmatpark',
  storageBucket: 'srmatpark.firebasestorage.app',
  messagingSenderId: '987614253077',
  appId: '1:987614253077:web:e8c1a43e052ebb79e33e1c',
});

const messaging = firebase.messaging();

// Como registramos onBackgroundMessage, o SDK não mostra a notificação sozinho — a
// exibição fica por nossa conta aqui.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'SmartPark', {
    body: body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
  });
});

// Clique na notificação: foca uma aba já aberta do app ou abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
