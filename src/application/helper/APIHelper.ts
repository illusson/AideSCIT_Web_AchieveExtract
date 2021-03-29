import {CurlCall, CurlClientBuilder, CurlRequestBuilder, FormBodyBuilder} from "../util/CurlUnit";
import {Map, MapForEachCallback} from "../core/Map";
import {SingleTaskInfo} from "../data/ExtractAddStatusData";

export class APIHelper {
    public static readonly debug: boolean = true;
    // public static readonly debug: boolean = location.href.indexOf("debug") > 0;

    private static readonly API_HOST: string = "https://tool.eclass.sgpublic.xyz/api"
    public static readonly METHOD_GET: number = 0
    public static readonly METHOD_POST: number = 1

    private access_token: string = "";
    private refresh_token: string = "";

    constructor(access_token: string = "", refresh_token: string = "") {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }

    public getKeyCall(): CurlCall {
        const args = new Map<string, any>()
            .set("ts", APIHelper.getTS());
        return this.onReturn("getKey", args, APIHelper.METHOD_POST, true);
    }

    public getLoginCall(username: string, password: string): CurlCall {
        const args = new Map<string, any>()
            .set("password", password)
            .set("ts", APIHelper.getTS())
            .set("username", username);
        return this.onReturn("login", args, APIHelper.METHOD_POST, true);
    }

    public getSpringboardCall(): CurlCall {
        const url = "springboard"
        const args = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("ts", APIHelper.getTS())
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getRefreshTokenCall(): CurlCall {
        const url = "token"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("refresh_token", this.refresh_token)
            .set("ts", APIHelper.getTS());
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getSentenceCall(): CurlCall {
        return this.onReturn("https://v1.hitokoto.cn/?encode=json");
    }

    public getDayCall(): CurlCall {
        const url = "day"
        const args: Map<string, any> = new Map<string, any>()
            .set("ts", APIHelper.getTS());
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getInfoCall(): CurlCall {
        const url = "info"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("ts", APIHelper.getTS());
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getTableCall(year: string, semester: number): CurlCall {
        const url = "table"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("semester", semester)
            .set("ts", APIHelper.getTS())
            .set("year", year);
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getExamCall(): CurlCall {
        const url = "exam"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("ts", APIHelper.getTS());
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getAchievementCall(year: string, semester: number): CurlCall {
        const url = "achieve"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("semester", semester)
            .set("ts", APIHelper.getTS())
            .set("year", year);
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getExtractAddCall(year: string, semester: number, task_data: SingleTaskInfo[], task_id: number|undefined): CurlCall {
        const url = "achieve/extract/add"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("semester", semester)
        if (task_id !== undefined){
            args.set("task_id", task_id)
        }
        args.set("tasks", btoa(unescape(encodeURIComponent(JSON.stringify(task_data)))))
            .set("ts", APIHelper.getTS())
            .set("year", year)
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    public getExtractDoneCall(task_id: number): CurlCall {
        const url = "achieve/extract/done"
        const args: Map<string, any> = new Map<string, any>()
            .set("access_token", this.access_token)
            .set("task_id", task_id)
            .set("ts", APIHelper.getTS())
        return this.onReturn(url, args, APIHelper.METHOD_POST, true);
    }

    private onReturn(url: string, argArray: Map<string, any> | null = null,
        method: number = APIHelper.METHOD_GET, withSign: Boolean = false): CurlCall {
        let url_final;
        if (url.substr(0, 4) === "http"){
            url_final = url;
        } else {
            url_final = APIHelper.API_HOST + "/" + url;
        }
        const form_builder = new FormBodyBuilder();
        if (argArray != null){
            argArray.forEach(new class implements MapForEachCallback<string, any> {
                onEach(key: string, value: any, map: Map<string, any>) {
                    form_builder.add(key, value);
                }
            }())
        }
        let form;
        if (withSign){
            form = form_builder.build("866e8fed1ce94b9193f44479e70bbe87");
        } else {
            form = form_builder.build();
        }

        const client = new CurlClientBuilder()
            .followLocation(false)
            .setTimeout(5)
            .build();
        const request_builder = new CurlRequestBuilder();
        if (method === APIHelper.METHOD_POST){
            request_builder.post(form);
        } else {
            if (argArray != null){
                url_final = url_final + "?" + form.getFormBody()
            }
        }
        request_builder.url(url_final);
        const request = request_builder.build();
        return client.newCall(request);
    }

    public static getTS(){
        return Date.parse(new Date().toUTCString()) / 1000;
    }
}