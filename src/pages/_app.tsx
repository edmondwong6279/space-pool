import type { AppProps } from 'next/app';
import '../styles/globals.scss';

function NextApp({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}

export default NextApp;
