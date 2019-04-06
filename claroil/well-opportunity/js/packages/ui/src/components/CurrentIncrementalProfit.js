import React, { Component } from "react"
import PropTypes from "prop-types"
import { Pie } from "react-chartjs-2"
import "chartjs-plugin-datalabels"

import { formatCurrency } from "../helpers/currency.helper"
import Opportunities from "./opportunities"
import "./CurrentIncrementalProfit.css"
import { COST_SAVING, REVENUE_GAIN } from "../constants"

class CurrentIncrementalProfit extends Component {
  static propTypes = {
    opportunities: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        createdAt: PropTypes.string,
        actions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
            type: PropTypes.string,
          })
        ),
        incrementalRevenue: PropTypes.number,
        costReduction: PropTypes.number,
        cost: PropTypes.number,
        well: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string
        }),
        manHours: PropTypes.number
      })
    ),
  }

  state = {
    chartData: {},
    revenueOpportunities: [],
    costSavingsOpportunities: [],
  }

  chartRef = React.createRef()

  componentDidMount() {
    this.processOpportunities(this.props.opportunities)
  }

  componentWillReceiveProps(nextProps) {
    this.processOpportunities(nextProps.opportunities)
  }

  processOpportunities = opportunities => {
    const [costReduction, incrementalRevenue] = this.getCostAndRevenue(opportunities)
    let chartData = {
      labels: ["Cost Savings", "Incremental Revenue"],
      datasets: [
        {
          data: [costReduction, incrementalRevenue],
          backgroundColor: ["#fed966", "#8fabdd"],
        },
      ],
    }

    let revenueOpportunities = []
    let costSavingsOpportunities = []

    opportunities.forEach(item => {
      item.actions.forEach(action => {
        if (action.type === REVENUE_GAIN) {
          revenueOpportunities.push({ ...item, action: { ...action } })
        } else if (action.type === COST_SAVING) {
          costSavingsOpportunities.push({ ...item, action: { ...action } })
        }
      })
    })

    this.setState(
      { chartData, revenueOpportunities, costSavingsOpportunities },
      () => this.chartRef.current.chartInstance.update()
    )
  }

  getCostAndRevenue(opportunities) {
    const incrementalRevenue = opportunities.reduce(
      (total, item) => item.incrementalRevenue + total,
      0
    )

    const costReduction = opportunities.reduce(
      (total, item) => item.costReduction + total,
      0
    )

    return [costReduction, incrementalRevenue]
  }
  render() {
    return (
      <div className="cip">
        <h2>Current Incremental Profit Opportunities</h2>
        <div className="cip__data">
          <Opportunities data={this.state.revenueOpportunities} />
          <div className="chart-container">
            <h2>
              {this.state.chartData.datasets &&
                formatCurrency(
                  this.state.chartData.datasets[0].data.reduce(
                    (total, item) => total + item,
                    0
                  )
                )}
            </h2>
            <Pie
              ref={this.chartRef}
              data={this.state.chartData}
              width={250}
              height={250}
              options={{
                legend: { display: true, position: "bottom" },
                tooltips: { enabled: false },
                plugins: {
                  datalabels: {
                    color: ["#111", "#111"],
                    align: "center",
                    font: {
                      size: "22",
                      weight: "bold",
                    },
                    formatter: formatCurrency,
                  },
                },
              }}
            />
          </div>
          <Opportunities
            title="Operating Cost Reduction Opportunities"
            data={this.state.costSavingsOpportunities}
            type={COST_SAVING}
          />
        </div>
      </div>
    )
  }
}

export default CurrentIncrementalProfit
