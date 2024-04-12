if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker instalado!");
  });
}
