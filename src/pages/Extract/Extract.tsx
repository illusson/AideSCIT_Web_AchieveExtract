import './Extract.css';

import {
    AppBar,
    Button,
    Card,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
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
import {ExtractAddCallback, ExtractDoneCallback, ExtractHelper} from "../../application/helper/ExtractHelper";
import {ReactComponentCompact} from "../../application/core/ReactComponentCompact";
import {withRouter} from "react-router-dom";
import {CurlToolException} from "../../application/util/CurlUnit";
import {
    ExtractAddStatusData,
    FailedTaskInfo,
    SingleTaskInfo,
    WarnTaskInfo
} from "../../application/data/ExtractAddStatusData";

class Extract extends ReactComponentCompact {
    file: File | null | undefined = null
    findFile: HTMLInputElement | null = null
    arrayBuffer: string | ArrayBuffer | null = null
    task_id: number | undefined

    state = {
        name: "赵海天 同学",
        filePath: "",
        extractButton: "提交",
        targetTaskData: new Array<SingleTaskInfo>(),
        yearData: [""],
        semesterData: [1, 2],
        year: "",
        semester: 1,
        targetTaskCount: 0,
        targetTaskPosted: 0,
        targetTaskSuccess: 0,
        extractResultLink: "",
        extractResultSeverity: 'success',

        page1: 0,
        rowsPerPage1: 10,
        page2: 0,
        rowsPerPage2: 10,
        page3: 0,
        rowsPerPage3: 10,

        warnData: new Array<WarnTaskInfo>(),
        failedData: new Array<FailedTaskInfo>(),

        action_doing: false,
        login_action_progress: "none",
    };

    componentDidMount() {
        if (!ReactComponentCompact.setup){
            this.props.history.replace("/web")
            return
        }
        const sp = this.getSharedPreference("user")
        const school_year = sp.getString("school_year", "2020-2021")
        const semester = sp.getNumber("semester", 1)
        const year: number = Number.parseInt(school_year.split("-", 2)[0])
        const yearData = []
        for (let i = year - 5; i <= year; i++){
            yearData.push(i.toString() + "-" + (i + 1).toString())
        }
        this.setState({
            yearData: yearData,
            semester: semester,
            year: school_year,
        })
    }

    getFilePath(){
        this.findFile?.click()
    }

    onReadData(e: ChangeEvent<HTMLInputElement>, context: Extract){
        context.setState({
            action_doing: true
        })
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
                    extractResultLink: "",
                    targetTaskData: targetTaskData,
                    targetTaskCount: data.length - 1,
                    targetTaskPosted: 0,
                })
            } catch (e) {
                alert("文件格式不正确。" + e.message)
                return;
            }
            context.setState({
                action_doing: false
            })
        }
        context.setState({
            filePath: context.file.name
        })
        fileReader.readAsArrayBuffer(context.file);
    }

    postCount: number = 0
    count: number = 0
    onPostData(){
        this.setState({
            action_doing: true,
            targetTaskSuccess: 0,
            warnData: new Array<WarnTaskInfo>(),
            failedData: new Array<FailedTaskInfo>(),
        })
        this.count = this.state.targetTaskCount
        this.task_id = undefined
        this.postCount = 0
        const context = this
        const accessToken = this.getSharedPreference("user")
            .getString("access_token", "")
        const helper = new ExtractHelper(accessToken)
        this.startPost(helper, context)
    }

    private startPost(helper: ExtractHelper, context: Extract){
        const random = this.getRandomNum(80, 99)
        let postStart = this.postCount
        let postEnd = this.postCount + random
        if (postEnd >= this.count){
            postEnd = this.count - 1
        }
        this.postCount += random + 1
        const data: SingleTaskInfo[] = []
        for(let i = postStart; i <= postEnd; ++i){
            data.push(this.state.targetTaskData[i])
        }
        helper.add(this.state.semester, this.state.year, this.task_id, data, new class implements ExtractAddCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                const failed: FailedTaskInfo[] = context.state.failedData
                for (let i = 0; i < data.length; i++) {
                    failed.push(new FailedTaskInfo(data[i].uid, data[i].name, message == null ? "网络请求失败" : message))
                }
                context.setState({
                    targetTaskPosted: postEnd + 1,
                    failedData: failed,
                    extractButton: "已提交 " + (postEnd + 1) + " 项，共 " + context.count + " 项……"
                })
                if (postEnd + 1 === context.state.targetTaskCount){
                    context.onGetLink()
                } else {
                    context.startPost(helper, context)
                }
            }

            onResult(status: ExtractAddStatusData) {
                context.task_id = status.task_id
                const failed: FailedTaskInfo[] = context.state.failedData
                    .concat(status.failed)
                const warn: WarnTaskInfo[] = context.state.warnData
                    .concat(status.warn)
                context.setState({
                    targetTaskPosted: postEnd + 1,
                    targetTaskSuccess: status.success.length,
                    warnData: warn,
                    failedData: failed,
                    extractButton: "已提交 " + (postEnd + 1) + " 项，共 " + context.count + " 项……"
                })
                if (postEnd + 1 === context.state.targetTaskCount){
                    context.onGetLink()
                } else {
                    context.startPost(helper, context)
                }
            }
        }())
    }

    onGetLink(){
        const context = this
        const accessToken = this.getSharedPreference("user")
            .getString("access_token", "")
        if (this.task_id === undefined){
            return
        }
        new ExtractHelper(accessToken).done(this.task_id, new class implements ExtractDoneCallback {
            onFailure(code: number, message?: string, e?: CurlToolException) {
                if (code === -1001){
                    setTimeout(() => {
                        context.onGetLink()
                    }, 200)
                    return
                }
                alert("文件打包失败。" + message)
            }

            onResult(link: string) {
                context.setState({
                    action_doing: false,
                    extractResultLink: link,
                    extractButton: "下载"
                })
            }
        }())
    }

    onClick(){
        if (this.state.extractResultLink === ""){
            this.onPostData()
        } else {
            window.open(this.state.extractResultLink, "_blank")
        }
    }

    render() {
        return (
            <div>
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
                                    value={this.state.year} disabled={this.state.action_doing}
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
                                    value={this.state.semester} disabled={this.state.action_doing}
                                    onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                                        this.setState({
                                            semester: Number.parseInt(event.target.value as string)
                                        })
                                    }}
                                    displayEmpty>
                                    <MenuItem value={0}>全年</MenuItem>
                                    <MenuItem value={1}>1</MenuItem>
                                    <MenuItem value={2}>2</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3} />
                        <Grid item xs />
                        <Grid item xs={5}>
                            <Button
                                color={"primary"} variant={"contained"} fullWidth={true}
                                disabled={this.state.filePath === "" || this.state.action_doing}
                                onClick={this.onClick.bind(this)}>
                                {this.state.extractButton}
                            </Button>
                        </Grid>
                        <Grid item xs />
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
                                                        <TableCell align="left">{row.name}</TableCell>
                                                        <TableCell align="left">{row.error_info}</TableCell>
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
                                                        <TableCell align="left">{row.name}</TableCell>
                                                        <TableCell align="left">{row.name_internal}</TableCell>
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
        );
    }

    public getRandomNum(min: number, max: number): number {
        const range = min - max;
        const rand = Math.random();
        return min + Math.round(rand * range);
    }
}

export default withRouter(Extract)