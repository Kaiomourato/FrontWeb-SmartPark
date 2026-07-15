import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Config pública do projeto Firebase (Console > Configurações do projeto > Seus apps > Web).
// Não é segredo — todo app Firebase embarca esses valores no navegador; a proteção real
// é via regras de segurança e restrição da API key por domínio no Google Cloud Console.
// >>> SUBSTITUA pelos valores do seu projeto (e replique os mesmos em
// public/firebase-messaging-sw.js, que não pode importar este arquivo). <<<
const firebaseConfig = {
  apiKey: 'AIzaSyC2kHn0BEEzaiciw9m9Nr733IWgm5CvdQA',
  authDomain: 'srmatpark.firebaseapp.com',
  projectId: 'srmatpark',
  storageBucket: 'srmatpark.firebasestorage.app',
  messagingSenderId: '987614253077',
  appId: '1:987614253077:web:e8c1a43e052ebb79e33e1c',
};

// Chave VAPID pública: Console > Configurações do projeto > Cloud Messaging > "Web Push certificates".
const VAPID_KEY = 'BHNprW0OUe3hkl1soP9i0DmoI4c_c4CHONWINYB3uK4ds5HKjpCh_ehO_73vdJFqZf_LqUhqlZmozXk1DLjs838';

const app = initializeApp(firebaseConfig);

let messagingPromise = null;
// Safari/iOS antigos e navegadores sem Service Worker não suportam FCM — isSupported()
// evita quebrar o app nesses casos.
function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = isSupported().then((suportado) => (suportado ? getMessaging(app) : null));
  }
  return messagingPromise;
}

async function registrarServiceWorker() {
  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

// Usado quando a permissão JÁ foi concedida antes (ex.: relogin no mesmo navegador) —
// não dispara o prompt do navegador de novo, só busca/renova o token.
export async function obterTokenPushSeConcedido() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  const registration = await registrarServiceWorker();
  return getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

// Dispara o prompt de permissão do navegador (precisa ser chamado a partir de uma ação
// do usuário, ex.: clique em um botão) e, se aceito, retorna o token.
export async function solicitarPermissaoEToken() {
  if (typeof Notification === 'undefined') return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return null;
  const registration = await registrarServiceWorker();
  return getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

// Mensagens que chegam com a aba em primeiro plano não aparecem como notificação do
// sistema sozinhas — quem chama isso decide como mostrar (ex.: toast).
export async function ouvirMensagensEmPrimeiroPlano(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;
  onMessage(messaging, callback);
}
