const HOME_LISTINGS = `query User($userId: String!) {
  user(id: $userId) {
    ticketsOwned {
      items {
        id
        eventId
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
      }
    }
  }
  listed: listings(where: {state_in: [LISTED]}) {
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
    escrows(where: {OR: [{sellerId_contains: $userId}, {buyerId_contains: $userId}] AND: [ {
     isResolved: false
  }]}) {
    items {
      buyer {
        address
      }
      seller {
        address
      }
      eventId
      fundsLocked
      isDisputed
      isResolved
      ticket {
        seat
        ticketSerialNumberHash
        tokenMetadata
        tokenURI
        listings {
          items {
            price
          }
        }
        id
      }
    }
  }
}`

module.exports = { HOME_LISTINGS };
