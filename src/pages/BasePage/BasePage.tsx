import {ReactComponentCompact} from "../../application/core/ReactComponentCompact";
import {Route, Switch, withRouter} from "react-router-dom";
import Welcome from "../Welcome/Welcome";
import Login from "../Login/Login";
import Extract from "../Extract/Extract";
import React from "react";

class BasePage extends ReactComponentCompact {
    render() {
        const location = this.props.location
        return (
            <Switch location={location}>
                <Route exact path={"/web"} component={ Welcome } />
                <Route exact path={"/web/login"} component={ Login } />
                <Route exact path={"/web/achieve/extract"} component={ Extract } />
            </Switch>
        )
    }
}

export default withRouter(BasePage)