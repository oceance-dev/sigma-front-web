let _stepUpToken: string | null = null

export const stepUpStore = {
  get: () => _stepUpToken,
  set: (token: string | null) => { _stepUpToken = token },
  clear: () => { _stepUpToken = null },
}
