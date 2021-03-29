import React from "react";
import {SharedPreferences} from "./SharedPreferences";
import {RouteComponentProps} from "react-router-dom"

export class ReactComponentCompact extends React.Component<RouteComponentProps, any> {
    protected static setup = false

    protected getSharedPreference(name: string): SharedPreferences {
        return SharedPreferences.getInterface(name)
    }
}