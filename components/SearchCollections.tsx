import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Downshift from 'downshift'
import { useRouter } from 'next/router'
import setParams from 'lib/params'
import debounce from 'lodash.debounce'
import { FiSearch, FiXCircle } from 'react-icons/fi'
import { paths } from '@reservoir0x/client-sdk/dist/types/api'
import logoWAT from 'public/logoWAT.png'



type SearchCollectionsAPISuccessResponse = WatApiAutocompleteResponse
// paths['/search/collections/v1']['get']['responses']['200']['schema'] | WatApiResponse

type Props = {
  communityId?: string
  initialResults?: SearchCollectionsAPISuccessResponse
}



const PROXY_API_BASE = process.env.NEXT_PUBLIC_PROXY_API_BASE

const SearchCollections: FC<Props> = ({ communityId, initialResults }) => {
  const router = useRouter()
  const [focused, setFocused] = useState<boolean>(false)
  const [results, setResults] = useState<SearchCollectionsAPISuccessResponse>(
    {}
  )

  // how many items of each category display on autocomplete
  const autocompleteSettings = {
    smartSearch: 3,
    collections: 4,
    token: 3,
    attributes: 3
  }

  function getHref(search?: string) {
    const pathname = `${PROXY_API_BASE}/search/collections/v1`

    const query: paths['/search/collections/v1']['get']['parameters']['query'] =
    {
      limit: 6,
    }

    if (communityId && communityId !== 'www' && communityId !== 'localhost') {
      query.community = communityId
    }

    if (search) query.name = search

    return setParams(pathname, query)
  }

  const fetchWAT = (search_query: string) => {

    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'x-api-key': '82cadfbf7d1a9da976e91655ada741a2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ search_query: search_query, start: 0, limit: 10, buy_now: true, nlu_only: true })
    };
    try {
      fetch('https://api.smartnftsearch.xyz/search/nft-search', options).then((res) => {
        res.json().then((data: WatApiSearchResponse) => {
          if (data.error === 0 && data.request_type === 'attribute_search') {
            const search_attributes = data.request_response.attributes
            let url = ""
            search_attributes.forEach((attr, index) => {
              if (url.includes(attr.key)) return // reservoir marketplace only accept on filter for attribute
              if (index == 0)
                url = `attributes%5B${attr.key}%5D=${attr.value}`
              else
                url = url + `&attributes%5B${attr.key}%5D=${attr.value}`
            })
            console.log(url)
            router.push(`/collections/${data.request_response.contract_address}?${url}`)
          }
          else if (data.error === 0 && data.request_type === 'pfp_search') {
            //`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`
            router.push(`/${data.request_response.contract_address}/${data.request_response.token_id}`)

          } else {
            alert("Sorry, no supported yet.")
          }
        })
      })

    } catch (error) {
      console.error(error)
    }

  }

  const [count, setCount] = useState(0)
  const countRef = useRef(count)
  countRef.current = count

  const debouncedSearch = useCallback(
    debounce(async (value) => {
      // Do not search empty string
      if (value === '') {
        setResults({})
        return
      }
      // Fetch new results
      setCount(countRef.current)
      //const href = getHref(value)

      const fetchOptions = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': '82cadfbf7d1a9da976e91655ada741a2',
          'Content-Type': 'application/json'
        }
      };
      const href = `https://api.smartnftsearch.xyz/search/nft-autocomplete?search_query=${value}&search_types=name_autocomplete,individual_attributes,token_search,individual_attributes,attribute_search`

      try {
        const res = await fetch(href, fetchOptions)
        const data = (await res.json()) as SearchCollectionsAPISuccessResponse
        if (!data) throw new ReferenceError('Data does not exist.')
        setResults(data)
      } catch (err) {
        console.error(err)
      }
    }, 300),
    []
  )

  const isEmpty = results?.responses?.smart_search?.length === 0

  return (
    <Downshift
      onInputValueChange={(value) => debouncedSearch(value)}
      id="search-bar-downshift"
      onChange={(item) => fetchWAT(item)}
    //itemToString={(item) => (item ? item.name : '')}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        inputValue,
        reset,
      }) => (
        <div
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="relative"
        >
          <FiSearch
            className={`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4b5563] dark:text-neutral-300 ${focused ? 'text-[#9CA3AF]' : ''
              }`}
          />
          <input
            type="text"
            tabIndex={-1}
            className="reservoir-label-l input-primary-outline w-full pl-9 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:ring-primary-900 dark:placeholder:text-neutral-400  dark:focus:ring-4 lg:w-[447px]"
            placeholder="Search for a collection"
            {...getInputProps()}
          />
          {typeof inputValue === 'string' && inputValue !== '' && (
            <button
              onClick={() => {
                reset()
                setFocused(false)
              }}
            >
              <FiXCircle className="absolute top-1/2 right-3 z-20 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            </button>
          )}

          {(focused || isOpen) &&
            inputValue === '' &&
            initialResults?.responses &&
            (
              <div
                className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
                {...getMenuProps()}
              >
                {initialResults?.responses?.smart_search && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Smart Search</h2>}
                {initialResults?.responses?.smart_search && initialResults?.responses?.smart_search
                  .slice(0, autocompleteSettings.smartSearch)
                  .map((recommendation, index) => (
                    <div
                      key={index}
                      className="cursor-pointer"
                    >
                      <a
                        {...getItemProps({
                          key: index,
                          index,
                          item: recommendation,
                        })}
                        onClick={() => {
                          reset()
                          setFocused(false)
                          fetchWAT(recommendation)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index)
                          ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                          : ''
                          }`}
                      >

                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {recommendation}
                        </span>
                      </a>
                    </div>
                  ))}
                {initialResults?.responses?.collections && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Collections</h2>}
                {initialResults?.responses?.collections && initialResults?.responses?.collections
                  .slice(0, autocompleteSettings.collections)
                  .map((collection, index) => (
                    <Link
                      key={index}
                      href={`/collections/${collection?.collection_contract}`}
                    >
                      <a
                        {...getItemProps({
                          key: index,
                          index: index + autocompleteSettings.smartSearch,
                          item: collection.collection_name,
                        })}
                        onClick={() => {
                          reset()
                          setFocused(false)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch)
                          ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                          : ''
                          }`}
                      >
                        <img
                          src={
                            collection?.collection_image ??
                            'https://via.placeholder.com/30'
                          }
                          alt={`${collection?.collection_name}'s logo.`}
                          className="overflow-hidden rounded-full h-9 w-9"
                        />
                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {collection.collection_name}
                        </span>
                      </a>
                    </Link>
                  ))}
                {initialResults?.responses?.token && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Tokens</h2>}
                {initialResults?.responses?.token && initialResults?.responses?.token && initialResults?.responses?.token
                  .slice(0, autocompleteSettings.token)
                  .map((recommendation, index) => (
                    <div
                      key={recommendation}
                      className="cursor-pointer"
                    >
                      <a
                        {...getItemProps({
                          key: index,
                          index: index + autocompleteSettings.smartSearch + autocompleteSettings.collections,
                          item: recommendation,
                        })}
                        onClick={() => {
                          reset()
                          setFocused(false)
                          fetchWAT(recommendation)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch + autocompleteSettings.collections)
                          ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                          : ''
                          }`}
                      >
                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {recommendation}
                        </span>
                      </a>
                    </div>
                  ))}
                {initialResults?.responses?.attributes && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Attributes</h2>}
                {initialResults?.responses?.attributes && initialResults?.responses?.attributes
                  .slice(0, autocompleteSettings.attributes)
                  .map((collection, index) => (
                    <Link
                      key={index}
                      href={`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`}
                    >
                      <a
                        {...getItemProps({
                          key: index,
                          index: index + autocompleteSettings.smartSearch + autocompleteSettings.collections + autocompleteSettings.token,
                          item: collection.collection_name + collection.key + collection.value,
                        })}
                        onClick={() => {
                          reset()
                          setFocused(false)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch + autocompleteSettings.collections + autocompleteSettings.token)
                          ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                          : ''
                          }`}
                      >
                        <img
                          src={
                            collection?.collection_image ??
                            'https://via.placeholder.com/30'
                          }
                          alt={`${collection?.collection_name}'s logo.`}
                          className="overflow-hidden rounded-full h-9 w-9"
                        />
                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {collection.collection_name}
                        </span>
                        <span className="px-2 py-1 ml-2 text-xs rounded-md reservoir-subtitle dark:text-white bg-neutral-700">
                          {collection.key} {collection.value}
                        </span>
                      </a>
                    </Link>
                  ))}
                <Link href={`https://www.wat.to/`}>
                  <a className='flex items-center justify-center w-full p-2 text-sm cursor-pointer bg-neutral-900 dark:hover:text-neutral-200' href='https://www.wat.to/' >
                    Powered by WAT
                    <img
                      src="/logoWAT.png"
                      alt={`logo wat`}
                      className="w-8 h-8 ml-2 overflow-hidden rounded-full"
                    />
                  </a>
                </Link>
              </div>
            )}



          {(focused || isOpen) && inputValue !== '' && isEmpty && (
            <div
              className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
              {...getMenuProps()}
            >
              <div className="flex items-center p-4">No collections found</div>
            </div>
          )}

          {(focused || isOpen) && inputValue !== '' && !isEmpty && (
            <div
              className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
              {...getMenuProps()}
            >
              {results?.responses?.smart_search && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Smart Search</h2>}
              {results?.responses?.smart_search && results?.responses?.smart_search
                .slice(0, autocompleteSettings.smartSearch)
                .map((recommendation, index) => (
                  <div
                    key={recommendation}
                    className="cursor-pointer"
                  >
                    <a
                      {...getItemProps({
                        key: recommendation,
                        index,
                        item: recommendation,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                        fetchWAT(recommendation)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index)
                        ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                        : ''
                        }`}
                    >

                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {recommendation}
                      </span>
                    </a>
                  </div>
                ))}
              {results?.responses?.collections && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Collections</h2>}
              {results?.responses?.collections && results?.responses?.collections
                .slice(0, autocompleteSettings.collections)
                .map((collection, index) => (
                  <Link
                    key={index}
                    href={`/collections/${collection?.collection_contract}`}
                  >
                    <a
                      {...getItemProps({
                        key: collection.collection_name,
                        index: index + autocompleteSettings.smartSearch,

                        item: collection.collection_name,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch)
                        ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                        : ''
                        }`}
                    >
                      <img
                        src={
                          collection?.collection_image ??
                          'https://via.placeholder.com/30'
                        }
                        alt={`${collection?.collection_name}'s logo.`}
                        className="overflow-hidden rounded-full h-9 w-9"
                      />
                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {collection.collection_name}
                      </span>
                    </a>
                  </Link>
                ))}
              {results?.responses?.token && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Tokens</h2>}
              {results?.responses?.token && results?.responses?.token
                .slice(0, autocompleteSettings.token)
                .map((recommendation, index) => (
                  <div
                    key={recommendation}
                    className="cursor-pointer"
                  >
                    <a
                      {...getItemProps({
                        key: recommendation,
                        index: index + autocompleteSettings.smartSearch + autocompleteSettings.collections,
                        item: recommendation,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                        fetchWAT(recommendation)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch + autocompleteSettings.collections)
                        ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                        : ''
                        }`}
                    >
                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {recommendation}
                      </span>
                    </a>
                  </div>
                ))}
              {results?.responses?.attributes && <h2 className='flex items-center px-5 py-1 font-semibold text-amber-600'>Attributes</h2>}
              {results?.responses?.attributes && results?.responses?.attributes
                .slice(0, autocompleteSettings.attributes)
                .map((collection, index) => (
                  <Link
                    key={index}
                    href={`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`}
                  >
                    <a
                      {...getItemProps({
                        key: collection.collection_name,
                        index: index + autocompleteSettings.smartSearch + autocompleteSettings.collections + autocompleteSettings.token,
                        item: collection.collection_name + collection.key + collection.value,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 ${highlightedIndex === (index + autocompleteSettings.smartSearch + autocompleteSettings.collections + autocompleteSettings.token)
                        ? 'bg-[#F3F4F6] dark:bg-neutral-600'
                        : ''
                        }`}
                    >
                      <img
                        src={
                          collection?.collection_image ??
                          'https://via.placeholder.com/30'
                        }
                        alt={`${collection?.collection_name}'s logo.`}
                        className="overflow-hidden rounded-full h-9 w-9"
                      />
                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {collection.collection_name}
                      </span>
                      <span className="px-2 py-1 ml-2 text-xs rounded-md reservoir-subtitle dark:text-white bg-neutral-700">
                        {collection.key} {collection.value}
                      </span>
                    </a>
                  </Link>
                ))}
              <Link href={`https://www.wat.to/`}>
                <a className='flex items-center justify-center w-full p-2 text-sm cursor-pointer bg-neutral-900 dark:hover:text-neutral-200' href='https://www.wat.to/' >
                  Powered by WAT
                  <img
                    src="/logoWAT.png"
                    alt={`logo wat`}
                    className="w-8 h-8 ml-2 overflow-hidden rounded-full "
                  />
                </a>
              </Link>
            </div>
          )}
        </div>
      )
      }
    </Downshift >
  )
}

export default SearchCollections
