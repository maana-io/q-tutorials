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

    async getWellAnomalyProbability(parent, { well, action }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allInterventionConstraints {
              well
              wellInterventionType
              probabilityOfAnomalcyPercent
            }
          }
        `
      })

      let { allInterventionConstraints } = res.data

      let singleWellIntervention = _.take(
        allInterventionConstraints.filter(x => x.well === well.name).filter(x => x.wellInterventionType === action.name),
        1
      )

      let result = singleWellIntervention[0].probabilityOfAnomalcyPercent / 100
      return result
    },

    async discoverIntervention(parent, { predictedMetrics, measuredMetrics }) {
      //well
      let well = {
        id: faker.random.uuid()
        name = predictedMetrics.well
      }

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

      if (oilRateGap > 0.08) {
        action = {
          id: 'HYDRAULIC_FRACTURING',
          name: 'Hydraulic Fracturing',
          type: 'REVENUE_GAIN'
        }
      }

      if (oilRateGap > 0.05 && oilRateGap <= 0.08) {
        action = {
          id: 'ACIDIZING',
          name: 'Acidizing',
          type: 'REVENUE_GAIN'
        }
      }

      if (waterCutGap > 0.07) {
        action = {
          id: 'WATER_SHUT_OFF',
          name: 'Water Shutoff',
          type: 'REVENUE_GAIN'
        }
      }

      let anomalyProb = getWellAnomalyProbability(parent, {well, action})

      return {
        id: faker.random.uuid(),
        action,
        probability: anomalyProb
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
          name: 'Skip test',
          type: 'COST_SAVING'
        },
        probability
      }
    },

    async getWellLastTestDate(parent, { well }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allMeasuredMetrics {
              well
              dayOfProduction
            }
          }
        `
      })

      let { allMeasuredMetrics } = res.data
      let singleMeasurement = _.take(allMeasuredMetrics, 1)[0]
      let { dayOfProduction } = singleMeasurement

      return dayOfProduction
    },

    applyConstraints(parent, { opportunities, constraints }) {
      let { budget } = constraints

      _.forEach(opportunities, function(op) { op.sumBen = op.incrementalRevenue + op.costReduction;});
      let orderedOpportunityByRevenueGain = _.orderBy(
        opportunities,
        ['sumBen', 'cost'],
        ['desc', 'asc']
      )
      _.forEach(orderedOpportunityByRevenueGain, function(op) { delete op.sumBen;});

      let filteredOpporunities = orderedOpportunityByRevenueGain.filter(
        entry => {
          let { cost } = entry
          if (budget - cost >= 0) {
            budget = budget - cost
            return true
          } else {
            return false
          }
        }
      )

      return filteredOpporunities
    },

    combineActionImpacts(parent, { well, costReduction, revenueGains }) {
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

      return {
        id: faker.random.uuid(),
        well,
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

    async calculateInterventionCost(parent, { well, action }) {
      let wellInterventionType = action.name

      let res = await CKGClient.query({
        query: gql`
          {
            allInterventionConstraints {
              well
              wellInterventionType
              interventionCurrencyCost
            }
          }
        `
      })

      let { allInterventionConstraints } = res.data
      let singleIntervention = _.take(
        allInterventionConstraints.filter(
          x =>
            x.well === well.name &&
            x.wellInterventionType === wellInterventionType
        ),
        1
      )

      let result = singleIntervention[0].interventionCurrencyCost
      return result
    },
    async calculateTestCost(parent, { well, action }) {
      let wellInterventionType = action.name

      let res = await CKGClient.query({
        query: gql`
          {
            allInterventionConstraints {
              well
              wellInterventionType
              interventionCurrencyCost
            }
          }
        `
      })

      let { allInterventionConstraints } = res.data
      let singleIntervention = _.take(
        allInterventionConstraints.filter(
          x =>
            x.well === well.name &&
            x.wellInterventionType === wellInterventionType
        ),
        1
      )

      let result = singleIntervention[0].testCurrencyCost
      return result
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
