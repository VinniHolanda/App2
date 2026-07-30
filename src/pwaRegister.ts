let deferredPrompt: any = null;

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('FitConnect PWA registrado:', reg.scope);
        })
        .catch((err) => {
          console.warn('Erro ao registrar Service Worker do FitConnect:', err);
        });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwaInstalled'));
    console.log('FitConnect PWA foi instalado no dispositivo!');
  });
}

export function promptPwaInstall(): Promise<boolean> {
  return new Promise((resolve) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        const accepted = choiceResult.outcome === 'accepted';
        if (accepted) {
          console.log('Usuário instalou o aplicativo FitConnect');
        }
        deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('pwaInstalled'));
        resolve(accepted);
      });
    } else {
      resolve(false);
    }
  });
}

export function isPwaInstallable(): boolean {
  return deferredPrompt !== null;
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
