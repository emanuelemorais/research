import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/ProviderPrivy";
import { Toaster } from "@/components/ui/sonner"
import ClarityInit from "@/components/Clarity"
import FloatingInstructionsButton from "@/components/FloatingInstructions";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeFi Platform",
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="null" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        translate="no"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Bloquear Google Translate completamente
              (function() {
                // Remover elementos do Google Translate se aparecerem
                function removeGoogleTranslate() {
                  const elements = [
                    document.getElementById('google_translate_element'),
                    document.querySelector('.skiptranslate'),
                    document.querySelector('[id*="google_translate"]'),
                    document.querySelector('[class*="skiptranslate"]'),
                  ];
                  elements.forEach(el => {
                    if (el) {
                      try {
                        el.remove();
                      } catch(e) {}
                    }
                  });
                }
                
                // Remover imediatamente
                removeGoogleTranslate();
                
                // Observar e remover continuamente
                const observer = new MutationObserver(() => {
                  removeGoogleTranslate();
                });
                
                if (document.body) {
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                }
                
                // Também remover do documentElement
                if (document.documentElement) {
                  document.documentElement.setAttribute('translate', 'no');
                  document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
                }
                
                // Prevenir que o Google Translate modifique o DOM
                const originalAppendChild = Node.prototype.appendChild;
                Node.prototype.appendChild = function(child) {
                  if (child && (
                    child.id && child.id.includes('google_translate')
                  )) {
                    return child;
                  }
                  return originalAppendChild.call(this, child);
                };
                
                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (newNode && (
                    newNode.id && newNode.id.includes('google_translate') ||
                    newNode.className && newNode.className.includes('skiptranslate')
                  )) {
                    return newNode;
                  }
                  return originalInsertBefore.call(this, newNode, referenceNode);
                };
              })();
            `,
          }}
        />
        <ClarityInit />
        <Toaster richColors position="top-right" />
        <Providers> 
          {children} 
        </Providers>
        <FloatingInstructionsButton />
      </body>
    </html>
  );
}
