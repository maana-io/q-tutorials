const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const faker = require('faker')

const resolvers = {
  Query: {
    info: () => ({
      name: 'ClairOil Well Optimization Demo',
      version: '0.0.1'
    }),

    //TODO
    wellPredictatedMetrics(parent, { well }) {
      return {
        id: 'some_id',
        waterCut: Math.random() * 10,
        GOR: Math.random() * 10,
        oilRate: Math.random() * 10
      }
    },

    //TODO
    wellMeasuredMetrics(parent, { well }) {
      return {
        id: 'some_id',
        waterCut: Math.random() * 10,
        GOR: Math.random() * 10,
        oilRate: Math.random() * 10
      }
    },

    getWellAnomalyProbability(parent, { well }) {
      return Math.random() * 10
    },

    discoverIntervention(parent, { predictedMetrics, measuredMetrics }) {
      //Watercut
      let predictedWatercut = predictedMetrics.waterCut
      let measuredWatercut = measuredMetrics.waterCut
      let waterCutGap = measuredWatercut - predictedWatercut

      //OilRate
      let predictedOilRate = predictedMetrics.oilRate
      let measuredOilRate = measuredMetrics.oilRate

      let oilRateGap =
        (100 * (predictedOilRate - measuredOilRate)) / predictedOilRate

      let action = {}

      if (waterCutGap > 0.07) {
        action = {
          id: 'action',
          name: 'WATER_SHUT_OFF',
          type: 'REVENUE_GAIN'
        }
      }
      if (oilRateGap > 0.08) {
        action = {
          id: 'action',
          name: 'HYDRAULIC_FRACTURING',
          type: 'REVENUE_GAIN'
        }
      }
      if (oilRateGap > 0.05 && oilRateGap < 0.08) {
        action = {
          id: 'action',
          name: 'ACIDIZING',
          type: 'REVENUE_GAIN'
        }
      }

      return {
        id: 'some_id',
        action,
        probability: 0.9
      }
    },

    shouldTestWell(parent, { healthIndex, lastTestDate }) {
      let today = '03/03/2019'
      let testGap = 30

      let defaultAnomaly = 0.2 //TODO: Pass this value in
      let shouldTestConfidence =
        healthIndex >= 0.8
          ? true
          : healthIndex >= 0.5 && healthIndex < 0.8
          ? defaultAnomaly
          : 1
      shouldTestConfidence = testGap > 60 ? 1 : shouldTestConfidence

      return shouldTestConfidence
    },

    //TODO
    getWellLastTestDate(parent, { well }) {
      return '02/02/2019'
    },

    //TODO
    applyConstraints(parent, { opportunities, constraints }) {
      return [
        {
          id: 'some_id',
          name: 'op',
          createdAt: '02/02/2019',
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
          costReduction: Math.random() * 1000
        },
        {
          id: 'some_id',
          name: 'op',
          createdAt: '02/02/2019',
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
          costReduction: Math.random() * 1000
        }
      ]
    },

    //TODO
    combineActionImpacts(parent, { costReduction, revenueGains }) {
      let incrementalRevenue = 0
      let costReduction = 0

      return {
        id: 'some_id',
        name: 'op',
        createdAt: '02/02/2019',
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
        costReduction: Math.random() * 1000
      }
    },

    calculateCostSavingsOfSkippingATest(
      parent,
      { measuredMetrics, probabilityOfAnomaly, oilPrice }
    ) {
      let costOfSkippikingATest =
        measuredMetrics.oilRate * probabilityOfAnomaly * oilPrice * 60
      return costOfSkippikingATest
    },

    calculateInterventionRevenueGain(
      parent,
      { oilPrice, interventionCost, measuredMetrics, action }
    ) {
      let rateOfIncrease = 0.5
      let revenueIncrease =
        measuredMetrics.oilRate * oilPrice * 180 * rateOfIncrease

      return {
        id: 'some_id',
        action,
        impact: revenueIncrease,
        cost: interventionCost
      }
    },

    calculateHealthIndex(parent, { predictedMetrics, measuredMetrics }) {
      //Watercut
      let predictedWatercut = predictedMetrics.waterCut
      let measuredWatercut = measuredMetrics.waterCut
      let waterCutHealthIndex =
        1 - Math.abs((predictedWatercut - measuredWatercut) / predictedWatercut)

      //GOR
      let predictedGOR = predictedMetrics.GOR
      let measuredGOR = measuredMetrics.GOR
      let GORHealthIndex =
        1 - Math.abs((predictedGOR - measuredGOR) / predictedGOR)

      //OilRate
      let predictedOilRate = predictedMetrics.oilRate
      let measuredOilRate = measuredMetrics.oilRate
      let oilRateHealthIndex =
        1 - Math.abs((predictedOilRate - measuredOilRate) / predictedOilRate)

      return (
        (1 / 3) * waterCutHealthIndex +
        (1 / 3) * GORHealthIndex +
        (1 / 3) * oilRateHealthIndex
      )
    },

    calculateInterventionCost(parent, { well, action }) {
      return 5000
    },

    projectAction(parent, { actionProbability }) {
      let { action } = actionProbability
      action.id = 'some_id'
      return action
    },

    projectProbability(parent, { actionProbability }) {
      let { probability } = actionProbability
      return probability
    },

    wrapActionFinancialEstimate(parent, { actionEstimate }) {
      let { action } = actionEstimate
      action.id = 'some_id'
      actionEstimate.action = action
      return [actionEstimate]
    },

    makeFinancialEstimate(parent, { action, impact, cost }) {
      return {
        id: 'some_id',
        action,
        impact,
        cost
      }
    },

    invertFloat(parent, { value }) {
      return value * -1
    },

    getCurrentOilPrice() {
      return Math.random() * 100
    }
  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log('Server is running on http://localhost:4000'))
