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
        description: 'Maana Q User Education helper functions'
      }
    },
    helloWorld: async (_, { name }) => `Howdy, ${name}`,
    wikiOilRefineryTopics: async () => ['list of oil refineries'],
    wikiParseOilRefineries: async (_, { text }) => {
      // Process the input line by line
      const lines = text.split('\n')

      // Build a result set
      const refineries = []

      // We use regular expressions to parse the lines
      const locationRegEx = /=+ (.*) =+/
      const idAndCapacityRegEx = /(.*) (\d+\,\d+(,\d+)*)(.*) bbl\/d(.*)/

      // Keep track of the current location
      let location = null
      lines.forEach(line => {
        // Update location
        const locationMatch = locationRegEx.exec(line)
        if (locationMatch) {
          location = locationMatch[1]
        }
        // Fill in id and capacity
        const idAndCapacityMatch = idAndCapacityRegEx.exec(line)
        if (!idAndCapacityMatch) return

        refineries.push({
          id: idAndCapacityMatch[1],
          location,
          capacity: parseFloat(idAndCapacityMatch[2].replace(',', ''))
        })
      })
      return refineries
    },
    oilRefineryLocations: async (_, { refineries }) => {
      const locations = new Set()
      refineries.forEach(x => locations.add(x.location))
      return [...locations].sort()
    },
    largestOilRefinery: async (_, { refineries }) => {
      let largest = refineries[0]
      refineries.forEach(x => {
        if (x.capacity > largest.capacity) {
          largest = x
        }
      })
      return largest
    },
    totalLocationCapacity: async (_, { refineries, location }) => {
      let total = 0
      refineries.forEach(x => {
        if (x.location === location) {
          total += x.capacity
        }
      })
      return total
    },
    totalCapacity: async (_, { refineries }) => {
      let total = 0
      refineries.forEach(x => (total += x.capacity))
      return total
    }
  }
}
