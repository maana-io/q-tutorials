import React, { Component } from "react"
import PropTypes from "prop-types"
import "./Constraints.css"
import NumberSelector from "./NumberSelector"

class Constraints extends Component {
  static propTypes = {
    onContraintsUpdate: PropTypes.func.isRequired,
  }

  state = {
    budget: 0,
    manHours: 0,
  }

  collectWellInterventionBudget = value => {
    this.setState({ budget: +value }, () => {
      this.props.onContraintsUpdate({ ...this.state })
    })
  }

  collectWorkoverRigCapacity = value => {
    this.setState({ manHours: +value }, () => {
      this.props.onContraintsUpdate({ ...this.state })
    })
  }

  render() {
    return (
      <div className="constraints">
        <div className="contratins__title">
          <span>Constraints</span>
        </div>
        <div className="contraints__controls">
          <NumberSelector
            title="Well Intervention Budget"
            collectValue={this.collectWellInterventionBudget}
            value={this.state.budget}
            isCurrency
          />
          <NumberSelector
            title="Workover Rig Capacity"
            collectValue={this.collectWorkoverRigCapacity}
            value={this.state.manHours}
          />
        </div>
      </div>
    )
  }
}

export default Constraints
