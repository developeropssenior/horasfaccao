import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Controle de Ponto - Facção",
  description: "Sistema de controle de ponto e folha de pagamento para facção de costura",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Horas Facção",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1222",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          <PwaUpdatePrompt />
          <Toaster richColors position="bottom-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
