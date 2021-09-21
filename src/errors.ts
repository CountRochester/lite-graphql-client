export const ERROR_GQL_REQUEST = (msg: string): Error => new Error(`Error graphQl request: ${msg}`)
export const INVALID_GQL_REQUEST = (): Error => new Error('Error graphQl request')
// eslint-disable-next-line max-len
export const ERROR_GQL_NO_VARIABLE = (name: string): Error => new Error(`No ${name} proper variable found in variables.`)
