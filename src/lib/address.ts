export interface AddressFields {
  fullName: string
  street: string
  city: string
  postalCode: string
  country: string
}

// The text stored on an order and shown in the checkout address box
export function formatAddress(address: AddressFields): string {
  return [address.fullName, address.street, `${address.postalCode} ${address.city}`.trim(), address.country]
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

export const MAX_ADDRESSES_PER_USER = 10
