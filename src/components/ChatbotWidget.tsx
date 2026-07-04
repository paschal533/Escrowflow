// src/components/ChatbotWidget.tsx
import { useEffect } from "react";

export default function ChatbotWidget() {
  useEffect(() => {
    // guard against StrictMode's double-mount injecting twice
    if (document.getElementById("bp-webchat-inject")) return;

    const inject = document.createElement("script");
    inject.id = "bp-webchat-inject";
    inject.src = "https://cdn.botpress.cloud/webchat/v3.6/inject.js";

    inject.onload = () => {
      const config = document.createElement("script");
      config.id = "bp-webchat-config";
      config.src = "https://files.bpcontent.cloud/2026/07/03/10/20260703101148-VSJJD1ZW.js";
      document.body.appendChild(config);
    };

    document.body.appendChild(inject);
    // no cleanup — leave the widget mounted
  }, []);

  return null;
}