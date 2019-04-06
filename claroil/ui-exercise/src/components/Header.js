import React from "react";
import "./Header.css";
import claroilLogo from "../assets/claroil-logo.png";

const Header = () => (
  <header className="header">
    <div className="claroil-logo__container">
      <img src={claroilLogo} alt="Claroil Logo" className="claroil-logo" height="55" />
      <span className="header__claroil-title">Claroil E&P</span>
    </div>
    <div className="header__title-container">
      <h1 className="header__title">Zinc Oilfield - Operations Knowledge Portal</h1>
    </div>
    <div className="maana-logo__container">
      <img
        src="https://demo03.knowledge.maana.io/logo.png"
        alt="Maana Logo"
        className="maana-logo"
        height="30"
      />
    </div>
  </header>
);

export default Header;
