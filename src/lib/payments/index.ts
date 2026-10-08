import { mockProvider, PaymentProvider } from './mockProvider'

// The one place that chooses the provider. A real one would be selected here.
export const paymentProvider: PaymentProvider = mockProvider
