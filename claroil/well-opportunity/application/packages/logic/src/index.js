require('dotenv').config()

const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const faker = require('faker')
const gql = require('graphql-tag')
const { CKGClient } = require('./ckgClient')
const { initMetrics } = require('io.maana.shared')
const _ = require('lodash')

const SELF = process.env.SERVICE_ID || 'q-svc-claroil-node'
const REMOTE_KSVC_ENDPOINT_URL = process.env.REMOTE_KSVC_ENDPOINT_URL

const resolvers = {
  Query: {
    info: async () => {
      return {
        name: 'ClarOil Well Optimization Demo',
        version: '0.0.5',
        dm_url: REMOTE_KSVC_ENDPOINT_URL
      }
    },

    async allActiveWells(parent) {
      console.log('begin allActiveWells')
      let res = await CKGClient.query({
        query: gql`
          {
            wells(
              ids: [
                "Pu-01"
                "Pu-02"
                "Pu-03"
                "Pu-04"
                "Pu-05"
                "Co-01"
                "Co-02"
                "Ga-01"
                "Ga-02"
                "Ga-03"
                "Ga-04"
                "Cr-01"
                "Cr-02"
                "Pd-01"
                "Pd-02"
              ]
            ) {
              id
              name
            }
          }
        `
      })

      let { wells } = res.data

      console.log('end allActiveWells:', wells)

      return wells
    },

    async wellPredictedMetrics(parent, { well, date }) {
      console.log('begin wellPredictedMetrics', well, date)

      let res = await CKGClient.query({
        query: gql`
          {
            allMetricss {
              id
              well {
                id
                name
              }
              date
              type
              waterCut
              GOR
              oilRate
            }
          }
        `
      })

      let { allMetricss } = res.data
      let filteredMetrics = allMetricss.filter(
        x => x.date === date && x.well.id === well.id && x.type === 'predicted'
      )
      let len = filteredMetrics.length
      let metric = {
        id: 1,
        well,
        date,
        type: 'predicted',
        waterCut: 1,
        GOR: 1,
        oilRate: 1
      }
      if (len > 0) {
        metric = _.take(filteredMetrics, 1)[0]
      }
      console.log('end wellPredictedMetrics', metric)
      return metric
    },

    async wellMeasuredMetrics(parent, { well, date }) {
      console.log('begin wellMeasuredMetrics', well, date)
      let res = await CKGClient.query({
        query: gql`
          {
            allMetricss {
              id
              well {
                id
                name
              }
              date
              type
              waterCut
              GOR
              oilRate
            }
          }
        `
      })

      let { allMetricss } = res.data

      let filteredMetrics = allMetricss.filter(
        x => x.date === date && x.well.id === well.id && x.type === 'measured'
      )
      let len = filteredMetrics.length
      let metric = {
        id: 1,
        well,
        date,
        type: 'measured',
        waterCut: 1,
        GOR: 1,
        oilRate: 1
      }
      if (len > 0) {
        metric = _.take(filteredMetrics, 1)[0]
      }
      console.log('end wellMeasuredMetrics', metric)
      return metric
    },

    async wellActionOutcome(parent, { well, action }) {
      console.log('begin wellActionOutcome', well, action)
      let res = await CKGClient.query({
        query: gql`
          {
            allActionOutcomes {
              id
              action {
                id
                name
                type
              }
              well {
                id
                name
              }
              probabilityOfAnomaly
              cost
              manHours
              increaseInOilRate
            }
          }
        `
      })

      let { allActionOutcomes } = res.data
      let filteredOutcome = allActionOutcomes.filter(
        x => x.well.id === well.id && x.action.id === action.id
      )
      let len = filteredOutcome.length
      let singleActionOutcome = {
        id: 1,
        action,
        well,
        probabilityOfAnomaly: 0,
        cost: 0,
        manHours: 0,
        increaseInOilRate: 0
      }
      if (len > 0) {
        singleActionOutcome = _.take(filteredOutcome, 1)[0]
      }

      console.log('end wellActionOutcome', singleActionOutcome)

      return singleActionOutcome
    },

    async discoverIntervention(parent, { predictedMetrics, measuredMetrics }) {
      console.log(
        'begin discoverIntervention',
        predictedMetrics,
        measuredMetrics
      )

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
        id: 'No Intervention',
        name: 'No Intervention',
        type: 'Revenue Increase'
      }

      if (oilRateGap > 0.08) {
        action = {
          id: 'Hydraulic Fracturing',
          name: 'Hydraulic Fracturing',
          type: 'Revenue Increase'
        }
      }

      if (oilRateGap > 0.05 && oilRateGap <= 0.08) {
        action = {
          id: 'Acidizing',
          name: 'Acidizing',
          type: 'Revenue Increase'
        }
      }

      if (waterCutGap > 0.07) {
        action = {
          id: 'Water Shutoff',
          name: 'Water Shutoff',
          type: 'Revenue Increase'
        }
      }
      console.log('end discoverIntervention', action)

      return action
    },

    async shouldTestWell(parent, { healthIndex, lastTestDay, today }) {
      console.log('begin shouldTestWell', healthIndex, lastTestDay, today)

      let testGap = today - lastTestDay

      //SKIP_TEST_SAFE: anomaly prob = 0
      //SKIP_TEST_OK: anomaly prob = defined in data, per well
      //SKIP_TEST_RISKY: anomaly prob = 1
      let actionId =
        testGap > 60
          ? 'Risky To Skip Test'
          : healthIndex >= 0.8
          ? 'Safe To Skip Test'
          : healthIndex >= 0.5 && healthIndex < 0.8
          ? 'OK To Skip Test'
          : 'Risky To Skip Test'

      let action = {
        id: actionId,
        name: actionId,
        type: 'Cost Reduction'
      }
      console.log('end shouldTestWell', action)

      return action
    },

    async wellLastTestDate(parent, { well, today }) {
      console.log('begin wellLastTestDate', well, today)

      let res = await CKGClient.query({
        query: gql`
          {
            allMetricss {
              well {
                id
              }
              date
              type
              waterCut
              GOR
              oilRate
            }
          }
        `
      })

      let { allMetricss } = res.data
      let pastMeasuredMetrics = allMetricss.filter(
        x => x.date <= today && x.well.id === well.id && x.type === 'measured'
      )
      let len = pastMeasuredMetrics.length
      let date = 0
      if (len > 0) {
        let orderedMeasuredMetrics = _.orderBy(
          pastMeasuredMetrics,
          ['date'],
          ['desc']
        )
        let singleMeasurement = _.take(orderedMeasuredMetrics, 1)[0]
        date = singleMeasurement.date
      }

      console.log('end wellLastTestDate', date)

      return date
    },

    async healthIndex(parent, { predictedMetrics, measuredMetrics }) {
      console.log('begin healthIndex', predictedMetrics, measuredMetrics)

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

      hidx =
        (1 / 3) * waterCutHealthIndex +
        (1 / 3) * GORHealthIndex +
        (1 / 3) * oilRateHealthIndex
      console.log('end healthIndex', hidx)

      return hidx
    },

    async applyConstraints(parent, { opportunities, constraints }) {
      console.log('begin applyConstraints', opportunities, constraints)

      let totalBudget = constraints.budget
      let totalManHours = constraints.manHours

      _.forEach(opportunities, function(op) {
        op.sumBen = op.incrementalRevenue + op.costReduction
      })
      let orderedOpportunityByRevenueGain = _.orderBy(
        opportunities,
        ['sumBen', 'cost'],
        ['desc', 'asc']
      )
      _.forEach(orderedOpportunityByRevenueGain, function(op) {
        delete op.sumBen
      })

      let filteredOpporunities = orderedOpportunityByRevenueGain.filter(
        entry => {
          let { cost, manHours } = entry
          if (totalBudget - cost >= 0 && totalManHours - manHours >= 0) {
            totalBudget = totalBudget - cost
            totalManHours = totalManHours - manHours
            return true
          } else {
            return false
          }
        }
      )
      console.log('end applyConstraints', filteredOpporunities)
      return filteredOpporunities
    },

    async combineActionImpacts(parent, { well, costReduction, revenueGains }) {
      console.log(
        'begin combineActionImpacts',
        well,
        costReduction,
        revenueGains
      )
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
      console.log('end combineActionImpacts')

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

    async interventionRevenueGain(
      parent,
      { oilPrice, measuredMetrics, actionOutcome }
    ) {
      console.log(
        'begin interventionRevenueGain',
        oilPrice,
        measuredMetrics,
        actionOutcome
      )

      let { increaseInOilRate, cost, manHours } = actionOutcome
      let revenueIncrease =
        measuredMetrics.oilRate * oilPrice * 180 * increaseInOilRate
      console.log('end interventionRevenueGain', revenueIncrease)

      return [
        {
          id: faker.random.uuid(),
          action: actionOutcome.action,
          well: actionOutcome.well,
          impact: revenueIncrease,
          cost,
          manHours
        }
      ]
    },

    async skippingTestCostReduction(
      parent,
      { oilPrice, measuredMetrics, actionOutcome }
    ) {
      console.log(
        'begin skippingTestCostReduction',
        oilPrice,
        measuredMetrics,
        actionOutcome
      )

      let probabilityOfAnomaly = actionOutcome.probabilityOfAnomaly / 100
      let potentialCostOfSkippikingATest =
        measuredMetrics.oilRate * probabilityOfAnomaly * oilPrice * 60
      let costReduction = actionOutcome.cost
      let manHours = actionOutcome.manHours
      console.log(
        'end skippingTestCostReduction',
        potentialCostOfSkippikingATest
      )

      return [
        {
          id: faker.random.uuid(),
          action: actionOutcome.action,
          well: actionOutcome.well,
          impact: costReduction,
          cost: potentialCostOfSkippikingATest,
          manHours
        }
      ]
    },

    currentOilPrice() {
      console.log('in currentOilPrice')

      return 10
    },

    todayDate() {
      console.log('in todayDate')
      return 1222
    }
  }
}

initMetrics(SELF)

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log('Server is running on http://localhost:4000'))
