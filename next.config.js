require('dotenv').config();

const nextConfig = {
	webpack: (config, options) => {
		// add src directory to modules resolution so we can use absolute imports
		config.resolve.modules = [...config.resolve.modules, './src'];

		return config;
	},
	publicRuntimeConfig: {
		// add any public environment variables here
		GTM_ID: process.env.GTM_ID,
	},
};

module.exports = nextConfig;