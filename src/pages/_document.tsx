import Document, { Html, Head, Main, NextScript } from 'next/document';
import React from 'react';

export default class extends Document {
	render() {
		return (
			<Html lang="en">
				<Head>
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
