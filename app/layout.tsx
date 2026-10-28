import type { Metadata } from "next";
import "./globals.css";
import "./bestiary.css";
import "./gaeria.css";
import "./vampire.css";
import "./ignaria.css";
import "./skills.css";
import "./inventory.css";
import "./corrupted-form.css";
import "./noble-dossiers.css";
import "./table-play.css";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Karmalização — Arquivo do Mundo",
    template: "%s | Karmalização",
  },
  description:
    "Livro de regras completo e criação de personagens para o sistema Karmalização.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">
        {children}
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
