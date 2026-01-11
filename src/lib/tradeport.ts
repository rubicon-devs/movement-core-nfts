import { CollectionMetadata } from '@/types'

const TRADEPORT_GRAPHQL_API = 'https://api.indexer.xyz/graphql'

// Movement uses 8 decimals for MOVE token
const MOVE_DECIMALS = 8
const MOVE_DIVISOR = Math.pow(10, MOVE_DECIMALS)

interface GraphQLResponse {
  data?: {
    movement?: {
      collections?: Array<{
        id?: string
        slug?: string
        title?: string
        description?: string
        cover_url?: string
        floor?: number
        volume?: number
        supply?: number
        verified?: boolean
        twitter?: string
        discord?: string
        website?: string
      }>
    }
  }
  errors?: Array<{ message: string }>
}

export interface CollectionValidation {
  exists: boolean
  verified: boolean
  metadata: CollectionMetadata | null
}

export async function fetchCollectionMetadata(contractAddress: string): Promise<CollectionMetadata | null> {
  const validation = await validateAndFetchCollection(contractAddress)
  return validation.metadata
}

export async function validateAndFetchCollection(contractAddress: string): Promise<CollectionValidation> {
  const apiKey = process.env.TRADEPORT_API_KEY
  const apiUser = process.env.TRADEPORT_API_USER

  const defaultResult: CollectionValidation = {
    exists: false,
    verified: false,
    metadata: null
  }

  if (!apiKey || !apiUser) {
    console.warn('TRADEPORT_API_KEY or TRADEPORT_API_USER not configured')
    return defaultResult
  }

  try {
    // GraphQL query to fetch collection by contract address (slug)
    const query = `
      query fetchCollectionByAddress($address: String!) {
        movement {
          collections(where: { slug: { _eq: $address } }) {
            id
            slug
            title
            description
            cover_url
            floor
            volume
            supply
            verified
            twitter
            discord
            website
          }
        }
      }
    `

    const variables = {
      address: contractAddress.toLowerCase()
    }

    console.log(`Querying Tradeport GraphQL API for collection: ${contractAddress}`)

    const response = await fetch(TRADEPORT_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-api-user': apiUser
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store'
    })

    const result: GraphQLResponse = await response.json()
    
    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors)
      return defaultResult
    }

    const collections = result.data?.movement?.collections
    
    if (!collections || collections.length === 0) {
      console.log(`No collection found for address: ${contractAddress}`)
      return defaultResult
    }

    const collection = collections[0]
    
    // Convert from smallest units to MOVE and round to nearest whole number
    const floorPrice = collection.floor ? Math.round(collection.floor / MOVE_DIVISOR) : null
    const volume = collection.volume ? Math.round(collection.volume / MOVE_DIVISOR) : null

    console.log(`Found collection: ${collection.title} | Verified: ${collection.verified} | Floor: ${floorPrice} MOVE`)

    const metadata: CollectionMetadata = {
      contractAddress,
      name: collection.title || `Collection ${contractAddress.slice(0, 8)}...`,
      imageUrl: collection.cover_url || null,
      description: collection.description || null,
      twitterUrl: collection.twitter 
        ? (collection.twitter.startsWith('http') ? collection.twitter : `https://twitter.com/${collection.twitter.replace('@', '')}`)
        : null,
      tradeportUrl: `https://tradeport.xyz/movement/collection/${contractAddress}`,
      floorPrice,
      volume
    }

    return {
      exists: true,
      verified: collection.verified === true,
      metadata
    }
  } catch (error) {
    console.error('Error fetching from Tradeport GraphQL:', error)
    return defaultResult
  }
}

export async function validateContractAddress(contractAddress: string): Promise<boolean> {
  if (!contractAddress) return false
  
  // Movement uses 0x prefixed addresses (can be 40-66 hex chars after 0x)
  const hexRegex = /^0x[a-fA-F0-9]{40,64}$/
  
  if (!hexRegex.test(contractAddress)) {
    console.log(`Invalid address format: ${contractAddress}`)
    return false
  }

  return true
}

export function isTradeportConfigured(): boolean {
  return Boolean(process.env.TRADEPORT_API_KEY && process.env.TRADEPORT_API_USER)
}