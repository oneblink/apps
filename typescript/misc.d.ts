export type NoU = null | undefined

export interface UserProfile {
  isSAMLUser: boolean
  providerType: string
  providerUserId: string
  userId: string
  username: string
  email: string | NoU
  firstName: string | NoU
  lastName: string | NoU
  fullName: string | NoU
  picture: string | NoU
  role: string | NoU
  supervisor:
    | {
        fullName: string | NoU
        email: string | NoU
        providerUserId: string | NoU
      }
    | NoU
}

export interface QueryParameters {
  [property: string]: string | Array<string | number> | null
}

export interface GenericObject {
  [property: string]: unknown
}
