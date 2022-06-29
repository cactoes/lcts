class LCScript {
  // when the game launches
  async onUserConnect(user, lobby, config) {
    // your code goes here

    // set the user status to the saved config status when we connect with the client
    await user.setStatus(config.misc.status)
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby, config) {
    // your code goes here
    return true
  }
}