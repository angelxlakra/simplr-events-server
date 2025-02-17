const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { getSubgraphUrl } = require('../utils/subgraph');
const { default: axios } = require('axios');
const { TICKET_DATA, ESCROW_DATA } = require('../gql/queries/ticket.query');
const Event = require('../models/Event');
const Email = require('../models/Email');
const { EmailService } = require('../services/EmailService');
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
				},
			},
    });

    console.log({ticket: ticket_response.data, escrow: escrow_response.data});


		const escrow = escrow_response.data.data.escrows.items[0];

		const listing = await Listing.findOne({ ticketId });

		const event = await Event.findOne({
			contractAddress:
				ticket_response.data.data?.ticket.eventId.split('-')[1],
		});
		const ticket = ticket_response.data.data?.ticket;

		res.json({
			order: {
				price: ticket?.listed?.items?.[0]?.price,
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
				seller: escrow?.seller?.address ?? '',
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

		const listing = await Listing.findOne({ ticketId: data.ticketId?.toLowerCase() });
		const event = await Event.findById(data.eventId);
		const email = await Email.findOne({ event: event._id });
    const seller = await User.findById(listing?.userId);
    const buyer = await User.findOne({ address: data.buyerAddress });

    console.log({email});


    // Variables for email template
    const variables = {
      sellerName: seller.name,
      tokenId: listing.ticketId.split('-')[2],
      buyerEmailId: buyer.email,
      buyerName: buyer.name,
      expiryHours: Number(data.expiryHours) ?? 48,
    }

    // Generate emailTemplate

    let htmlBody = email.bodyTemplateHtml;
    let stringBody = email.bodyTemplateText;
    email.requiredVariables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      const value = variables[variable]

      console.log({variable, value, regex});

      htmlBody = htmlBody.replace(regex, variables[variable]);

      stringBody = stringBody.replace(regex, variables[variable]);
    });


    const emailService = new EmailService();

    const result = await emailService.sendEmail(seller.email, email.subject, htmlBody, stringBody);


    res.json(result);

	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
