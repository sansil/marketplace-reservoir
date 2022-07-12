interface collections_wat {
  collection_name: string,
  collection_contract: string,
  collection_image: string,
}
interface attributes_wat {
  collection_name: string,
  collection_contract: string,
  collection_image: string,
  key: string,
  value: string
}

interface nft_wat {
  token_id: number,
  price: number,
  image_url: string
  permalink: string
  cached_file_url: string
  name: string,
  rarity_index: number,
  rarity_percent: number,
  contract_address: string
}

interface response_wat {
  smart_search?: string[],
  collections?: collections_wat[],
  token?: string[],
  attributes?: attributes_wat[]
}

type WatApiAutocompleteResponse = {
  responses?: response_wat;
}

type WatApiSearchResponse = {
  error?: number,
  request_type?: string,
  request_response: {
    name: string,
    profile_img?: string
    contract_address?: string,
    themes?: string[]
    is_approximate?: boolean,
    token_id: number,
    attributes: {key:string,value:string}[],
    nfts?: nft_wat[]
  },
}

