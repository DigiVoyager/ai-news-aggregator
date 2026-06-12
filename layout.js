export const metadata = {
  title: 'AI News Feed',
  description: 'Live AI news aggregator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafaf9', color: '#1a1a1a' }}>
        {children}
      </body>
    </html>
  );
}
