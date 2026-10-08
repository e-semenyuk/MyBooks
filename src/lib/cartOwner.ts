// A cart belongs to a signed-in user or, before sign-in, to a guest session cookie.
export type CartOwner =
  | { kind: 'user'; userId: number }
  | { kind: 'guest'; sessionId: string }

export function ownerWhere(owner: CartOwner) {
  return owner.kind === 'user' ? { userId: owner.userId } : { sessionId: owner.sessionId }
}
