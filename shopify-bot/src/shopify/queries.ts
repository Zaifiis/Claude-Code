/**
 * The GraphQL this app sends. Kept in one file so the scopes it implies are
 * easy to audit: read_products, read_inventory, read_content, read_locales.
 *
 * Note for the bulk queries: nested connections must NOT carry pagination
 * arguments (first/after) — Shopify rejects the operation if they do. That is
 * the most common reason a bulk query fails to even start.
 */

export const PRODUCTS_BULK_QUERY = `
  {
    products {
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          productType
          vendor
          tags
          status
          onlineStoreUrl
          updatedAt
          featuredMedia {
            preview { image { url } }
          }
          variants {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                availableForSale
                position
                updatedAt
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

export const COLLECTIONS_BULK_QUERY = `
  {
    collections {
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          updatedAt
          products {
            edges {
              node { id }
            }
          }
        }
      }
    }
  }
`;

/** Shop profile plus the legal policies, in one small request. */
export const SHOP_QUERY = `
  query {
    shop {
      name
      myshopifyDomain
      primaryDomain { host }
      currencyCode
      billingAddress { countryCodeV2 }
      shopPolicies {
        type
        title
        body
      }
    }
  }
`;

/** Merchant-written pages — FAQ, size guides, about. */
export const PAGES_QUERY = `
  query pages($cursor: String) {
    pages(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          body
          updatedAt
        }
      }
    }
  }
`;
