if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker Registered Successfully!'))
      .catch(err => console.error('Service Worker Error:', err));
  });
}