// Suppress known Clerk SDK transient "body stream already read" errors
// This MUST run before React's error overlay registers its handlers
(function suppressClerkErrors() {
  const CLERK_ERR = 'body stream already read';

  // Intercept unhandled rejections before CRA overlay captures them
  window.addEventListener('unhandledrejection', function (e) {
    if (e && e.reason && (
      (e.reason.message && e.reason.message.includes(CLERK_ERR)) ||
      (typeof e.reason === 'string' && e.reason.includes(CLERK_ERR))
    )) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true); // capture phase - runs before CRA overlay

  // Intercept error events
  window.addEventListener('error', function (e) {
    if (e && e.message && e.message.includes(CLERK_ERR)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
    if (e && e.error && e.error.message && e.error.message.includes(CLERK_ERR)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true); // capture phase

  // MutationObserver to auto-remove error overlay iframe if it appears with this error
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.tagName === 'IFRAME' && node.id === 'webpack-dev-server-client-overlay') {
          setTimeout(function () {
            try {
              var doc = node.contentDocument || node.contentWindow.document;
              if (doc && doc.body && doc.body.textContent.includes(CLERK_ERR)) {
                node.remove();
              }
            } catch (_) {}
          }, 100);
        }
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
