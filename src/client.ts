import nodeFetch, {
  BodyInit as NodeBodyInit,
  Response as NodeResponse
} from 'node-fetch'
import { formBody, getFetchOptions, getNodeFetchOptions } from './lib'
import { ERROR_GQL_REQUEST, ERRORS_RECEIVED, GQLError } from './errors'

export interface GraphQLClientOptions {
  graphqlEndpoint: string
  token?: string
}

export type Variables = {
  [key: string]: number|string|boolean|File
}

export type GQLResult = {
  data?: any
  errors?: any[]
}

export class GraphQLClient {
  #token?: string

  #graphqlEndpoint: string

  /**
   * @param options.graphqlEndpoint - graphQl endpoint
   * @param options.token - bearer token for auth
   */
  constructor ({ graphqlEndpoint, token }: GraphQLClientOptions) {
    this.#graphqlEndpoint = graphqlEndpoint
    if (token) {
      this.#token = token
    }
  }

  setToken (value: string): this {
    this.#token = value
    return this
  }

  get token (): string|undefined {
    return this.#token
  }

  get graphqlEndpoint (): string {
    return this.#graphqlEndpoint
  }

  private async fetchRequest (body: BodyInit|NodeBodyInit): Promise<any> {
    let response!: Response|NodeResponse
    if (global.fetch !== undefined) {
      const options = getFetchOptions({
        body, token: this.#token
      } as { body: BodyInit, token: string })
      response = await global.fetch(this.#graphqlEndpoint, options)
    } else {
      const options = getNodeFetchOptions({
        body, token: this.#token
      } as { body: NodeBodyInit, token: string })
      response = await nodeFetch(this.#graphqlEndpoint, options)
    }
    if (!response.ok) {
      throw ERROR_GQL_REQUEST(response.statusText)
    }
    const result = await response.json() as GQLResult
    if (!result.data) {
      throw ERROR_GQL_REQUEST('No data received')
    }
    if (result.errors) {
      throw ERRORS_RECEIVED(result.errors)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.data
  }

  async request (query: string, variables: Variables): Promise<any> {
    try {
      const body = formBody(query, variables)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.fetchRequest(body)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    } catch (err) {
      if (err instanceof Error) {
        throw new GQLError(err.message, {
          query, variables
        }, err)
      }
      console.error(err)
      return undefined
    }
  }
}
