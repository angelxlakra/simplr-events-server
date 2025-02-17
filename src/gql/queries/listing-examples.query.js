const EXAMPLE_LISTINGS = `query Listings {
  listings(where: { state_in: [LISTED] }, orderBy: "price", orderDirection: "asc") {
    items {
      price
      ticketId
    }
  }
}`;

const EXAMPLE_DATA = `query Listings($where: ListingFilter) {
  listings(where: $where, orderBy: "price", orderDirection: "asc") {
    items {
      id
      price
      seller {
        address
      }
      state
      eventId
      deadline
      buyerId
      ticket {
        id
        seat
        tokenMetadata
        ticketSerialNumberHash
        tokenURI
      }
    }
  }
}`;

module.exports = { EXAMPLE_LISTINGS, EXAMPLE_DATA };
