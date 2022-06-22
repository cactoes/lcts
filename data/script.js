class LCScript {
  // when the game launches
  async onUserConnect(user, lobby) {
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby) {
    return true
  }
}