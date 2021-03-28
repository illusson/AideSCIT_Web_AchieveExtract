import {CurlCall, CurlCallback, CurlResponse, CurlToolException} from "../core/CurlUnit";
import {APIHelper} from "./APIHelper";

export class DayHelper {
    get(callback: DayCallback){
        const call = new APIHelper().getDayCall();
        call.enqueue(new class implements CurlCallback {
            onFailure(call: CurlCall, exception: CurlToolException, requestId: number) {
                callback.onFailure(-111, "网络请求失败", exception)
            }

            onResponse(call: CurlCall, response: CurlResponse, requestId: number) {
                if (response.code() === 200){
                    try {
                        const result = JSON.parse(response.body());
                        if (result["code"] === 200){
                            callback.onResult(result["semester"] as number, result["school_year"]);
                        } else {
                            callback.onFailure(-104, result["message"]);
                        }
                    } catch (e) {
                        callback.onFailure(-103, e.message);
                    }
                } else {
                    callback.onFailure(-105, "服务器内部出错");
                }
            }
        }())
    }
}

export interface DayCallback {
    onFailure(code: number, message?: string, e?: CurlToolException): void
    onResult(semester: number, school_year: string): void
}