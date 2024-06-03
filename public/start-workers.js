if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js?v=1").then(() => {
    console.log("Service Worker instalado!");
  });
}
