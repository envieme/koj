import { tool } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import Exa from 'exa-js'
import { searchSchema } from '@/lib/schema/search'
import { SearchSection } from '@/components/search-section'
import { ToolProps } from '.'

export const searchTool = ({ uiStream, fullResponse }: ToolProps) => tool({
  description: 'Search the web for information',
  parameters: searchSchema,
  execute: async ({
    query,
    max_results,
    search_depth,
    include_domains,
    exclude_domains
  }) => {
    let hasError = false
    // Append the search section
    const streamResults = createStreamableValue<string>()
    uiStream.update(
      <SearchSection
        result={streamResults.value}
        includeDomains={include_domains}
      />
    )

    // Tavily API requires a minimum of 5 characters in the query
    const filledQuery =
      query.length < 5 ? query + ' '.repeat(5 - query.length) : query
    let searchResult
    const searchAPI: 'tavily' | 'exa' = 'tavily'
    try {
      searchResult =
        searchAPI === 'tavily'
          ? await tavilySearch(
              filledQuery,
              max_results,
              search_depth,
              include_domains,
              exclude_domains
            )
          : await exaSearch(query)
    } catch (error) {
      console.error('Search API error:', error)
      hasError = true
    }

    if (hasError) {
      fullResponse = `An error occurred while searching for "${query}.`
      uiStream.update(null)
      streamResults.done()
      return searchResult
    }

    streamResults.done(JSON.stringify(searchResult))

    return searchResult
  }
})

  async function tavilySearch(
    query: string,
    maxResults: number = 10,
    searchDepth: 'basic' | 'advanced' = 'basic',
    excludeDomains: string[] = [],
    includeDomains: string[] = [
      'nytimes.com',
      'wsj.com',
      'washingtonpost.com',
      'axios.com',
      'cnn.com',
      'nbcnews.com',
      'usatoday.com',
      'forbes.com',
      'abcnews.go.com',
      'reuters.com',
      'ndtv.com',
      'timesofindia.indiatimes.com',
      'thehindu.com',
      'hindustantimes.com',
      'indiatoday.in',
      'economicstimes.indiatimes.com',
      'business-standard.com',
      'firstpost.com',
      'scroll.in',
      'firstpost.com',
      'bbc.com',
      'ft.com',
      'wsj.com',
      'mint.com',
      'zerohedge.com'
    ]
  ): Promise<any> {
    const apiKey = process.env.TAVILY_API_KEY;
  
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults < 5 ? 5 : maxResults,
        search_depth: searchDepth,
        topic: 'general',
        include_images: true,
        include_answer: true,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        use_cache: true // Assuming you want to use cache by default
      })
    });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }

  const data = await response.json()
  return data
}

async function exaSearch(
  query: string,
  maxResults: number = 10,
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<any> {
  const apiKey = process.env.EXA_API_KEY
  const exa = new Exa(apiKey)
  return exa.searchAndContents(query, {
    highlights: true,
    numResults: maxResults,
    includeDomains,
    excludeDomains
  })
}
