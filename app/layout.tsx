export const metadata = {
  title: 'Slot Machine',
  description: 'Dummy game slot modern UI',
};

import './styles/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}