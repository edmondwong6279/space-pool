import type { GetServerSidePropsContext } from 'next';

const Okay = () => null;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	ctx.res.statusCode = 200;
	ctx.res.end('OK');

	return {
		props: {},
	};
}

export default Okay;
