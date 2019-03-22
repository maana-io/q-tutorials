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
      return {
        id: 'bla',
        waterCut: Math.random() * 10,
        GOR: Math.random() * 10,
        oilRate: Math.random() * 10
      }
    },
    wellMeasuredRate(parent, { well }) {
      return {
        id: 'bla',
        waterCut: Math.random() * 10,
        GOR: Math.random() * 10,
        oilRate: Math.random() * 10
      }
    },

    getWellAnomalyProbability(parent, { well }) {
      return Math.random() * 10
    },

    discoverIntervention(parent, { predictedRate, measuredRate }) {
      return {
        id: 'hey',
        action: {
          id: 'action',
          name: 'actionName',
          type: 'costSaving'
        },
        probability: 0.9
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
      return [
        {
          id: faker.random.uuid(),
          name: 'op',
          createAt: faker.date.recent(),
          actions: [
            {
              id: 'action',
              name: 'actionName',
              type: 'costSaving'
            },
            {
              id: 'action',
              name: 'actionName',
              type: 'costSaving'
            }
          ],
          incrementalRevenue: Math.random() * 10000,
          costReductions: Math.random() * 1000
        },
        {
          id: faker.random.uuid(),
          name: 'op',
          createAt: faker.date.recent(),
          actions: [
            {
              id: 'action',
              name: 'actionName',
              type: 'costSaving'
            },
            {
              id: 'action',
              name: 'actionName',
              type: 'costSaving'
            }
          ],
          incrementalRevenue: Math.random() * 10000,
          costReductions: Math.random() * 1000
        }
      ]
    },

    combineActionImpacts(parent, { costReductions, revenueGains }) {
      return {
        id: faker.random.uuid(),
        name: 'op',
        createAt: faker.date.recent(),
        actions: [
          {
            id: 'action',
            name: 'actionName',
            type: 'costSaving'
          },
          {
            id: 'action',
            name: 'actionName',
            type: 'costSaving'
          }
        ],
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

    calculateInterventionRevenueGain(parent, { well, action, cost }) {
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
    calculateHealthIndex(parent, { predictedMetrics, measuredMetrics }) {
      return Math.random() * 10
    },

    projectAction(parent, { actionProbability }) {
      let { action } = actionProbability
      console.log('action', action)
      action.id = 'bla'
      return action
    },
    projectProbability(parent, { actionProbability }) {
      let { probability } = actionProbability
      return probability
    },

    wrapActionFinancialEstimate(parent, { actionEstimate }) {
      let { action } = actionEstimate
      action.id = 'bla'
      actionEstimate.action = action
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
