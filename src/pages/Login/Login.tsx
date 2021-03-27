import './Login.css';

import {Button, Card, CardContent, Grid, TextField, Typography} from "@material-ui/core";
import React from "react";
import { History, createBrowserHistory } from "history"

interface Props {
    history: History
}

export default class Login extends React.Component {
    username: string = ""
    password: string = ""

    history = createBrowserHistory()

    onLoginAction(){
        this.context.history.push("/extract")
    }

    render() {
        return (
            <Card className={"login-base"}>
                <CardContent>
                    <Typography gutterBottom variant={"inherit"} component={"h2"}>
                        登录
                    </Typography>
                    <Typography component={"p"} color={"textSecondary"}>
                        请使用教务系统账号密码登录
                    </Typography>
                    <Grid container spacing={2} justify={"center"}>
                        <Grid item xs={12}>
                            <TextField label={"工号或学号"} onChange={(event) => {
                                this.username = event.target.value
                            }} value={this.username} fullWidth={true} variant="outlined"/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label={"密码"} onChange={(event) => {
                                this.password = event.target.value
                            }} value={this.password} fullWidth={true} variant="outlined"/>
                        </Grid>
                        <Grid item xs={6}>
                            <Button variant={"contained"} color={"primary"} onClick={this.onLoginAction} fullWidth={true}>登录</Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    }
}
