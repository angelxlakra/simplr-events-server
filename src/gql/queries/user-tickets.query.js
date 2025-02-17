const USER_TICKETS_QUERY = `
	query User($userId: String!) {
		user(id: $userId) {
			address
			ticketsOwned {
				items {
					eventId
					id
					seat
					ticketSerialNumberHash
					tokenMetadata
					tokenURI
				}
			}
		}
	}
`;

module.exports = { USER_TICKETS_QUERY };
