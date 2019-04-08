import React, { Component } from "react"
import Currency from "react-currency-formatter"
import PropTypes from "prop-types"
import "./NumberSelector.css"

class NumberSelector extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    collectValue: PropTypes.func.isRequired,
    isCurrency: PropTypes.bool,
  }

  static defaultProps = {
    isCurrency: false,
    value: 0,
  }

  state = {
    isEditing: false,
  }

  inputRef = React.createRef()

  enableEditing = () => {
    this.setState({ isEditing: true })
  }

  emitValue = () => {
    this.setState({ isEditing: false })
    this.props.collectValue(this.inputRef.current.value)
  }

  render() {
    const formattedValue = this.props.isCurrency ? (
      <span className="number-selector__value" onClick={this.enableEditing}>
        <Currency quantity={this.props.value} />
      </span>
    ) : (
      <span className="number-selector__value" onClick={this.enableEditing}>
        {this.props.value}
      </span>
    )
    return (
      <div className="number-selector">
        <span className="number-selector__title">{this.props.title}</span>
        {this.state.isEditing ? (
          <input
            type="number"
            name=""
            ref={this.inputRef}
            className="number-selector__value"
            autoFocus
            defaultValue={this.props.value}
          />
        ) : (
          formattedValue
        )}
        <button
          className="btn btn-sm btn-dark"
          onClick={this.emitValue}
          disabled={!this.state.isEditing}
          type="button"
        >
          Change
        </button>
      </div>
    )
  }
}

export default NumberSelector
