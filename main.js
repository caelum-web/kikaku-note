if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('登録成功:', registration.scope);
      })
      .catch(error => {
        console.log('登録失敗:', error);
      });
  });
}
