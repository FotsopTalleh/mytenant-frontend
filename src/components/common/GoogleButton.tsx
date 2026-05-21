import { useEffect, useRef } from "react";

// ── Ambient types for Google Identity Services ─────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: string;
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

interface Props {
  /** Called with the ID token credential when sign-in succeeds */
  onCredential: (credential: string) => void;
  loading?: boolean;
  label?: string;
}

export function GoogleButton({ onCredential, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    function initGIS() {
      if (initializedRef.current || !containerRef.current || !window.google?.accounts?.id) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(containerRef.current!, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        // Renders at full container width
        width: containerRef.current!.offsetWidth || 400,
      });
    }

    // If GIS already loaded (e.g. navigating back to this page)
    if (window.google?.accounts?.id) {
      initGIS();
      return;
    }

    // Dynamically load the GIS script once per page
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGIS;
      document.head.appendChild(script);
    } else {
      // Script tag exists but hasn't loaded yet — poll briefly
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGIS();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      initializedRef.current = false;
    };
  }, [onCredential]);

  // If no client ID is configured — show a clear message instead of a broken button
  if (!CLIENT_ID) {
    return (
      <p className="text-[11px] text-center text-muted-foreground py-2 rounded-xl border border-dashed border-border px-3">
        Google Sign-In not configured.{" "}
        <span className="text-primary font-medium">Add VITE_GOOGLE_CLIENT_ID to .env</span>
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center overflow-hidden rounded-xl"
      style={{
        minHeight: 44,
        opacity: loading ? 0.5 : 1,
        pointerEvents: loading ? "none" : "auto",
        transition: "opacity 0.2s",
      }}
    />
  );
}
