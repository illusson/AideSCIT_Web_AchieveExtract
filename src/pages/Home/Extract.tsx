import './Extract.css';

import {
    AppBar,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress, MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Toolbar,
    Typography
} from "@material-ui/core";
import React, {ChangeEvent} from "react";
import XLSX from 'xlsx';
import {LoginCallback, LoginHelper} from "../../util/helper/LoginHelper";
import {CurlToolException} from "../../util/core/CurlUnit";
import {UserInfoCallback, UserInfoHelper} from "../../util/helper/UserInfoHelper";
import {DayCallback, DayHelper} from "../../util/helper/DayHelper";
import {ExtractHelper} from "../../util/helper/ExtractHelper";

export default class Extract extends React.Component {
    accessToken: string = "b76ee32c376c19a7.MjAxOTQwMDEwMDc0JjE2MTY2NTE3MDYl.d5a4728a9e389970"
    file: File | null | undefined = null
    findFile: HTMLInputElement | null = null
    arrayBuffer: string | ArrayBuffer | null = null
    task_id: number | undefined

    state = {
        username: "",
        password: "",

        name: "赵海天 同学",
        filePath: "",
        targetTaskData: [
            {uid: "暂无数据", name: ""},
        ],
        yearData: [""],
        semesterData: [1, 2],
        year: "",
        semester: 0,
        targetTaskCount: 0,
        targetTaskPosted: 0,
        targetTaskSuccess: 0,

        page1: 0,
        rowsPerPage1: 10,
        page2: 0,
        rowsPerPage2: 10,
        page3: 0,
        rowsPerPage3: 10,

        warnData: [
            {uid: "暂无数据", name: "", nameDatabase: ""},
        ],
        failedData: [
            {uid: "暂无数据", name: "", reason: ""},
        ],

        login_base_display: this.accessToken === "" ? "block" : "none",
        extract_base_display: this.accessToken === "" ? "none" : "block",
        action_doing: false,
        login_action_progress: "none",
    };

