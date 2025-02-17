const TICKET_DATA = `query Ticket($ticketId: String!) {
  ticket(id: $ticketId) {
    eventId
    id
    listed: listings(where: {state_in: [LISTED]}) {
      items {
        state
            price
            deadline
      }
    }
    escrow: listings(where: {state_in: [PURCHASED]}) {
      items {
        state
            price
            deadline
      }
    }
    seat
        ticketSerialNumberHash
        tokenURI
        tokenMetadata
        owner {address}
  }
}`;

const ESCROW_DATA = `query Escrows($where: EscrowFilter) {
  escrows(where: $where) {
    items {
      buyer {
        address
      }
      eventId
      isDisputed
      isResolved
      seller {
        address
      }
    }
  }
}`

module.exports = { TICKET_DATA, ESCROW_DATA };
