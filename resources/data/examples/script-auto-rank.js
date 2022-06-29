class LCScript {
  // when the game launches
  async onUserConnect(user, lobby, config) {
    // your code goes here

    // set the users display rank to the saved rank in the config
    await user.setRank(config.misc.rank.tier, config.misc.rank.rank)
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby, config) {
    // your code goes here
    return true
  }
}