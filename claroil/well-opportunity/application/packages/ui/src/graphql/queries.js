import gql from "graphql-tag"

export const GET_OPPORTUNITIES = gql`
  query getOpportunities($constraint: ConstraintAsInput!) {
    givenConstraintWhatAreOpportunities(constraint: $constraint) {
      name
      actions {
        name
        type
      }
      incrementalRevenue
      costReduction
      cost
      manHours
      well {
        name
      }
    }
  }
`

export const GET_OPPORTUNITIES_MOCK = gql`
  {
    recommendOpportunities(
      wells: [
        {
          id: "Co-01"
          name: "Co-01"
          measuredMetrics: [{ id: 1, waterCut: 19, GOR: 8, oilRate: 7, date: 1111 }]
          predictedMetrics: [
            { id: 1, waterCut: 9, GOR: 8, oilRate: 7, date: 1111 }
            { id: 2, waterCut: 9, GOR: 8, oilRate: 7, date: 1211 }
            { id: 3, waterCut: 9, GOR: 8, oilRate: 7, date: 1311 }
          ]
        }
        {
          id: "Co-02"
          name: "Co-02"
          measuredMetrics: [{ id: 1, waterCut: 19, GOR: 8, oilRate: 7, date: 1111 }]
          predictedMetrics: [
            { id: 1, waterCut: 9, GOR: 8, oilRate: 7, date: 1111 }
            { id: 2, waterCut: 9, GOR: 8, oilRate: 7, date: 1211 }
            { id: 3, waterCut: 9, GOR: 8, oilRate: 7, date: 1311 }
          ]
        }
        {
          id: "Cr-01"
          name: "Cr-01"
          measuredMetrics: [{ id: 1, waterCut: 19, GOR: 8, oilRate: 7, date: 1111 }]
          predictedMetrics: [
            { id: 1, waterCut: 9, GOR: 8, oilRate: 7, date: 1111 }
            { id: 2, waterCut: 9, GOR: 8, oilRate: 7, date: 1211 }
            { id: 3, waterCut: 9, GOR: 8, oilRate: 7, date: 1311 }
          ]
        }
      ]
      constraint: { id: 1, budget: 150000, manHours: 500 }
    ) {
      id
      name
      createdAt
      actions {
        id
        type
      }
      incrementalRevenue
      costReduction
      cost
      well {
        name
      }
      manHours
    }
  }
`