    componentDidMount() {
        const this_getDayData = this
        new DayHelper().get(new class implements DayCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                this_getDayData.setState({
                    login_action: true,
                })
                alert("学年信息获取失败，请尝试刷新网页")
                return
            }

            onResult(semester: number, school_year: string) {
                const year: number = Number.parseInt(school_year.split("-", 2)[0])
                const yearData = []
                for (let i = year - 5; i <= year; i++){
                    yearData.push(i.toString() + "-" + (i + 1).toString())
                }
                this_getDayData.setState({
                    yearData: yearData,
                    semester: semester,
                    year: school_year,
                })
            }
        }())
    }

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
                    this_getUserInfo.setState({
                        login_action: false,
                        login_action_progress: "none",
                    })
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

    getFilePath(){
        this.findFile?.click()
    }

    onReadData(e: ChangeEvent<HTMLInputElement>, context: Extract){
        context.file = e.target.files?.item(0)
        if (context.file == null){
            return
        }
        if (!context.file.name.endsWith(".xlsx")){
            alert("仅支持xlsx文件")
            return;
        }
        let fileReader = new FileReader();
        fileReader.onload = () => {
            this.arrayBuffer = fileReader.result;
            const data = new Uint8Array(this.arrayBuffer as ArrayBuffer);
            const arr = [];
            for(let i = 0; i !== data.length; ++i){
                arr[i] = String.fromCharCode(data[i])
            }
            const bstr = arr.join("");
            try {
                const book = XLSX.read(bstr, { type: "binary" })
                let data: any[] = [];
                data = data.concat(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 }));
                let uid_index = -1;
                let name_index = -1;
                for (let i = 0; i < data[0].length; i++){
                    if (data[0][i] === "学号"){
                        uid_index = i
                        continue
                    }
                    if (data[0][i] === "姓名"){
                        name_index = i
                    }
                }
                if (name_index < 0 || uid_index < 0){
                    alert("文件识别失败。")
                    return;
                }
                let targetTaskData = [];
                for (let i = 1; i < data.length; i++){
                    targetTaskData.push({
                        uid: data[i][uid_index],
                        name: data[i][name_index],
                    })
                }
                context.setState({
                    targetTaskData: targetTaskData,
                    targetTaskCount: data.length - 1,
                })
            } catch (e) {
                alert("文件格式不正确。" + e.message)
                return;
            }
        }
        context.setState({filePath: context.file.name})
        fileReader.readAsArrayBuffer(context.file);
    }

    onPostData(){
        let count = this.state.targetTaskCount

        let postCount: number = 0
        while (postCount < count){
            const random = this.GetRandomNum(80, 99)
            let postStart = postCount
            let postEnd = postCount + random
            if (postEnd >= count){
                postEnd = count - 1
            } else {
                postCount += random + 1
            }
            const data = []
            for(let i = postStart; i <= postEnd; ++i){
                data.push(this.state.targetTaskData[i])
            }
            new ExtractHelper(this.accessToken).add(this.state.semester, this.state.year, data)
        }
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
                            <Grid container spacing={2} justify={"center"} style={{marginTop: 10}}>
                                <Grid item xs={12}>
                                    <TextField onChange={(event) => {
                                        this.setState({username: event.target.value})
                                    }} disabled={this.state.action_doing} value={this.state.username} size={"small"}
                                               label={"工号或学号"} fullWidth={true} variant="outlined"/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField size={"small"}
                                               label={"密码"} onChange={(event) => {
                                        this.setState({password: event.target.value})
                                    }} disabled={this.state.action_doing} type={"password"} value={this.state.password}
                                               fullWidth={true} variant="outlined"/>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        variant={"contained"} disabled={this.state.action_doing}
                                        color={"primary"} onClick={this.onLoginAction.bind(this)} fullWidth={true}>
                                        登录
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </div>
                <div style={{display: this.state.extract_base_display}}>
                    <AppBar position={"static"}>
                        <Toolbar>
                            <Typography variant="h6" style={{flexGrow: 1}}>
                                批量成绩单导出
                            </Typography>
                            <Typography component="p">
                                您好，{this.state.name}
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <div className={"extract-base"}>
                        <Grid container spacing={2} justify={"center"}>
                            <Grid item xs={2} />
                            <Grid item xs={6} style={{width: 400}}>
                                <TextField
                                    variant="outlined" label={"文件"} fullWidth={true}
                                    disabled={true} value={this.state.filePath} size={"small"}
                                />
                                <input
                                    ref={input => this.findFile = input} onChange={(e) => {
                                    this.onReadData(e, this)
                                }} style={{display: "none"}} type={"file"} accept={".xlsx"} />
                            </Grid>
                            <Grid item xs={2}>
                                <Button
                                    fullWidth={true} color={"primary"} variant={"contained"}
                                    disabled={this.state.action_doing}
                                    onClick={this.getFilePath.bind(this)}>
                                    选择
                                </Button>
                            </Grid>
                            <Grid item xs={2} />
                            <Grid item xs={12}>
                                <Card>
                                    <TableContainer style={{maxHeight: 350}}>
                                        <Table stickyHeader aria-label="sticky table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>学号</TableCell>
                                                    <TableCell>姓名</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>{
                                                this.state.targetTaskData.slice(
                                                    this.state.page1 * this.state.rowsPerPage1, this.state.page1 * this.state.rowsPerPage1 + this.state.rowsPerPage1
                                                ).map((row) => {
                                                    return (
                                                        <TableRow hover role="checkbox" tabIndex={-1} key={row.uid}>
                                                            <TableCell scope="row">{row.uid}</TableCell>
                                                            <TableCell align="left">{row.name}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            }</TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 100]}
                                        component="div"
                                        count={this.state.targetTaskData.length}
                                        rowsPerPage={this.state.rowsPerPage1}
                                        page={this.state.page1}
                                        onChangePage={(event: unknown, newPage: number) => {
                                            this.setState({page1: newPage})
                                        }}
                                        onChangeRowsPerPage={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            this.setState({
                                                rowsPerPage1: +event.target.value,
                                                page1: 0
                                            })
                                        }} />
                                </Card>
                            </Grid>
                            <Grid item xs={3} />
                            <Grid item xs={3}>
                                <FormControl fullWidth={true}>
                                    <InputLabel>学年</InputLabel>
                                    <Select
                                        value={this.state.year}
                                        onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                                            this.setState({
                                                year: event.target.value as string
                                            })
                                        }}
                                        displayEmpty>
                                        {
                                            this.state.yearData.map((row) => {
                                                return (
                                                    <MenuItem value={row}>{row}</MenuItem>
                                                );
                                            })
                                        }
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <FormControl fullWidth={true}>
                                    <InputLabel>学期</InputLabel>
                                    <Select
                                        value={this.state.semester}
                                        onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                                            this.setState({
                                                semester: Number.parseInt(event.target.value as string)
                                            })
                                        }}
                                        displayEmpty>
                                        {
                                            this.state.semesterData.map((row) => {
                                                return (
                                                    <MenuItem value={row}>{row}</MenuItem>
                                                );
                                            })
                                        }
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3} />
                            <Grid item xs />
                            <Grid item xs={5}>
                                <Button
                                    color={"primary"} variant={"contained"}
                                    fullWidth={true} disabled={this.state.filePath === "" || this.state.action_doing}
                                    onClick={this.onPostData.bind(this)}>
                                    提交
                                </Button>
                            </Grid>
                            <Grid item xs />
                            <Grid item xs={12}>
                                <Typography component={"p"} color={"textSecondary"} style={{textAlign: "center"}}>
                                    已提交 {this.state.targetTaskPosted} 条数据，其中处理成功 {this.state.targetTaskSuccess} 条，共 {this.state.targetTaskCount} 条
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant={"h6"} component={"p"}>
                                    错误项
                                </Typography>
                                <Typography component={"p"} color={"textSecondary"}>
                                    以下表格中列出导出成绩单时出错的项目
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <TableContainer style={{maxHeight: 350}}>
                                        <Table stickyHeader aria-label="sticky table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>学号</TableCell>
                                                    <TableCell>姓名</TableCell>
                                                    <TableCell>错误原因</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>{
                                                this.state.failedData.slice(
                                                    this.state.page2 * this.state.rowsPerPage2, this.state.page2 * this.state.rowsPerPage2 + this.state.rowsPerPage2
                                                ).map((row) => {
                                                    return (
                                                        <TableRow key={row.uid}>
                                                            <TableCell scope="row">{row.uid}</TableCell>
                                                            <TableCell align="right">{row.name}</TableCell>
                                                            <TableCell align="right">{row.reason}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            }</TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 100]}
                                        component="div"
                                        count={this.state.failedData.length}
                                        rowsPerPage={this.state.rowsPerPage2}
                                        page={this.state.page2}
                                        onChangePage={(event: unknown, newPage: number) => {
                                            this.setState({page2: newPage})
                                        }}
                                        onChangeRowsPerPage={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            this.setState({
                                                rowsPerPage2: +event.target.value,
                                                page2: 0
                                            })
                                        }} />
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant={"h6"} component={"p"}>
                                    警告项
                                </Typography>
                                <Typography component={"p"} color={"textSecondary"}>
                                    以下表格中列出所提交的学生的姓名与数据库中已有数据不一致的项目
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <TableContainer style={{maxHeight: 350}}>
                                        <Table stickyHeader aria-label="sticky table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>学号</TableCell>
                                                    <TableCell>提交的姓名</TableCell>
                                                    <TableCell>数据库中的姓名</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>{
                                                this.state.warnData.slice(
                                                    this.state.page3 * this.state.rowsPerPage3, this.state.page3 * this.state.rowsPerPage3 + this.state.rowsPerPage3
                                                ).map((row) => {
                                                    return (
                                                        <TableRow key={row.uid}>
                                                            <TableCell scope="row">{row.uid}</TableCell>
                                                            <TableCell align="right">{row.name}</TableCell>
                                                            <TableCell align="right">{row.nameDatabase}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            }</TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 100]}
                                        component="div"
                                        count={this.state.warnData.length}
                                        rowsPerPage={this.state.rowsPerPage3}
                                        page={this.state.page3}
                                        onChangePage={(event: unknown, newPage: number) => {
                                            this.setState({page3: newPage})
                                        }}
                                        onChangeRowsPerPage={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            this.setState({
                                                rowsPerPage3: +event.target.value,
                                                page3: 0
                                            })
                                        }} />
                                </Card>
                            </Grid>
                        </Grid>
                    </div>
                </div>
            </div>
        );
    }

    public GetRandomNum(min: number, max: number): number {
        const range = min - max;
        const rand = Math.random();
        return min + Math.round(rand * range);
    }
}
