import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fênix PDF - Ferramenta Interna de Edição',
  description: 'Aplicação web interna para os Correios, projetada para centralizar e simplificar a manipulação de arquivos PDF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}