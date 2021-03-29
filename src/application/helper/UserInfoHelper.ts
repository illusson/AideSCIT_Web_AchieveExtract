import {CurlCall, CurlCallback, CurlResponse, CurlToolException} from "../util/CurlUnit";
import {APIHelper} from "./APIHelper";

export class UserInfoHelper {
    private readonly access_token: string;

    constructor(access_token: string) {
        this.access_token = access_token
    }

    public getUserInfo(callback: UserInfoCallback){
        const call = new APIHelper(this.access_token).getInfoCall();
        call.enqueue(new class implements CurlCallback {
            onFailure(call: CurlCall, exception: CurlToolException, requestId: number) {
                callback.onFailure(-301, "网络请求失败", exception)
            }

            onResponse(call: CurlCall, response: CurlResponse, requestId: number) {
                if (response.code() === 200){
                    try {
                        const result: any = JSON.parse(response.body());
                        if (result["code"] === 200) {
                            const info = result["info"];
                            callback.onResult(info["name"], info["identify"], info["level"],
                                info["faculty"], info["specialty"], info["class"], info["grade"])
                        } else {
                            callback.onFailure(-304, result["message"]);
                        }
                    } catch (e) {
                        callback.onFailure(-303, e.message);
                    }
                } else {
                    callback.onFailure(-305, "服务器内部出错");
                }
            }
        }())
    }
}

export interface UserInfoCallback {
    onFailure(code: number, message?: string, e?: CurlToolException): void
    onResult(name: string, identify: number, level: number, faculty: string, specialty: string, userClass: string, grade: number): void
}