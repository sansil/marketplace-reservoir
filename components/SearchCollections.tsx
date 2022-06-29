import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Downshift from 'downshift'
import { useRouter } from 'next/router'
import setParams from 'lib/params'
import debounce from 'lodash.debounce'
import { FiSearch, FiXCircle } from 'react-icons/fi'
import { paths } from '@reservoir0x/client-sdk/dist/types/api'

type SearchCollectionsAPISuccessResponse =
  paths['/search/collections/v1']['get']['responses']['200']['schema']

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


  const fetchWAT = (search_query) => {
    let formData = new FormData()
    formData.append('start', "0")
    formData.append('limit', "20")
    formData.append('buy_now', "true")
    formData.append('nlu_only', "true")
    formData.append('search_query', search_query)

    const data = new URLSearchParams();
    for (const pair of formData) {
      data.append(pair[0], pair[1]);
    }

    fetch('https://api.smartnftsearch.xyz/search/', { method: "post", body: data }).then((res) => {
      res.json().then((data) => {
        if (data.error === 0 && data.request_type === 'attribute_search') {
          //`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`
          if (data.request_response.attributes.length > 0) {
            const search_attributes = data.request_response.attributes
            let url = ""
            search_attributes.forEach((attr, index) => {

              if (index == 0)
                url = `attributes%5B${attr.key}%5D=${attr.value}`
              else
                url = url + `&attributes%5B${attr.key}%5D=${attr.value}`
            })
            console.log(url)
            router.push(`/collections/${data.request_response.contract_address}?${url}`)
          }

        }

        else if (data.error === 0 && data.request_type === 'pfp_search') {
          //`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`
          router.push(`/${data.request_response.contract_address}/${data.request_response.token_id}`)

        } else {
          alert("Sorry no supported yet")
        }
      })
    })
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
      const href = `https://api.smartnftsearch.xyz/search/autocomplete?search_query=${value}&search_types=name_autocomplete,individual_attributes,token_search,individual_attributes,attribute_search`

      try {
        const res = await fetch(href)

        const data = (await res.json()) as SearchCollectionsAPISuccessResponse
        console.log('sansil', data)
        if (!data) throw new ReferenceError('Data does not exist.')

        setResults(data)
      } catch (err) {
        console.error(err)
      }
    }, 100),
    []
  )

  const isEmpty = results?.collections?.length === 0

  return (
    <Downshift
      onInputValueChange={(value) => debouncedSearch(value)}
      id="search-bar-downshift"
      onChange={(item) => item.id && router.push(`/collections/${item.id}`)}
      itemToString={(item) => (item ? item.name : '')}
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

          {/* {(focused || isOpen) &&
            inputValue === '' &&
            initialResults?.collections &&
            initialResults?.collections.length > 0 && (
              <div
                className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
                {...getMenuProps()}
              >
                {initialResults?.collections
                  .slice(0, 6)
                  .map((collection, index) => (
                    <Link
                      key={collection?.name}
                      href={`/collections/${collection?.collectionId}`}
                    >
                      <a
                        {...getItemProps({
                          key: collection?.name,
                          index,
                          item: collection,
                        })}
                        onClick={() => {
                          reset()
                          setFocused(false)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                      >
                        <img
                          src={
                            collection?.image ??
                            'https://via.placeholder.com/30'
                          }
                          alt={`${collection?.name}'s logo.`}
                          className="overflow-hidden rounded-full h-9 w-9"
                        />
                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {collection?.name}
                        </span>
                      </a>
                    </Link>
                  ))}
              </div>
            )} */}

          {(focused || isOpen) &&
            inputValue === '' &&
            initialResults?.responses &&
            (
              <div
                className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
                {...getMenuProps()}
              >
                <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Smart Search</h2>
                {initialResults?.responses.smart_search?.slice(0, 4)
                  .map((collection, index) => (
                    <Link
                      key={collection + index}
                      href={`#`}
                    >
                      <a
                        {...getItemProps({
                          key: collection,
                          index,
                          item: collection,
                        })}
                        onClick={() => {
                          fetchWAT(collection)
                          reset()
                          setFocused(false)
                        }}
                        className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                      >
                        {/* <img
                          src={
                            collection?.image ??
                            'https://via.placeholder.com/30'
                          }
                          alt={`${collection}'s logo.`}
                          className="overflow-hidden rounded-full h-9 w-9"
                        /> */}
                        <span className="ml-2 reservoir-subtitle dark:text-white">
                          {collection}
                        </span>
                      </a>
                    </Link>
                  ))}
                <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Attributes</h2>
                {initialResults?.responses?.attributes?.slice(0, 4).map((collection, index) => (
                  //http://localhost:3000/collections/0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7?attributes%5BShirt%5D=Hoodie&attributes%5BPants+Color%5D=Denim
                  <Link
                    key={index}
                    href={`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`}
                  >
                    <a
                      {...getItemProps({
                        key: collection + index,
                        index,
                        item: collection,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                    >
                      <img
                        src={
                          collection?.collection_image ?? 'https://via.placeholder.com/30'
                        }
                        alt={`${collection?.collection_image}'s logo.`}
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
                <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Collections</h2>
                {initialResults?.responses?.collections?.slice(0, 4).map((collection, index) => (
                  <Link
                    key={collection}
                    href={`/collections/${collection?.collection_contract}`}
                  >
                    <a
                      {...getItemProps({
                        key: collection,
                        index,
                        item: collection,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                    >
                      <img
                        src={
                          collection?.collection_image ??
                          'https://via.placeholder.com/30'
                        }
                        alt={`${collection}'s logo.`}
                        className="overflow-hidden rounded-full h-9 w-9"
                      />
                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {collection.collection_name}
                      </span>
                    </a>
                  </Link>
                ))}
                <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Tokens</h2>
                {initialResults?.responses?.token?.slice(0, 4).map((collection, index) => (
                  <Link
                    key={collection}
                    href={`#`}
                  >
                    <a
                      {...getItemProps({
                        key: collection,
                        index,
                        item: collection,
                      })}
                      onClick={() => {
                        reset()
                        setFocused(false)
                        fetchWAT(collection)
                      }}
                      className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                    >
                      {/* <img
                        src={
                          collection?.collection_image ??
                          'https://via.placeholder.com/30'
                        }
                        alt={`${collection}'s logo.`}
                        className="overflow-hidden rounded-full h-9 w-9"
                      /> */}
                      <span className="ml-2 reservoir-subtitle dark:text-white">
                        {collection}
                      </span>
                    </a>
                  </Link>
                ))}:<></>
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
          {/* {(focused || isOpen) && inputValue !== '' && !isEmpty && (
            <div
              className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
              {...getMenuProps()}
            >
              {results?.collections?.slice(0, 6).map((collection, index) => (
                <Link
                  key={collection?.name}
                  href={`/collections/${collection?.collectionId}`}
                >
                  <a
                    {...getItemProps({
                      key: collection?.name,
                      index,
                      item: collection,
                    })}
                    onClick={() => {
                      reset()
                      setFocused(false)
                    }}
                    className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                  >
                    <img
                      src={
                        collection?.image ?? 'https://via.placeholder.com/30'
                      }
                      alt={`${collection?.name}'s logo.`}
                      className="overflow-hidden rounded-full h-9 w-9"
                    />
                    <span className="ml-2 reservoir-subtitle dark:text-white">
                      {collection?.name}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          )} */}
          {(focused || isOpen) && inputValue !== '' && !isEmpty && (
            <div
              className="absolute top-[50px] z-10 w-full divide-y-[1px] divide-[#D1D5DB] overflow-hidden rounded-[8px] border border-[#D1D5DB] bg-white dark:divide-neutral-600 dark:border-neutral-600 dark:bg-neutral-900"
              {...getMenuProps()}
            >
              <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Smart Search</h2>
              {results?.responses && results?.responses.smart_search?.slice(0, 4).map((collection, index) => (
                <Link
                  key={index}
                  href={`#`}
                >
                  <a
                    {...getItemProps({
                      key: collection,
                      index,
                      item: collection,
                    })}
                    onClick={() => {
                      reset()
                      setFocused(false)
                      fetchWAT(collection)
                    }}
                    className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                  >
                    {/* <img
                      src={
                        collection?.image ?? 'https://via.placeholder.com/30'
                      }
                      alt={`${collection?.name}'s logo.`}
                      className="overflow-hidden rounded-full h-9 w-9"
                    /> */}
                    <span className="ml-2 reservoir-subtitle dark:text-white">
                      {collection}
                    </span>
                  </a>
                </Link>
              ))}
              <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Attributes</h2>
              {results?.responses?.attributes?.slice(0, 4).map((collection, index) => (
                <Link
                  key={index}
                  href={`/collections/${collection?.collection_contract}?attributes%5B${collection.key}%5D=${collection.value}`}
                >
                  <a
                    {...getItemProps({
                      key: collection,
                      index,
                      item: collection,
                    })}
                    onClick={() => {
                      reset()
                      setFocused(false)
                    }}
                    className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                  >
                    <img
                      src={
                        collection?.collection_image ?? 'https://via.placeholder.com/30'
                      }
                      alt={`${collection?.collection_image}'s logo.`}
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
              <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Collections</h2>
              {results?.responses?.collections?.slice(0, 4).map((collection, index) => (
                <Link
                  key={index}
                  href={`/collections/${collection?.collection_contract}`}
                >
                  <a
                    {...getItemProps({
                      key: collection,
                      index,
                      item: collection,
                    })}
                    onClick={() => {
                      reset()
                      setFocused(false)
                    }}
                    className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                  >
                    <img
                      src={
                        collection?.collection_image ?? 'https://via.placeholder.com/30'
                      }
                      alt={`${collection?.collection_image}'s logo.`}
                      className="overflow-hidden rounded-full h-9 w-9"
                    />
                    <span className="ml-2 reservoir-subtitle dark:text-white">
                      {collection.collection_name}
                    </span>
                  </a>
                </Link>
              ))}
              <h2 className='flex items-center p-1 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 text-amber-600'>Tokens</h2>
              {results?.responses?.token?.slice(0, 3).map((collection, index) => (
                <Link
                  key={index}
                  href={`#`}
                >
                  <a
                    {...getItemProps({
                      key: collection,
                      index,
                      item: collection,
                    })}
                    onClick={() => {
                      reset()
                      setFocused(false)
                      fetchWAT(collection)
                    }}
                    className={`flex items-center p-4 hover:bg-[#F3F4F6] dark:hover:bg-neutral-600 `}
                  >
                    {/* <img
                      src={
                        collection?.image ?? 'https://via.placeholder.com/30'
                      }
                      alt={`${collection?.name}'s logo.`}
                      className="overflow-hidden rounded-full h-9 w-9"
                    /> */}
                    <span className="ml-2 reservoir-subtitle dark:text-white">
                      {collection}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Downshift>
  )
}

export default SearchCollections
