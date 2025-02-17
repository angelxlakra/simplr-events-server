const getSubgraphUrl = (network) => {
	switch (network) {
		case 'base':
			return 'https://indexer-base-mainnet-production.up.railway.app';
		case 'arbitrum':
			return 'https://mainnet-simplr-events-indexer.up.railway.app';
		case 'arbitrumSepolia':
			return 'simplr-events-indexer-production.up.railway.app';
		default:
			return '';
	}
};

module.exports =  {getSubgraphUrl}
