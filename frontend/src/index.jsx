import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

function bootstrap() {
  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root element not found. Make sure index.html has a div with id='root'.");
  }

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
