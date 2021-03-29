import "./Login.css"

import {Button, Card, CardContent, Grid, LinearProgress, TextField, Typography} from "@material-ui/core";
import React from "react";
import {LoginCallback, LoginHelper} from "../../application/helper/LoginHelper";
import {CurlToolException} from "../../application/util/CurlUnit";
import {UserInfoCallback, UserInfoHelper} from "../../application/helper/UserInfoHelper";
import {ReactComponentCompact} from "../../application/core/ReactComponentCompact";
import {withRouter} from "react-router-dom";

class Login extends ReactComponentCompact {
    accessToken: string = "b76ee32c376c19a7.MjAxOTQwMDEwMDc0JjE2MTY2NTE3MDYl.d5a4728a9e389970"
    refreshToken: string = "b76ee32c376c19a7.MjAxOTQwMDEwMDc0JjE2MTY2NTE3MDYl.d5a4728a9e389970"

    state = {
        username: "",
        password: "",

        login_action: false,
        login_progress: "none",
    };

    componentDidMount() {
        if (!ReactComponentCompact.setup){
            this.props.history.push("/")
        }
    }

    onLoginAction() {
        if (this.state.username === "" || this.state.password === ""){
            alert("账号或密码为空")
            return
        }
        this.setState({
            login_action: true,
            login_progress: "block",
        })
        const this_onLoginAction = this
        new LoginHelper().login(this.state.username, this.state.password, new class implements LoginCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                this_onLoginAction.setState({
                    login_action: false,
                    login_progress: "none",
                })
                alert("登录失败。" + message)
            }

            onResult(access: string, refresh: string) {
                this_onLoginAction.accessToken = access
                this_onLoginAction.refreshToken = refresh
                this_onLoginAction.getUserInfo()
            }
        }())
    }

    getUserInfo(){
        const this_getUserInfo = this
        new UserInfoHelper(this.accessToken).getUserInfo(new class implements UserInfoCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                this_getUserInfo.setState({
                    login_action: false,
                    login_progress: "none",
                })
                alert("用户信息获取失败。" + message)
            }

            onResult(name: string, identify: number, level: number, faculty: string, specialty: string, userClass: string, grade: number) {
                if (identify !== 1 && level < 80){
                    this_getUserInfo.setState({
                        login_action: false,
                        login_progress: "none",
                    })
                    alert("用户权限不足。")
                    return
                }
                const sp = this_getUserInfo.getSharedPreference("user").edit()
                sp.putBoolean("is_login", true)
                    .putString("access_token", this_getUserInfo.accessToken)
                    .putString("refresh_token", this_getUserInfo.refreshToken)
                    .putNumber("access_expired", Math.round(new Date().getMilliseconds() / 1000 + 2592000))
                    .putNumber("refresh_expired", Math.round(new Date().getMilliseconds() / 1000 + 124416000))
                    .putString("name", name)
                    .putNumber("identify", identify)
                    .putNumber("level", level)
                    .putString("faculty", faculty)
                    .putString("specialty", specialty)
                    .putString("userClass", userClass)
                    .putNumber("grade", grade)
                    .apply()
                this_getUserInfo.props.history.replace("/extract")
            }
        }())
    }

    render() {
        return (
            <Card className={"login-base"}>
                <LinearProgress style={{display: this.state.login_progress}}/>
                <CardContent className={"login-content"}>
                    <Typography gutterBottom variant={"inherit"} component={"h2"}>
                        登录
                    </Typography>
                    <Typography component={"p"} color={"textSecondary"}>
                        请使用教务系统账号密码登录
                    </Typography>
                    <Grid container spacing={2} justify={"center"} style={{marginTop: 10}}>
                        <Grid item xs={12}>
                            <TextField onChange={(event) => {
                                this.setState({username: event.target.value})
                            }} disabled={this.state.login_action} value={this.state.username} size={"small"}
                                       label={"工号或学号"} fullWidth={true} variant="outlined"/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField size={"small"}
                                       label={"密码"} onChange={(event) => {
                                this.setState({password: event.target.value})
                            }} disabled={this.state.login_action} type={"password"} value={this.state.password}
                                       fullWidth={true} variant="outlined"/>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                variant={"contained"} disabled={this.state.login_action}
                                color={"primary"} onClick={this.onLoginAction.bind(this)} fullWidth={true}>
                                登录
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    }
}

export default withRouter(Login)