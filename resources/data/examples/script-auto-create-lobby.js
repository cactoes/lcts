class LCScript {
  // when the game launches
  async onUserConnect(user, lobby, config) {
    // your code goes here

    // set the users display rank to the saved rank in the config
    await lobby.create(400)
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby, config) {
    // your code goes here
    return true
  }
}