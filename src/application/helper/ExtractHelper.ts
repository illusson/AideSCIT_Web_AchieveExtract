import {APIHelper} from "./APIHelper";
import {CurlCall, CurlCallback, CurlResponse, CurlToolException} from "../util/CurlUnit";
import {ExtractAddStatusData, FailedTaskInfo, SingleTaskInfo, WarnTaskInfo} from "../data/ExtractAddStatusData";
import {Base64Util} from "../util/Base64Util";

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
                if (response.code() === 200){
                    callback.onFailure(-105, "服务器内部出错");
                    return
                }
                try {
                    const result = JSON.parse(response.body());
                    if (result["code"] !== 200){
                        callback.onFailure(-104, result["message"]);
                        return;
                    }
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
                    for (let i = 0; i < warn.length; i++){
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
}

export interface ExtractAddCallback {
    onFailure(code: number, message?: string, e?: CurlToolException): void
    onResult(status: ExtractAddStatusData): void
}