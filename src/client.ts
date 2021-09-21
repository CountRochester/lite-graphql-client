import nodeFetch, {
  BodyInit as NodeBodyInit,
  Response as NodeResponse
} from 'node-fetch'
import { formBody, getFetchOptions, getNodeFetchOptions } from './lib'
import { ERROR_GQL_REQUEST } from './errors'

export interface GraphQLClientOptions {
  graphqlEndpoint: string
  token?: string
}

export type Variables = {
  [key: string]: number|string|boolean|File
}

export class GraphQLClient {
  #token?: string

  #graphqlEndpoint: string

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
    // let fetch
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
    try {
      if (!response.ok) {
        throw ERROR_GQL_REQUEST(response.statusText)
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await response.json()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  async request (query: string, variables: Variables): Promise<any> {
    const body = formBody(query, variables)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.fetchRequest(body)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result
  }
}
