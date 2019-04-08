import React, { Component } from "react"
import PropTypes from "prop-types"

class Dropdown extends Component {
  static propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool,
    text: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        action: PropTypes.func.isRequired,
      })
    ),
  }

  static defaultProps = {
    className: "btn-primary",
    small: false,
  }

  dropdown = React.createRef()

  state = {
    optionsVisible: false,
  }

  constructor(props) {
    super(props)
    this.handleDropdownClick = this.handleDropdownClick.bind(this)
    this.handleOutsideClick = this.handleOutsideClick.bind(this)
  }

  handleDropdownClick(e) {
    this.setState({ optionsVisible: !this.state.optionsVisible })
  }

  handleOutsideClick(e) {
    if (this.dropdown.current && !this.dropdown.current.contains(e.target)) {
      this.setState({ optionsVisible: false })
    }
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleOutsideClick, false)
  }

  componentWillMount() {
    document.removeEventListener("mousedown", this.handleOutsideClick, false)
  }

  render() {
    return (
      <div className="dropdown" ref={this.dropdown}>
        <button
          className={`btn ${this.props.className} ${
            this.props.small ? "btn-sm" : ""
          } dropdown-toggle`}
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={this.handleDropdownClick}
        >
          {this.props.text}
        </button>
        <div
          className={`dropdown-menu ${this.state.optionsVisible && "show"}`}
          aria-labelledby="dropdownMenuButton"
        >
          {this.props.actions.map(item => (
            <button className="dropdown-item" onClick={item.action} key={item.name}>
              {item.name}
            </button>
          ))}
        </div>
      </div>
    )
  }
}

export default Dropdown
