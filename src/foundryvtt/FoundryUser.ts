class FoundryUser {
  get isGm(): boolean {
    return this.raw.isGM
  }

  get raw() {
    return game.user!
  }
}

export default new FoundryUser()
