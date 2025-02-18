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
				userId: `user-${account ?? "0x"}`,
			},
		});

		const tickets = [
			...(gql_response?.data?.data?.user?.ticketsOwned?.items ?? []),
			...(gql_response?.data?.data?.listed?.items ?? []),
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

			const escrow_tickets = (gql_response?.data?.data?.escrows?.items ?? []).map(
				(escrow) => ({
					_id: escrow.ticket.id,
					event: escrow.eventId.split('-')[1].toLowerCase(),
					tokenId: escrow.ticket.tokenMetadata.tokenId || '',
					seat: escrow.ticket.seat || '',
					price: escrow.ticket.listings.items[0].price,
					deadline: escrow.ticket.listings.items[0].deadline,
				})
			);

			userTickets.escrow = [...escrow_tickets];

			user_tickets.forEach((ticket) => {
				const isListed = !!ticket.listed.items[0];
				const isEscrow = !!ticket.escrow.items[0];

				if (isListed) {
					userTickets.selling.push({
						_id: ticket.id,
						event: ticket.eventId.split('-')[1].toLowerCase(),
						// orderNumber: ticket.orderNumber || '',
						tokenId: ticket.tokenMetadata.tokenId || '',
						seat: ticket.seat || '',
						price: ticket.listed.items[0].price,
						deadline: ticket.listed.items[0].deadline,
					});
					return;
				}
				if (isEscrow) {
					userTickets.escrow.push({
						_id: ticket.id,
						event: ticket.eventId.split('-')[1].toLowerCase(),
						// orderNumber: ticket.orderNumber || '',
						tokenId: ticket.tokenMetadata.tokenId || '',
						seat: ticket.seat || '',
						price: ticket.escrow.items[0].price,
						deadline: ticket.escrow.items[0].deadline,
					});
					return;
				}
				userTickets.owned.push({
					_id: ticket.id,
					event: ticket.eventId.split('-')[1].toLowerCase(),
					// orderNumber: ticket.orderNumber || '',
					tokenId: ticket.tokenMetadata.tokenId || '',
					seat: ticket.seat || '',
					price: 'N/A',
					deadline: '',
				});
			});
		}

		const marketplaceTickets = {};

		const listedTickets = gql_response.data.data.listed.items ?? [];

		listedTickets.forEach((listing) => {
			if (
				!marketplaceTickets[listing.eventId.split('-')[1].toLowerCase()]
			) {
				marketplaceTickets[
					listing.eventId.split('-')[1].toLowerCase()
				] = [];
			}
			if (
				listing.seller.address.toLowerCase() === account.toLowerCase()
			) {
				return;
			}
			marketplaceTickets[
				listing.eventId.split('-')[1].toLowerCase()
			].push({
				_id: listing.ticket.id,
				event: listing.eventId.split('-')[1].toLowerCase(),
				// orderNumber: ticket.orderNumber || '',
				tokenId: listing.ticket.tokenMetadata.tokenId || '',
				seat: listing.ticket.seat || '',
				price: listing.price,
				deadline: listing.deadline,
			});
		});

		res.json({
			userTickets,
			marketplaceTickets,
			eventMap,
		});
	} catch (error) {
		console.log({ error });
		res.status(500).json({
			message: 'Error fetching user tickets',
			error: error.message,
		});
	}
});

module.exports = router;
