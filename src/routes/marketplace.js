const express = require('express');
const { get } = require('mongoose');
const { getSubgraphUrl } = require('../utils/subgraph');
const { HOME_LISTINGS } = require('../gql/queries/home-listings.query.js');
const { default: axios } = require('axios');
const User = require('../models/User');
const Event = require('../models/Event');

const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const account = req.query.account;
		const network = req.query.network;
		let userTickets = {
			owned: [],
			escrow: [],
			selling: [],
		};

		const subgraphUrl = getSubgraphUrl(network);

		const gql_response = await axios.post(subgraphUrl, {
			query: HOME_LISTINGS,
			variables: {
				userId: `user-${account ?? '0x'}`,
			},
		});

		const tickets = [
			...(gql_response?.data?.data?.user?.ticketsOwned?.items ?? []),
			...(gql_response?.data?.data?.listed?.items ?? []),
			...(gql_response?.data?.data?.escrows?.items ?? []),
		];

		// Extract eventIds from tickets
		const eventIds = tickets.map((ticket) => ticket.eventId.split('-')[1]);

		// Fetch events from database with case-insensitive search
		const events = await Event.find({
			contractAddress: {
				$in: eventIds.map((id) => new RegExp(`^${id}$`, 'i')),
			},
		});

		// Create a map for quick event lookup (convert to lowercase for comparison)
		const eventMap = events.reduce((acc, event) => {
			acc[event.contractAddress.toLowerCase()] = event;
			return acc;
		}, {});

		if (!!account) {
			const user_tickets =
				gql_response?.data?.data?.user?.ticketsOwned?.items ?? [];

			const escrow_tickets = (
				gql_response?.data?.data?.escrows?.items ?? []
			).map((escrow) => ({
				ticket: {
					_id: escrow.ticket.id,
					event: escrow.eventId.split('-')[1].toLowerCase(),
					tokenId: escrow.ticket.tokenMetadata.tokenId || '',
					seat: escrow.ticket.seat,
				},
				price: escrow.ticket?.listings?.items[0].price,
				signature: '',
			}));

			userTickets.escrow = [...escrow_tickets];

			user_tickets.forEach((ticket) => {
				const isListed = !!ticket?.listed?.items[0];

				if (isListed) {
					userTickets.selling.push({
						ticket: {
							_id: ticket.id,
							event: ticket.eventId.split('-')[1].toLowerCase(),
							tokenId: ticket.tokenMetadata.tokenId || '',
							seat: ticket.seat,
						},
						price: ticket?.listed?.items[0].price,
						signature: '',
					});
					return;
				}
				userTickets.owned.push({
					ticket: {
						_id: ticket.id,
						event: ticket.eventId.split('-')[1].toLowerCase(),
						tokenId: ticket.tokenMetadata.tokenId || '',
						seat: ticket.seat,
					},
					price: 'N/A',
					signature: '',
				});
			});
		}

		const marketplaceTickets = {};

		const listedTickets = gql_response.data.data.listed.items ?? [];

		listedTickets.forEach((listing) => {
			if (
				listing.seller.address.toLowerCase() === account.toLowerCase()
			) {
				return;
			}
			if (
				!marketplaceTickets[listing.eventId.split('-')[1].toLowerCase()]
			) {
				marketplaceTickets[
					listing.eventId.split('-')[1].toLowerCase()
				] = [];
			}
			marketplaceTickets[
				listing.eventId.split('-')[1].toLowerCase()
			].push({
				ticket: {
					_id: listing.ticket.id,
					event: listing.eventId.split('-')[1].toLowerCase(),
					tokenId: listing.ticket.tokenMetadata.tockenId,
					seat: listing.ticket.seat,
				},
				price: listing.price,
				signature: '',
			});
    });

    console.log(JSON.stringify({
			userTickets,
			marketplaceTickets,
			eventMap,
		}));


    res.json(JSON.stringify({
        userTickets,
        marketplaceTickets,
        eventMap,
    }));
	} catch (error) {
		console.log({ error });
		res.status(500).json({
			message: 'Error fetching user tickets',
			error: error.message,
		});
	}
});

module.exports = router;
