import uuid from 'uuid'
import pubsub from '../../pubsub'

import { log, print } from 'io.maana.shared'

require('dotenv').config()

const SELF = process.env.SERVICE_ID

export const resolver = {
  Query: {
    info: async () => {
      return {
        id: 'maana.ue.',
        name: 'maana-ue',
        description: 'Maana Q User Ed ucation helper functions'
      }
    },
    helloWorld: async (_, { name }) => `Howdy, ${name}`,
    flattenCompanyList: async (_, { companies }) =>
      companies.map(x => x.Company)
  }
}
