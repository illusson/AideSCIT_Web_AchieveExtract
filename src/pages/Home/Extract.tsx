import './Extract.css';

import {Button, Card, CardContent, Grid, LinearProgress, TextField, Typography} from "@material-ui/core";
import React from "react";
import {LoginCallback, LoginHelper} from "../../util/helper/LoginHelper";
import {CurlCall, CurlCallback, CurlToolException} from "../../util/core/CurlUnit";
import {APIHelper} from "../../util/helper/APIHelper";
import {UserInfoCallback, UserInfoHelper} from "../../util/helper/UserInfoHelper";

// interface Props {
//     history: History
// }

export default class Extract extends React.Component {
    accessToken: string = ""

    state = {
        username: "",
        password: "",

        name: "",

        login_base_display: "block",
        extract_base_display: "none",
        login_action: false,
        login_action_progress: "none",
    };

    onLoginAction() {
        if (this.state.username === "" || this.state.password === ""){
            alert("账号或密码为空")
            return
        }
        this.setState({
            login_action: true,
            login_action_progress: "block",
        })
        const this_onLoginAction = this
        new LoginHelper().login(this.state.username, this.state.password, new class implements LoginCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                this_onLoginAction.setState({
                    login_action: false,
                    login_action_progress: "none",
                })
                alert("登录失败。" + message)
            }

            onResult(access: string, refresh: string) {
                this_onLoginAction.accessToken = access
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
                    login_action_progress: "none",
                })
                alert("用户信息获取失败。" + message)
            }

            onResult(name: string, identify: number, level: number, faculty: string, specialty: string, userClass: string, grade: number) {
                if (identify !== 1 && level < 80){
                    alert("用户权限不足。")
                    return
                }
                let ide: string[] = ["同学", "老师"];
                this_getUserInfo.setState({
                    login_action: false,
                    login_action_progress: "none",
                    login_base_display: "none",
                    extract_base_display: "block",
                    name: name + " " + ide[identify]
                })
            }
        }())
    }

    render() {
        return (
            <div>
                <div style={{display: this.state.login_base_display}}>
                    <Card className={"login-base"}>
                        <LinearProgress style={{display: this.state.login_action_progress}}/>
                        <CardContent className={"login-content"}>
                            <Typography gutterBottom variant={"inherit"} component={"h2"}>
                                登录
                            </Typography>
                            <Typography component={"p"} color={"textSecondary"}>
                                请使用教务系统账号密码登录
                            </Typography>
                            <Grid container spacing={2} justify={"center"}>
                                <Grid item xs={12}>
                                    <TextField label={"工号或学号"} onChange={(event) => {
                                        this.setState({username: event.target.value})
                                    }} disabled={this.state.login_action} value={this.state.username} fullWidth={true} variant="outlined"/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label={"密码"} onChange={(event) => {
                                        this.setState({password: event.target.value})
                                    }} disabled={this.state.login_action} value={this.state.password} fullWidth={true} variant="outlined"/>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant={"contained"} disabled={this.state.login_action}
                                            color={"primary"} onClick={this.onLoginAction.bind(this)} fullWidth={true}>
                                        登录
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </div>
                <div style={{display: this.state.extract_base_display}}>

                </div>
            </div>
        );
    }
}
