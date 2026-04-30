// Suppress known Clerk SDK transient "body stream already read" errors
(function suppressClerkErrors() {
  const CLERK_ERR = 'body stream already read';

  window.addEventListener('unhandledrejection', function (e) {
    if (e && e.reason && (
      (e.reason.message && e.reason.message.includes(CLERK_ERR)) ||
      (typeof e.reason === 'string' && e.reason.includes(CLERK_ERR))
    )) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  }, true);

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
  }, true);

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

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { PWAProvider } from "@/pwa/PWAProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PWAProvider>
      <App />
    </PWAProvider>
  </React.StrictMode>,
);
