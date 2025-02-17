const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const router = express.Router();


router.post("/create", async (req, res) => {
  try {
    const data = req.body;

    // Input validation
    if (!data.price || !data.ticketId || !data.seller || !data.signature) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // {
    //   seller: account.address,
    //   ticketId: ticket._id,
    //   signature,
    // }

    const foundUser = await User.findOne({ address: data.seller });

    const listing = new Listing({
      ticketId: data.ticketId,
      userId: foundUser._id,
      price: data.price,
      signature: data.signature,
    })

    const savedListing = await listing.save();
		res.status(201).json(savedListing);
  } catch (err) {
    console.log({ error });
    res.status(500).json({
      message: "Error creating listing",
      error: error.message,
    });
  }
})

module.exports = router
