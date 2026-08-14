import Document, { Head, Html, Main, NextScript } from 'next/document';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-src 'none'",
].join('; ');

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="tr">
        <Head>
          <meta httpEquiv="Content-Security-Policy" content={CSP} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
