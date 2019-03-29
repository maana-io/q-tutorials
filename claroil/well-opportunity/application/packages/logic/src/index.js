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
        name: 'ClarOil Well Optimization Demo',
        version: '0.0.5'
      }
    },

    async allActiveWells(parent) {
      let res = await CKGClient.query({
        query: gql`
          {
            allWells {
              id
              name
              predictedMetrics {
                 waterCut
                 GOR
                 oilRate
                 date
              }
              measuredMetrics {
                 waterCut
                 GOR
                 oilRate
                 date
              }
            }
          }
        `
      })

      let { allWells } = res.data

      return allWells
    },

    async wellPredictedMetrics(parent, { well, date }) {
      let allPredictedMetrics = well.predictedMetrics
      let byDate = _.take(
        allPredictedMetrics.filter(x => x.date === date),
        1
      )
      return byDate[0]
    },

    async wellMeasuredMetrics(parent, { well, date }) {
      let allMeasuredMetrics = well.measuredMetrics
      let byDate = _.take(
        allMeasuredMetrics.filter(x => x.date === date),
        1
      )
      return byDate[0]
    },

    async wellActionOutcome(parent, { well, action }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allActionOutcomes {
              id
              action { id }
              well { id }
              probabilityOfAnomaly
              cost
              manHours
              increaseInOilRate
            }
          }
        `
      })

      let { allActionOutcomes } = res.data

      let singleActionOutcome = _.take(
        allActionOutcomes.filter(x => x.well.id === well.id && x.action.id === action.id),
        1
      )[0]

      let { id, probabilityOfAnomaly, cost, manHours, increaseInOilRate } = singleActionOutcome

      return {
        id,
        action,
        well,
        probabilityOfAnomaly,
        cost,
        manHours,
        increaseInOilRate
      }
    },

    async discoverIntervention(parent, { predictedMetrics, measuredMetrics }) {
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

      let actionId = 'NO_INTERVENTION'

      if (oilRateGap > 0.08) {
        actionId = 'HYDRAULIC_FRACTURING'
      }

      if (oilRateGap > 0.05 && oilRateGap <= 0.08) {
        actionId = 'ACIDIZING'
      }

      if (waterCutGap > 0.07) {
        actionId = 'WATER_SHUT_OFF'
      }

      let singleAction = await actionById(parent, {actionId})

      return singleAction
    },

    async shouldTestWell(parent, { healthIndex, lastTestDay, today }) {
      let testGap = today - lastTestDay

      //SKIP_TEST_SAFE: anomaly prob = 0
      //SKIP_TEST_OK: anomaly prob = defined in data, per well
      //SKIP_TEST_RISKY: anomaly prob = 1
      let actionId =
        testGap > 60
          ? 'SKIP_TEST_RISKY'
          :  healthIndex >= 0.8
          ? 'SKIP_TEST_SAFE'
          : healthIndex >= 0.5 && healthIndex < 0.8
          ? 'SKIP_TEST_OK'
          : 'SKIP_TEST_RISKY'
      let singleAction = await actionById(parent, {actionId})

      return singleAction
    },


    async wellLastTestDate(parent, { well, today }) {
      let pastMeasuredMetrics = well.measuredMetrics.filter( entry => {
          let { date } = entry
          if (date <= today) {
            return true
          } else {
            return false
          }
      })
      let orderedMeasuredMetrics  = _.orderBy(pastMeasuredMetrics, ["date"], ["desc"])
      let singleMeasurement = _.take(orderedMeasuredMetrics, 1)[0]
      let { date } = singleMeasurement

      return date
    },


    async healthIndex(parent, { predictedMetrics, measuredMetrics }) {
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


    async applyConstraints(parent, { opportunities, constraints }) {
      let totalBudget = constraints.budget
      let totalManHours = constraints.manHours


      _.forEach(opportunities, function(op) { op.sumBen = op.incrementalRevenue + op.costReduction;});
      let orderedOpportunityByRevenueGain = _.orderBy(
        opportunities,
        ['sumBen', 'cost'],
        ['desc', 'asc']
      )
      _.forEach(orderedOpportunityByRevenueGain, function(op) { delete op.sumBen;});

      let filteredOpporunities = orderedOpportunityByRevenueGain.filter(
        entry => {
          let { cost, manHours } = entry
          if ((totalBudget - cost >= 0) && (totalManHours - manHours >= 0)){
            totalBudget = totalBudget - cost
            totalManHours = totalManHours - manHours
            return true
          } else {
            return false
          }
        }
      )

      return filteredOpporunities
    },

    async actionById(parent, { actionId }) {
      let res = await CKGClient.query({
        query: gql`
          {
            allActions {
              id
              name
              type
            }
          }
        `
      })

      let { allActions } = res.data

      let singleAction = _.take(
        allActions.filter(x => x.id === actionId),
        1
      )[0]

      return singleAction
    },

    async combineActionImpacts(parent, { well, costReduction, revenueGains }) {
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

      let manHours = [...costReduction, ...revenueGains].reduce(
        (accumulator, actionFinancialEstimate) => {
          let { manHours } = actionFinancialEstimate
          return accumulator + manHours
        },
        0
      )

      return {
        id: faker.random.uuid(),
        well,
        name: 'Opportunity for ' + well.name,
        createdAt: new Date(),
        actions: [
          ...costReduction.map(x => x.action),
          ...revenueGains.map(x => x.action)
        ],
        incrementalRevenue: incrementalRevenueSum,
        costReduction: costReductionSum,
        cost,
        manHours
      }
    },

    async interventionRevenueGain(parent,{ oilPrice, measuredMetrics, actionOutcome }) {
      let { increaseInOilRate, cost, manHours } = actionOutcome
      let revenueIncrease = measuredMetrics.oilRate * oilPrice * 180 * increaseInOilRate

      return [{
        id: faker.random.uuid(),
        action: actionOutcome.action,
        well: actionOutcome.well,
        impact: revenueIncrease,
        cost,
        manHours
      }]
    },

    async skippingTestCostReduction(parent, { oilPrice, measuredMetrics, actionOutcome }) {
      let probabilityOfAnomaly = actionOutcome.probabilityOfAnomaly / 100
      let potentialCostOfSkippikingATest = measuredMetrics.oilRate * probabilityOfAnomaly * oilPrice * 60
      let costReduction = actionOutcome.cost
      let manHours = actionOutcome.manHours

      return [{
        id: faker.random.uuid(),
        action: actionOutcome.action,
        well: actionOutcome.well,
        impact: costReduction,
        cost: potentialCostOfSkippikingATest,
        manHours
      }]
    },

    currentOilPrice() {
      return 10
    },

    todayDate() {
      return 1111
    },


  }
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log('Server is running on http://localhost:4000'))
