import { FC, ReactElement, useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import HamburgerMenu from './HamburgerMenu'
import dynamic from 'next/dynamic'
import { paths } from '@reservoir0x/client-sdk'
import setParams from 'lib/params'
import NavbarLogo from 'components/navbar/NavbarLogo'
import ThemeSwitcher from './ThemeSwitcher'

const SearchCollections = dynamic(() => import('./SearchCollections'))
const CommunityDropdown = dynamic(() => import('./CommunityDropdown'))
const EXTERNAL_LINKS = process.env.NEXT_PUBLIC_EXTERNAL_LINKS || null
const COLLECTION = process.env.NEXT_PUBLIC_COLLECTION
const COMMUNITY = process.env.NEXT_PUBLIC_COMMUNITY
const COLLECTION_SET_ID = process.env.NEXT_PUBLIC_COLLECTION_SET_ID
const DEFAULT_TO_SEARCH = process.env.NEXT_PUBLIC_DEFAULT_TO_SEARCH

function getInitialSearchHref() {
  const PROXY_API_BASE = process.env.NEXT_PUBLIC_PROXY_API_BASE
  const pathname = `${PROXY_API_BASE}/search/collections/v1`
  const query: paths['/search/collections/v1']['get']['parameters']['query'] =
    {}

  if (COLLECTION_SET_ID) {
    query.collectionsSetId = COLLECTION_SET_ID
  } else {
    if (COMMUNITY) query.community = COMMUNITY
  }

  return setParams(pathname, query)
}

const Navbar: FC = () => {
  const [showLinks, setShowLinks] = useState(true)
  const [filterComponent, setFilterComponent] = useState<ReactElement | null>(
    null
  )

  const externalLinks: { name: string; url: string }[] = []

  if (typeof EXTERNAL_LINKS === 'string') {
    const linksArray = EXTERNAL_LINKS.split(',')

    linksArray.forEach((link) => {
      let values = link.split('::')
      externalLinks.push({
        name: values[0],
        url: values[1],
      })
    })
  }

  const isGlobal = !COMMUNITY && !COLLECTION && !COLLECTION_SET_ID
  const filterableCollection = isGlobal || COMMUNITY || COLLECTION_SET_ID

  useEffect(() => {
    setShowLinks(externalLinks.length > 0)
  }, [])

  useEffect(() => {
    if (filterableCollection) {
      // const href = getInitialSearchHref()
      const href = `https://api.smartnftsearch.xyz/search/nft-autocomplete?search_query=&search_types=name_autocomplete,individual_attributes,token_search,individual_attributes,attribute_search`

      const fetchOptions = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': '82cadfbf7d1a9da976e91655ada741a2',
          'Content-Type': 'application/json'
        }
      };

      fetch(href, fetchOptions).then(async (res) => {
        let initialResults = undefined



        if (res.ok) {
          initialResults =
            (await res.json()) as WatApiAutocompleteResponse

        }


        setShowLinks(false)
        setFilterComponent(
          <SearchCollections
            communityId={COMMUNITY}
            initialResults={initialResults}
          />
        )

        // const smallCommunity =
        //   initialResults?.collections &&
        //   initialResults.collections.length >= 2 &&
        //   initialResults.collections.length <= 10
        // if (
        //   !DEFAULT_TO_SEARCH &&
        //   (COMMUNITY || COLLECTION_SET_ID) &&
        //   smallCommunity
        // ) {
        //   setFilterComponent(
        //     <CommunityDropdown
        //       collections={initialResults?.collections}
        //       defaultCollectionId={COLLECTION}
        //     />
        //   )
        // } else {
        //   setShowLinks(false)
        //   setFilterComponent(
        //     <SearchCollections
        //       communityId={COMMUNITY}
        //       initialResults={initialResults}
        //     />
        //   )
        // }
      })
    }
  }, [filterableCollection])

  return (
    <nav className="relative flex items-center justify-between gap-2 px-6 py-4 col-span-full md:gap-3 md:py-6 md:px-16">
      <NavbarLogo className="z-10 max-w-[300px]" />
      {showLinks && (
        <div className="z-10 items-center hidden ml-12 gap-11 lg:flex">
          {externalLinks.map(({ name, url }) => (
            <a
              key={url}
              href={url}
              rel="noopener noreferrer"
              target="_blank"
              className="text-dark reservoir-h6 hover:text-[#1F2937] dark:text-white"
            >
              {name}
            </a>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center w-full h-full">
        <div className="absolute left-0 z-[1] flex w-full justify-center">
          {filterComponent && filterComponent}
        </div>
      </div>
      <HamburgerMenu externalLinks={externalLinks} />
      <div className="z-10 hidden ml-auto shrink-0 md:flex md:gap-2">
        <ConnectWallet />
        <ThemeSwitcher />
      </div>
    </nav>
  )
}

export default Navbar
