const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { getSubgraphUrl } = require('../utils/subgraph');
const { default: axios } = require('axios');
const { TICKET_DATA, ESCROW_DATA } = require('../gql/queries/ticket.query');
const Event = require('../models/Event');
const Email = require('../models/Email');
const { EmailService } = require('../services/EmailService');
const {
	EXAMPLE_LISTINGS,
	EXAMPLE_DATA,
} = require('../gql/queries/listing-examples.query');
const Ticket = require('../models/Ticket');
const router = express.Router();

router.post('/create', async (req, res) => {
	try {
		const data = req.body;

		// Input validation
		if (!data.price || !data.ticketId || !data.seller || !data.signature) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		// {
		//   seller: account.address,
		//   ticketId: ticket._id,
		//   signature,
		// }

		const foundUser = await User.findOne({ address: data.seller });

		const listing = new Listing({
			ticketId: data.ticketId.toLowerCase(),
			userId: foundUser._id,
			price: data.price,
			signature: data.signature,
		});

		const savedListing = await listing.save();
		res.status(201).json(savedListing);
	} catch (err) {
		console.log({ error });
		res.status(500).json({
			message: 'Error creating listing',
			error: error.message,
		});
	}
});

router.get('/examples', async (req, res) => {
	const network = req.query.network;
	const subgraph_url = getSubgraphUrl(network);

	const response = await axios.post(subgraph_url, {
		query: EXAMPLE_LISTINGS,
		variables: {},
	});

	const listings = response.data.data.listings.items;

	const highestPrice = listings[listings.length - 1];
	const lowestPrice = listings[0];
	const averagePrice = listings[Math.floor(listings.length / 2)];

  const listing_examples = [lowestPrice.ticketId, averagePrice.ticketId, highestPrice.ticketId];

	const examples_response = await axios.post(subgraph_url, {
		query: EXAMPLE_DATA,
		variables: { where: { ticketId_in: listing_examples, state_in: ["LISTED"] } },
	});

  const examples_list = examples_response.data.data.listings.items

  // Extract eventIds from tickets
  const eventIds = examples_list.map((ticket) => ticket.eventId.split('-')[1]);

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

    const examples = examples_list.map(example => {
    return ({
      price: example.price,
      signature: "",
      ticket: {
        _id: example.ticket.id,
        event: eventMap[example.eventId.split('-')[1].toLowerCase()],
        tokenId: example.ticket?.tokenMetadata.tokenId,
        seat: example.ticket?.seat,
      },
  })});

	res.json({
		examples
	});
});

router.get('/:ticketId', async (req, res) => {
	try {
		const ticketId = req.params.ticketId;
		const network = req.query.network;

		const subgraph_url = getSubgraphUrl(network);
		const ticket_response = await axios.post(subgraph_url, {
			query: TICKET_DATA,
			variables: { ticketId },
		});
		const escrow_response = await axios.post(subgraph_url, {
			query: ESCROW_DATA,
			variables: {
				where: {
          ticketId_contains: ticketId,
          isResolved: false
				},
			},
		});


		const escrow = escrow_response.data.data.escrows.items[0];

		const listing = await Listing.findOne({ ticketId });

		const event = await Event.findOne({
			contractAddress:
				ticket_response.data.data?.ticket.eventId.split('-')[1],
		});
		const ticket = ticket_response.data.data?.ticket;

    res.json({

			order: {
				price: listing.price,
				signature: listing?.signature,
				ticket: {
					_id: ticketId,
					event: event,
					tokenId: ticket?.tokenMetadata.tokenId,
					seat: ticket?.seat,
				},
			},
			escrow: {
				isEscrow: !!escrow,
				buyer: escrow?.buyer?.address ?? '',
				seller: escrow?.seller?.address ?? ticket.owner.address ?? '',
				isDisputed: escrow?.isDisputed ?? false,
				isResolved: escrow?.isResolved ?? false,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.post('/sold', async (req, res) => {
	try {
		const data = req.body;

		// Input validation
		if (!data.ticketId || !data.eventId || !data.buyerAddress) {
			return res.status(400).json({ message: 'All fields are required' });
		}
		//     "sellerName"
		// 1
		// "tokenId"
		// 2
		// "buyerEmailId"
		// 3
		// "buyerName"
		// 4
		// "expiryHours"

		const listing = await Listing.findOne({
			ticketId: data.ticketId?.toLowerCase(),
		});
		const event = await Event.findById(data.eventId);
		const email = await Email.findOne({ event: event._id });
		const seller = await User.findById(listing?.userId);
    const buyer = await User.findOne({ address: data.buyerAddress });
    const ticket = await Ticket.findOne({tokenId: data.ticketId.split("-")[2]})

		console.log({ email });

		// Variables for email template
		const variables = {
			sellerName: seller.name,
			tokenId: listing.ticketId.split('-')[2],
      buyerEmailId: buyer.email,
      sellerEmailId: seller.email,
			buyerName: buyer.name,
      expiryHours: Number(data.expiryHours) ?? 48,
      orderNumber: Number(ticket.orderNumber)
		};

		// Generate emailTemplate

		let htmlBody = email.bodyTemplateHtml;
		let stringBody = email.bodyTemplateText;
		email.requiredVariables.forEach((variable) => {
			const regex = new RegExp(`{{${variable}}}`, 'g');
			const value = variables[variable];

			console.log({ variable, value, regex });

			htmlBody = htmlBody.replace(regex, variables[variable]);

			stringBody = stringBody.replace(regex, variables[variable]);
		});

		const emailService = new EmailService();

		const result = await emailService.sendEmail(
			seller.email,
			email.subject,
			htmlBody,
			stringBody
		);

		res.json(result);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.post("/dispute", async (req, res) => {
  const data = req.body;

  // Validate
  if (!data.reason || !data.buyerId || !data.ticketId || !data.disputeFrom) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  try {
    const listing = await Listing.findOne({ ticketId: data.ticketId })
    listing.disputed = true;
    listing.disputeReason = data.reason;
    listing.disputeFrom = data.disputeFrom;
    const buyer = User.findOne({ address: data.buyerId });
    listing.buyerId = buyer._id;
    await listing.save();

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.post("/resolve", async (req, res) => {
  const data = req.body;

  // Validate
  if (!data.buyerId || !data.ticketId) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  try {
    const listing = await Listing.findOne({ ticketId: data.ticketId })
    listing.disputed = false;
    listing.isResolved = true;
    listing.disputeReason = "";
    const buyer = User.findOne({ address: data.buyerId });
    listing.buyerId = buyer._id;
    await listing.save();

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

module.exports = router;
