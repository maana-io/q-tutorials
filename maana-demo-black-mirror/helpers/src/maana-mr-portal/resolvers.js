import uuid from 'uuid'
import pubsub from '../../pubsub'

import { log, print } from 'io.maana.shared'

require('dotenv').config()

const SELF = process.env.SERVICE_ID

const portalLogin_Mock = ({ user }) => ({
  id: user.id,
  user,
  avatar: { id: 0 },
  targetLanguageTag: { id: 'ru' }
})

const getPortalUserPreferredLanguage = ({ portalUser }) =>
  portalUser.preferredLanguage

export const resolver = {
  Query: {
    portalLogin_Mock: async (_, args) => portalLogin_Mock(args),
    getPortalUserPreferredLanguage: async (_, args) =>
      getPortalUserPreferredLanguage(args)
  }
}
