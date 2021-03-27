import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter as Router, Route} from "react-router-dom";
import Login from "./pages/Login/Login";
import Extract from "./pages/Extract/Extract";

ReactDOM.render(
    <Router>
        <Route path={"/"} component={ Login } />
        <Route path={"/extract/:access_token"} component={ Extract } />
    </Router>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
