import {
  SearXNGResult,
  SearXNGSearchResults,
  SearchResultItem
} from '@/lib/types'
import { Redis } from '@upstash/redis'
import { JSDOM } from 'jsdom'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const SEARXNG_MAX_RESULTS = Math.max(
  10,
  Math.min(100, parseInt(process.env.SEARXNG_MAX_RESULTS || '50', 10))
)

const CACHE_TTL = 3600 // Cache time-to-live in seconds (1 hour)

let redisClient: Redis | null = null

// Initialize Redis client based on environment variables
async function initializeRedisClient() {
  if (redisClient) return redisClient

  const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashRedisRestUrl && upstashRedisRestToken) {
    redisClient = new Redis({
      url: upstashRedisRestUrl,
      token: upstashRedisRestToken
    })
  }

  return redisClient
}

// Function to get cached results
async function getCachedResults(
  cacheKey: string
): Promise<SearXNGSearchResults | null> {
  try {
    const client = await initializeRedisClient()
    if (!client) return null

    const cachedData = await client.get(cacheKey)

    if (cachedData) {
      console.log(`Cache hit for key: ${cacheKey}`)
      return JSON.parse(cachedData as string)
    } else {
      console.log(`Cache miss for key: ${cacheKey}`)
      return null
    }
  } catch (error) {
    console.error('Redis cache error:', error)
    return null
  }
}

// Function to set cached results
async function setCachedResults(
  cacheKey: string,
  results: SearXNGSearchResults
): Promise<void> {
  try {
    const client = await initializeRedisClient()
    if (!client) return

    await client.set(cacheKey, JSON.stringify(results), { ex: CACHE_TTL })
    console.log(`Cached results for key: ${cacheKey}`)
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

export async function POST(request: Request) {
  const { query, maxResults, searchDepth, includeDomains, excludeDomains } =
    await request.json()

  const SEARXNG_DEFAULT_DEPTH = process.env.SEARXNG_DEFAULT_DEPTH || 'basic'

  try {
    const cacheKey = `search:${query}:${maxResults}:${searchDepth}:${
      Array.isArray(includeDomains) ? includeDomains.join(',') : ''
    }:${Array.isArray(excludeDomains) ? excludeDomains.join(',') : ''}`

    // Try to get cached results
    const cachedResults = await getCachedResults(cacheKey)
    if (cachedResults) {
      return NextResponse.json(cachedResults)
    }

    // If not cached, perform the search
    const results = await advancedSearchXNGSearch(
      query,
      Math.min(maxResults, SEARXNG_MAX_RESULTS),
      searchDepth || SEARXNG_DEFAULT_DEPTH,
      Array.isArray(includeDomains) ? includeDomains : [],
      Array.isArray(excludeDomains) ? excludeDomains : []
    )

    // Cache the results
    await setCachedResults(cacheKey, results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Advanced search error:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
        query: query,
        results: [],
        images: [],
        number_of_results: 0
      },
      { status: 500 }
    )
  }
}

async function advancedSearchXNGSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'advanced',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearXNGSearchResults> {
  const apiUrl = process.env.SEARXNG_API_URL
  if (!apiUrl) {
    throw new Error('SEARXNG_API_URL is not set in the environment variables')
  }

  const SEARXNG_ENGINES =
    process.env.SEARXNG_ENGINES || 'google,bing,duckduckgo,wikipedia'
  const SEARXNG_TIME_RANGE = process.env.SEARXNG_TIME_RANGE || 'None'
  const SEARXNG_SAFESEARCH = process.env.SEARXNG_SAFESEARCH || '0'
  const SEARXNG_CRAWL_MULTIPLIER = parseInt(
    process.env.SEARXNG_CRAWL_MULTIPLIER || '4',
    10
  )

  try {
    const url = new URL(`${apiUrl}/search`)
    url.searchParams.append('q', query)
    url.searchParams.append('format', 'json')
    url.searchParams.append('categories', 'general,images')

    if (SEARXNG_TIME_RANGE !== 'None') {
      url.searchParams.append('time_range', SEARXNG_TIME_RANGE)
    }

    url.searchParams.append('safesearch', SEARXNG_SAFESEARCH)
    url.searchParams.append('engines', SEARXNG_ENGINES)

    const resultsPerPage = 10
    const pageno = Math.ceil(maxResults / resultsPerPage)
    url.searchParams.append('pageno', String(pageno))

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid response structure from SearXNG')
    }

    let generalResults = data.results.filter(
      (result: SearXNGResult) => result && !result.img_src
    )

    // Apply domain filtering
    if (includeDomains.length > 0 || excludeDomains.length > 0) {
      generalResults = generalResults.filter(result => {
        const domain = new URL(result.url).hostname
        return (
          (includeDomains.length === 0 ||
            includeDomains.some(d => domain.includes(d))) &&
          (excludeDomains.length === 0 ||
            !excludeDomains.some(d => domain.includes(d)))
        )
      })
    }

    if (searchDepth === 'advanced') {
      const crawledResults = await Promise.all(
        generalResults
          .slice(0, maxResults * SEARXNG_CRAWL_MULTIPLIER)
          .map(result => crawlPage(result, query))
      )
      generalResults = crawledResults
        .filter(result => result !== null && isQualityContent(result.content))
        .map(result => result as SearXNGResult)
        .slice(0, maxResults)
    }

    return {
      results: generalResults.map(
        (result: SearXNGResult): SearchResultItem => ({
          title: result.title || '',
          url: result.url || '',
          content: result.content || ''
        })
      ),
      query: data.query || query,
      images: data.results
        .filter((result: SearXNGResult) => result && result.img_src)
        .slice(0, maxResults)
        .map((result: SearXNGResult) => {
          const imgSrc = result.img_src || ''
          return imgSrc.startsWith('http') ? imgSrc : `${apiUrl}${imgSrc}`
        }),
      number_of_results: data.number_of_results || generalResults.length
    }
  } catch (error) {
    console.error('SearchXNG API error:', error)
    return {
      results: [],
      query: query,
      images: [],
      number_of_results: 0
    }
  }
}

async function crawlPage(
  result: SearXNGResult,
  query: string
): Promise<SearXNGResult | null> {
  try {
    const response = await fetch(result.url)
    const html = await response.text()

    const dom = new JSDOM(html)
    const document = dom.window.document

    // Remove script and style elements
    document.querySelectorAll('script, style').forEach(el => el.remove())

    const mainContent = document.querySelector('main, article, .content, #content, body')

    if (mainContent) {
      const text = mainContent.textContent || ''
      result.content = text.slice(0, 10000)
    }

    return result
  } catch (error) {
    console.error(`Error crawling ${result.url}:`, error)
    return null
  }
}

function isQualityContent(text: string): boolean {
  if (!text) return false
  const words = text.split(/\s+/).length
  const sentences = text.split(/[.!?]+/).length
  const avgWordsPerSentence = words / sentences

  return (
    words > 50 &&
    sentences > 3 &&
    avgWordsPerSentence > 5 &&
    avgWordsPerSentence < 30
  )
}
