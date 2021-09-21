import { RequestInit as NodeRequestInit, BodyInit as NodeBodyInit } from 'node-fetch'
import { FormData as NodeFormData } from 'formdata-polyfill/esm.min.js'
// import NodeFormData from 'form-data'
import { ERROR_GQL_NO_VARIABLE } from './errors'
import { Variables } from './client'

type FormDataPolyfill = typeof NodeFormData.prototype

type FileMap = {
  [key: string]: string[]
}

interface FetchOptionsInput<T extends BodyInit|NodeBodyInit> {
  body: T
  token?: string
}

const variableRegExMultiple = /(?<=\$)[^$]*(?=: ?\[Upload!?\])/g
const variableRegExSingle = /(?<=\$)[^$]*(?=: ?Upload)/g

/**
 * Forms the value of map key in multipart form data for multiple files upload
 * @param quantity - quantity of files
 */
export function formMap (quantity: number): string {
  const output:FileMap = {}
  for (let i = 0; i < quantity; i++) {
    output[String(i)] = [`variables.files.${i}`]
  }
  return JSON.stringify(output)
}

/**
 * Returns the FormData for single upload query
 * @param formData - instance of FormData
 * @param varName - name of file variable in query
 * @param variables - object contains variables of query
 */
export function getSingleFileFormData (
  formData: FormData|FormDataPolyfill, varName: string, variables: Variables
): BodyInit {
  const file = variables[varName]
  if (!file || !(file instanceof File)) {
    throw ERROR_GQL_NO_VARIABLE(varName)
  }
  formData.append('map', JSON.stringify({ 0: ['variables.file'] }))
  formData.append('0', file, file.name)
  return formData
}

/**
 * Returns the FormData for multiple upload query
 * @param formData - instance of FormData
 * @param varName - name of file array variable in query
 * @param variables - object contains variables of query
 */
export function getMultipleFilesFormData (
  formData: FormData|FormDataPolyfill, varName: string, variables: Variables
): BodyInit {
  const files = variables[varName]
  if (!files || !(files instanceof Array)) {
    throw ERROR_GQL_NO_VARIABLE(varName)
  }
  formData.append('map', formMap(files.length))
  files.forEach((file, index) => {
    if (!(file instanceof File)) {
      throw ERROR_GQL_NO_VARIABLE(varName)
    }
    formData.append(String(index), file, file.name)
  })
  return formData
}

/**
 * Forms the body for GraphQL request
 * @param query - query
 * @param variables - object contains variables of query
 * @returns body
 */
export function formBody (query: string, variables: Variables): BodyInit|NodeBodyInit {
  let ClientFormData
  if (global.fetch !== undefined) {
    ClientFormData = FormData
  } else {
    ClientFormData = NodeFormData
  }
  const body = new ClientFormData()
  const formDataVars = { variables, file: null }
  body.append('operations', JSON.stringify({ query, variables: formDataVars }))
  const multipleFiles = query.match(variableRegExMultiple)
  const singleFiles = query.match(variableRegExSingle)
  if (multipleFiles) {
    return getMultipleFilesFormData(body, multipleFiles[0], variables)
  }
  if (singleFiles) {
    return getSingleFileFormData(body, singleFiles[0], variables)
  }
  return JSON.stringify({ query, variables })
}

/**
 * Forms fetch options for browser
 * @param options
 * @param options.body - request body
 * @param options.token - auth token
 */
export function getFetchOptions ({ body, token }: FetchOptionsInput<BodyInit>): RequestInit {
  const options: RequestInit = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    mode: 'cors',
    body
  }

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  }
  return options
}

/**
 * Forms fetch options for server
 * @param options
 * @param options.body - request body
 * @param options.token - auth token
 */
// eslint-disable-next-line max-len
export function getNodeFetchOptions ({ body, token }: FetchOptionsInput<NodeBodyInit>): NodeRequestInit {
  const options: NodeRequestInit = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body
  }

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  }
  return options
}
