import React, { type ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { inlineStyles } from "./inline-styles";

export const metadata = {
  title: "Digital Persona",
  description: "A warm, text-first digital persona experience.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      </head>
      <body>
        <Script
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
