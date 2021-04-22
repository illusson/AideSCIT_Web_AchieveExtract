import {APIHelper} from "./APIHelper";
import {CurlCall, CurlCallback, CurlResponse, CurlToolException} from "../util/CurlUnit";
import {ExtractAddStatusData, FailedTaskInfo, SingleTaskInfo, WarnTaskInfo} from "../data/ExtractAddStatusData";

export class ExtractHelper {

    private readonly access_token: string;

    constructor(access_token: string) {
        this.access_token = access_token
    }

    add(semester: number, year: string, task_id: number|undefined, data: SingleTaskInfo[], callback: ExtractAddCallback){
        new APIHelper(this.access_token).getExtractAddCall(year, semester, data, task_id).enqueue(new class implements CurlCallback {
            onFailure(call: CurlCall, exception: CurlToolException, requestId: number) {
                callback.onFailure(-111, "网络请求失败", exception)
            }

            onResponse(call: CurlCall, response: CurlResponse, requestId: number) {
                if (response.code() !== 200){
                    callback.onFailure(-105, "服务器内部出错");
                    return
                }
                try {
                    let result = JSON.parse(response.body());
                    if (result["code"] !== 200){
                        callback.onFailure(-104, result["message"]);
                        return;
                    }
                    result = result["status"]
                    const task_id = result["task_id"]
                    const success = result["success"]
                    const successData: SingleTaskInfo[] = []
                    for (let i = 0; i < success.length; i++){
                        successData.push(new SingleTaskInfo(success[i]["uid"], success[i]["name"]))
                    }
                    const warn = result["warn"]
                    const warnData: WarnTaskInfo[] = []
                    for (let i = 0; i < warn.length; i++){
                        warnData.push(new WarnTaskInfo(warn[i]["uid"], warn[i]["name"], warn[i]["name_internal"]))
                    }
                    const failed = result["failed"]
                    const failedData: FailedTaskInfo[] = []
                    for (let i = 0; i < failed.length; i++){
                        failedData.push(new FailedTaskInfo(failed[i]["uid"], failed[i]["name"], failed[i]["error_info"]))
                    }
                    callback.onResult(new ExtractAddStatusData(
                        task_id, successData, warnData, failedData
                    ));
                } catch (e) {
                    callback.onFailure(-103, e.message);
                }
            }
        }())
    }

    done(task_id: number, callback: ExtractDoneCallback){
        new APIHelper(this.access_token).getExtractDoneCall(task_id).enqueue(new class implements CurlCallback {
            onFailure(call: CurlCall, exception: CurlToolException, requestId: number): void {
                callback.onFailure(-601, "网络请求失败", exception)
            }

            onResponse(call: CurlCall, response: CurlResponse, requestId: number): void {
                if (response.code() === 200){
                    try {
                        const result = JSON.parse(response.body());
                        if (result["code"] === 200) {
                            callback.onResult(result["link"])
                        } else if (result["code"] > 0) {
                            callback.onFailure(-1001, result["message"]);
                        } else {
                            callback.onFailure(-602, result["message"]);
                        }
                    } catch (e) {
                        callback.onFailure(-603, e.message);
                    }
                } else {
                    callback.onFailure(-605, "服务器内部出错");
                }
            }
        }())
    }
}

export interface ExtractAddCallback {
    onFailure(code: number, message?: string, e?: CurlToolException): void
    onResult(status: ExtractAddStatusData): void
}

export interface ExtractDoneCallback {
    onFailure(code: number, message?: string, e?: CurlToolException): void
    onResult(link: string): void
}