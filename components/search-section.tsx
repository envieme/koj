'use client'

import { SearchResults } from './search-results'
import { SearchSkeleton } from './search-skeleton'
import { SearchResultsImageSection } from './search-results-image'
import { Section } from './section'
import { ToolBadge } from './tool-badge'
import type { SearchResults as TypeSearchResults } from '@/lib/types'
import { StreamableValue, useStreamableValue } from 'ai/rsc'

export type SearchSectionProps = {
  result?: StreamableValue<string>
  includeDomains?: string[]
}

export function SearchSection({ result, includeDomains }: SearchSectionProps) {
  const [data, error, pending] = useStreamableValue(result)
  const searchResults: TypeSearchResults = data ? JSON.parse(data) : undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  return (
    <div>
      {!pending && data ? (
        <>
          <Section size="sm" className="pt-2 pb-0">
            <ToolBadge tool="search">{`${searchResults.query}${includeDomainsString}`}</ToolBadge>
          </Section>
          {searchResults.images && searchResults.images.length > 0 && (
            <Section title="Images">
              <SearchResultsImageSection
                images={searchResults.images}
                query={searchResults.query}
              />
            </Section>
          )}
          <Section title="Sources">
            <SearchResults results={searchResults.results} />
          </Section>
          {/* Insert AdSense script after Sources section */}
          <Section>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1753126371326468"
                    crossorigin="anonymous"></script>
            <ins className="adsbygoogle"
                 style={{ display: 'block', textAlign: 'center' }}
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-sdsd"
                 data-ad-slot="23232"></ins>
            <script dangerouslySetInnerHTML={{ __html: `
              (adsbygoogle = window.adsbygoogle || []).push({});
            ` }} />
          </Section>
        </>
      ) : (
        <Section className="pt-2 pb-0">
          <SearchSkeleton />
        </Section>
      )}
    </div>
  )
}
