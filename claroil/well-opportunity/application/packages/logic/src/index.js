const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const { MockList } = require('graphql-tools')
const faker = require('faker')

const resolvers = {
  Action: () => ({
    id: faker.random.uuid(),
    name: 'Acit'
  }),
  Query: {
    info: () => ({
      name: 'ClairOil Well Optimization Demo',
      version: '0.0.1'
    }),
    wellPredictatedRate(parent, { well }) {
      return Math.random() * 10
    },
    wellMeasuredRate(parent, { well }) {
      return Math.random() * 10
    },

    getWellAnomalyProbability(parent, { well }) {
      return Math.random() * 10
    },

    discoverIntervention(parent, { predictedRate, measuredRate }) {
      return {
        id: 'action',
        name: 'actionName',
        type: 'costSaving'
      }
    },

    shouldTestWell(parent, { healthIndex, lastTestDate }) {
      return {
        id: 'hey',
        action: {
          id: 'action',
          name: 'actionName',
          type: 'costSaving'
        },
        probability: 0.8
      }
    },

    getWellLastTestDate(parent, { well }) {
      return '02/02/2019'
    },
    applyConstraints(parent, { opportunities, constraints }) {
      return [opportunities[0], opportunities[1]]
    },

    combineActionImpacts(parent, { costReductions, revenueGains }) {
      return {
        id: faker.random.uuid(),
        name: 'op',
        createAt: faker.date.recent(),
        actions: () => new MockList([2, 6]),
        incrementalRevenue: Math.random() * 10000,
        costReductions: Math.random() * 1000
      }
    },

    calculateCostSavingsOfSkippingATest(
      parent,
      { measuredMetrics, probabilityOfAnomaly, oilPrice }
    ) {
      return Math.random() * 1000
    },
    projectAction(parent, { actionProbability }) {
      let { action } = actionProbability
      return action ? action : null
    },
    projectProbability(parent, { actionProbability }) {
      let { probability } = actionProbability
      return probability ? probability : null
    },

    wrapActionFinancialEstimate(parent, { actionEstimate }) {
      return [actionEstimate]
    },

    makeFinancialEstimate(parent, { action, impact, cost }) {
      return {
        id: 'hey',
        action: {
          id: 'action',
          name: 'actionName',
          type: 'costSaving'
        },
        impact: Math.random() * 10000,
        cost: Math.random() * 10000
      }
    },
    invertFloat(parent, { value }) {
      return value * -1
    }
  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log('Server is running on http://localhost:4000'))
