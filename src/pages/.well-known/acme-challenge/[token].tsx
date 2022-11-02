import type { GetServerSidePropsContext } from 'next';

const TokenChallenge = () => null;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const ACME_CHALLENGES = {
		[process.env.ACME_TOKEN]: process.env.ACME_KEY,
	};

	const { token } = ctx.params;

	const key = ACME_CHALLENGES[token as string];
	if (key) {
		ctx.res.end(key);
	} else {
		ctx.res.statusCode = 404;
		ctx.res.end('NOT FOUND');
	}

	return {
		props: {},
	};
}

export default TokenChallenge;
