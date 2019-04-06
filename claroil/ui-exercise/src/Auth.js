import Auth0Lock from "auth0-lock";

const RENEW_TOKEN_TIMER_OFFSET = 60000; // 60 seconds

export default class Auth {
  constructor() {
    // create the base Auth0 Lock object and add our listeners to it
    this.lock = new Auth0Lock(
      process.env.REACT_APP_AUTH_CLIENT_ID,
      process.env.REACT_APP_AUTH_DOMAIN,
      {
        autoClose: true,
        closable: false,
        rememberLastLogin: false,
        languageDictionary: {
          title: "Well Simulation"
        },
        auth: {
          redirectUrl: `${window.location.protocol}//${
            window.location.host
          }/callback`,
          responseType: "token id_token",
          audience: process.env.REACT_APP_AUTH_AUDIENCE,
          params: {
            scope: "openid profile email"
          }
        }
      }
    )
      .on("authenticated", this.handleAuthenticated)
      .on("authorization_error", this.handleError);

    // schedule a token renewal if we already have a valid access token
    this.scheduleRenewal();
  }

  /**
   * Displays the Auth0 login screen
   */
  login = () => this.lock.show();

  /**
   * Handles errors during authentication
   *
   * @param {Error} err that happened during auth
   */
  handleError = err => {
    console.error("Issue during authentication", err);
    alert(`Error: ${err.error}. Check the console for further details.`);
    // return us to the homepage, as we should be at /callback right now
    window.location.pathname = "/";
  };

  /**
   * Handles saving authentication once we are done signing in
   *
   * @param {Object} authResult contains the results of authentication
   */
  handleAuthenticated = authResult => {
    // save the session information
    this.setSession(authResult);

    // get the users profile information
    this.lock.getUserInfo(authResult.accessToken, (err, profile) => {
      if (err) {
        console.error("Issue getting user information", err);
        alert(`Error: ${err.error}. Check the console for further details.`);
        // return us to the homepage, as we should be at /callback right now
        window.location.pathname = "/";
        return;
      }

      // save the profile
      localStorage.setItem("profile", JSON.stringify(profile));

      // return us to the homepage, as we should be at /callback right now
      window.location.pathname = "/";
    });
  };

  /**
   * Pulls the access token out of local storage and returns it
   *
   * @returns {string} the current access token
   */
  getAccessToken = () => {
    return localStorage.getItem("access_token");
  };

  /**
   * Pulls the profile out of local storage and returns it
   *
   * @returns {Object} the users profile information
   */
  getProfile = () => {
    const profile = localStorage.getItem("profile");
    if (!profile) {
      return {};
    }
    return JSON.parse(profile);
  };

  /**
   * saves the information from authenication and schedules a token refresh
   *
   * @param {Object} authResult contains the information about authentication
   */
  setSession(authResult) {
    // Set the time that the access token will expire at
    let expiresAt = JSON.stringify(authResult.expiresIn * 1000 + Date.now());

    localStorage.setItem("access_token", authResult.accessToken);
    localStorage.setItem("id_token", authResult.idToken);
    localStorage.setItem("expires_at", expiresAt);

    // schedule a token renewal
    this.scheduleRenewal();
  }

  /**
   * Tries to renew the users access token
   */
  renewToken() {
    this.lock.checkSession({}, (err, result) => {
      if (err) {
        this.handleError(err);
      } else {
        this.setSession(result);
      }
    });
  }

  /**
   * When we have a valid access token schedule for it to be renewed.
   */
  scheduleRenewal() {
    const storedData = localStorage.getItem("expires_at");
    if (storedData) {
      const expiresAt = JSON.parse(storedData);
      const delay = expiresAt - Date.now() - RENEW_TOKEN_TIMER_OFFSET;
      if (delay > 0) {
        this.tokenRenewalTimeout = setTimeout(() => {
          this.renewToken();
        }, delay);
      }
    }
  }

  /**
   * Deletes the saved information from local storage
   */
  logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("profile");
  };

  /**
   * Checks is the user is currently authenticated
   *
   * @returns {boolean} True when the user is currently authenticated
   */
  isAuthenticated = () => {
    // Check whether the current time is past the
    // access token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem("expires_at"));
    const delay = expiresAt - Date.now() - RENEW_TOKEN_TIMER_OFFSET;
    return delay > 0;
  };
}
