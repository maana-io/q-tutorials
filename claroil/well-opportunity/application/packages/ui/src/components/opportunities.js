import React from "react"
import PropTypes from "prop-types"

import { formatCurrency } from "../helpers/currency.helper"
import { REVENUE_GAIN } from "../constants"

import "./opportunities.css"

const Opportunities = props => {
  const isRevenue = props.type === REVENUE_GAIN
  const tableClass = `opportunities ${
    isRevenue ? "opportunities--revenue" : "opportunities--savings"
  }`

  return (
    <div className={tableClass}>
      <h3 className="opportunities__title">{props.title}</h3>
      <table className="table opportunities__table">
        <thead>
          <tr>
            <th className="well">Well</th>
            <th>Recommended {isRevenue ? "Intervention" : "Action"}</th>
            <th>{isRevenue ? "Incremental Profit" : "Cost Saving"}</th>
            <th className="sme-feedback">SME Feedback</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, i) => (
            <tr key={row.id}>
              <td>{row.well.name}</td>
              <td className="opportunities__recommendation">{row.action.id}</td>
              <td className="opportunities__cost-profit">
                {formatCurrency(
                  isRevenue ? row.incrementalRevenue : row.costReduction
                )}
              </td>
              <td className="opportunities__actions">
                <button
                  className={`btn btn-sm ${
                    isRevenue ? "btn-primary" : "btn-warning"
                  }`}
                >
                  Accept
                </button>
                <button
                  className={`btn btn-sm ${
                    isRevenue ? "btn-primary" : "btn-warning"
                  }`}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Opportunities.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      createdAt: PropTypes.string,
      action: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        type: PropTypes.string,
      }),
      incrementalRevenue: PropTypes.number,
      costReduction: PropTypes.number,
      cost: PropTypes.number,
      well: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      }),
      manHours: PropTypes.number,
    })
  ),
  title: PropTypes.string,
  type: PropTypes.string,
}

Opportunities.defaultProps = {
  data: [],
  title: "Incremental Revenue Opportunities",
  type: REVENUE_GAIN,
}

export default Opportunities
