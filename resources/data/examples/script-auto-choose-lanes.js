class LCScript {
  // when the game launches
  async onUserConnect(user, lobby, config) {
    // your code goes here
    return true
  }

  // when user joins a party
  async onPartyJoin(user, lobby, config) {
    // your code goes here
    // when the user join a party/lobby automatically choose our lanes
    await lobby.setLanes("MIDDLE", "BOTTOM")
    return true
  }
}