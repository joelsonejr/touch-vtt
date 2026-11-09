class FoundryModules {
  isActive(key: string): boolean {
    const module = game.modules!.get(key)
    return module != null && module.active
  }
}

export default new FoundryModules()
