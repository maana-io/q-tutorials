require('dotenv').config()

const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const faker = require('faker')
const gql = require('graphql-tag')

const { CKGClient } = require('./ckgClient')

const _ = require('lodash')

// console.log('client', Client)

const resolvers = {
  Query: {
    info: async () => {
      return {
        name: 'ClairOil Well Optimization Demo',
        version: '0.0.3'
      }
    },

    async allWells(parent) {
      let res = await CKGClient.query({
        query: gql`
          {
            allMeasuredMetrics {
              well
            }
          }
        `
      })

      let { allMeasuredMetrics } = res.data

      let allWells = allMeasuredMetrics.map(x => {
        return {
          id: faker.random.uuid(),
          name: x.well
        }
      })

      return _.take(_.uniqBy(allWells, 'name'), 15)
    },

    getDefaultConstraints() {
      return {
        id: faker.random.uuid(),
        budget: 1000000,
        manHours: 10000
      }
    },

    async wellPredictatedMetrics(parent, { well }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allPredictedMetrics {
              id
              oilRate
              waterCut
              GOR
              well
            }
          }
        `
      })

      let { allPredictedMetrics } = res.data
      let byWell = _.take(
        allPredictedMetrics.filter(x => x.well === well.name),
        1
      )
      return byWell[0]
    },

    async wellMeasuredMetrics(parent, { well }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allMeasuredMetrics {
              id
              oilRate
              waterCut
              GOR
              well
            }
          }
        `
      })

      let { allMeasuredMetrics } = res.data
      let byWell = _.take(
        allMeasuredMetrics.filter(x => x.well === well.name),
        1
      )
      return byWell[0]
    },

    getWellAnomalyProbability(parent, { well }) {
      return 1
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
        predictedOilRate !== 0
          ? (100 * (predictedOilRate - measuredOilRate)) / predictedOilRate
          : 0

      let action = {
        id: faker.random.uuid()
      }

      if (waterCutGap > 0.07) {
        action = {
          id: 'WATER_SHUT_OFF',
          name: 'WATER_SHUT_OFF',
          type: 'REVENUE_GAIN'
        }
      }
      if (oilRateGap > 0.08) {
        action = {
          id: 'HYDRAULIC_FRACTURING',
          name: 'HYDRAULIC_FRACTURING',
          type: 'REVENUE_GAIN'
        }
      }
      if (oilRateGap > 0.05 && oilRateGap < 0.08) {
        action = {
          id: 'ACIDIZING',
          name: 'ACIDIZING',
          type: 'REVENUE_GAIN'
        }
      }

      return {
        id: faker.random.uuid(),
        action,
        probability: 0.9
      }
    },

    shouldTestWell(
      parent,
      { healthIndex, lastTestDay, wellAnomalyProbability }
    ) {
      let today = 1200
      let testGap = 30

      let defaultAnomaly = 0.2 //TODO: Pass this value in
      let probability =
        healthIndex >= 0.8
          ? true
          : healthIndex >= 0.5 && healthIndex < 0.8
          ? defaultAnomaly
          : 1
      probability = testGap > 60 ? 1 : probability

      return {
        id: faker.random.uuid(),
        action: {
          id: 'SKIP_TEST',
          name: 'SKIP_TEST',
          type: 'COST_SAVING'
        },
        probability
      }
    },

    //TODO:
    getWellLastTestDate(parent, { well }) {
      return '02/02/2019'
    },

    applyConstraints(parent, { opportunities, constraints }) {
      let { budget } = constraints

      let orderedOpportunityByRevenueGain = _.orderBy(
        opportunities,
        ['incrementalRevenue', 'costReduction', 'cost'],
        ['desc', 'desc', 'asc']
      )

      let filteredOpporunities = orderedOpportunityByRevenueGain.filter(
        entry => {
          if (budget > 0) {
            let { cost } = entry
            budget = budget - cost
            return true
          } else {
            return false
          }
        }
      )

      return filteredOpporunities
    },

    combineActionImpacts(parent, { costReduction, revenueGains }) {
      let incrementalRevenueSum = revenueGains.reduce(
        (accumulator, actionFinancialEstimate) => {
          let { impact } = actionFinancialEstimate
          return accumulator + impact
        },
        0
      )

      let costReductionSum = costReduction.reduce(
        (accumulator, actionFinancialEstimate) => {
          let { impact } = actionFinancialEstimate
          return accumulator + impact
        },
        0
      )

      let cost = [...costReduction, ...revenueGains].reduce(
        (accumulator, actionFinancialEstimate) => {
          let { cost } = actionFinancialEstimate
          return accumulator + cost
        },
        0
      )

      console.log(costReduction, revenueGains)

      return {
        id: faker.random.uuid(),
        name: 'opportunity-' + faker.random.uuid(),
        createdAt: new Date(),
        actions: [
          ...costReduction.map(x => x.action),
          ...revenueGains.map(x => x.action)
        ],
        incrementalRevenue: incrementalRevenueSum,
        costReduction: costReductionSum,
        cost
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
        id: faker.random.uuid(),
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
        predictedWatercut !== 0
          ? 1 -
            Math.abs((predictedWatercut - measuredWatercut) / predictedWatercut)
          : 0

      //GOR
      let predictedGOR = predictedMetrics.GOR
      let measuredGOR = measuredMetrics.GOR
      let GORHealthIndex =
        predictedGOR !== 0
          ? 1 - Math.abs((predictedGOR - measuredGOR) / predictedGOR)
          : 0

      //OilRate
      let predictedOilRate = predictedMetrics.oilRate
      let measuredOilRate = measuredMetrics.oilRate
      let oilRateHealthIndex =
        predictedOilRate !== 0
          ? 1 -
            Math.abs((predictedOilRate - measuredOilRate) / predictedOilRate)
          : 0

      return (
        (1 / 3) * waterCutHealthIndex +
        (1 / 3) * GORHealthIndex +
        (1 / 3) * oilRateHealthIndex
      )
    },

    calculateInterventionCost(parent, { well, action }) {
      return 5000
    },

    calculateTestCost(parent, { well, action }) {
      return 2000
    },
    projectAction(parent, { actionProbability }) {
      let { action } = actionProbability
      action.id = action.id ? action.id : faker.random.uuid()
      return action
    },

    projectProbability(parent, { actionProbability }) {
      let { probability } = actionProbability
      return probability
    },

    wrapActionFinancialEstimate(parent, { actionEstimate }) {
      let { action } = actionEstimate
      action.id = action.id ? action.id : faker.random.uuid()
      actionEstimate.action = action
      return [actionEstimate]
    },

    makeFinancialEstimate(parent, { action, impact, cost }) {
      return {
        id: faker.random.uuid(),
        action,
        impact,
        cost
      }
    },

    invertFloat(parent, { value }) {
      return value * -1
    },

    getCurrentOilPrice() {
      return 10
    }
  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log('Server is running on http://localhost:4000'))
