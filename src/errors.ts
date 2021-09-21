export const ERROR_GQL_REQUEST = (msg: string): Error => new Error(`Error graphQl request: ${msg}`)
export const INVALID_GQL_REQUEST = (): Error => new Error('Error graphQl request')
// eslint-disable-next-line max-len
export const ERROR_GQL_NO_VARIABLE = (name: string): Error => new Error(`No ${name} proper variable found in variables.`)

export class GQLError extends Error {
  detail?: any

  originError?: Error|GQLError

  constructor (message: string, detail?: any, originError?: Error|GQLError) {
    super(message)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.detail = detail
    this.originError = originError
  }
}

export const ERRORS_RECEIVED = (errors: any[]): GQLError => new GQLError('Received errors.', errors)
