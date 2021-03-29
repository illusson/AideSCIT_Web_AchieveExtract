import {Map, MapForEachCallback} from "../core/Map";

export class CurlClientBuilder {
    private follow_location: boolean = true;
    private timeout: number = 30;

    public static getInterface(): CurlClientBuilder {
        return new CurlClientBuilder();
    }

    public followLocation(follow_location: boolean): CurlClientBuilder {
        this.follow_location = follow_location;
        return this;
    }

    public setTimeout(time: number): CurlClientBuilder {
        this.timeout = time;
        return this;
    }

    public build(): CurlClient {
        return new CurlClient(this.follow_location, this.timeout * 1000);
    }
}

export class CurlClient {
    private readonly follow_location: boolean;
    private readonly timeout: number;

    public constructor(follow_location: boolean, timeout: number) {
        this.follow_location = follow_location;
        this.timeout = timeout;
    }

    isFollowLocation(): boolean {
        return this.follow_location;
    }

    getTimeout(): number {
        return this.timeout;
    }

    public newCall(request: CurlRequest): CurlCall {
        return new CurlCall(this, request);
    }
}

export class CurlRequestBuilder {
    private url_string: string = "";
    private headers: Map<string, string> = new Map<string, string>();
    private body: string | null = null;

    public url(url: string): CurlRequestBuilder {
        this.url_string = url;
        return this;
    }

    public addHeader(key: string, value: any): CurlRequestBuilder {
        this.headers.set(key, value.toString())
        return this;
    }

    public addCookie(key: string, value: any): CurlRequestBuilder {
        if (this.headers.indexOf("Cookie")){
            this.headers.set("Cookie", "");
        }
        this.headers.set("Cookie", this.headers.get("Cookie")
            + key + "=" + value.toString() + "; ");
        return this;
    }

    public post(body: FormBody): CurlRequestBuilder {
        this.body = body.getFormBody();
        return this;
    }

    public build(): CurlRequest {
        return new CurlRequest(this.url_string, this.headers, this.body)
    }
}

export class CurlRequest {
    private readonly url: string;
    private readonly headers: Map<string, string>;
    private readonly body: string | null = null;

    public constructor(url: string, headers: Map<string, string>, body: string | null = null) {
        this.url = url;
        this.headers = headers;
        this.body = body;
    }

    getUrl(): string {
        return this.url;
    }

    getBody(): string|null{
        if (this.body == null){
            return null;
        } else {
            return this.body;
        }
    }

    getHeaders(): Map<string, string> {
        return this.headers;
    }
}

export class FormBodyBuilder {
    private body: Map<string, any> = new Map<string, any>();

    public add(key: string, value: any = ""): FormBodyBuilder {
        this.body.set(key, value);
        return this;
    }

    public build(app_secret: string = ""): FormBody {
        let form_string = "";
        let body_string = "";
        this.body.forEach(new class implements MapForEachCallback<string, any> {
            onEach(key: string, value: any, map: Map<string, any>) {
                if (form_string !== "") {
                    form_string = form_string + "&";
                }
                // if (key !== "access_token") {
                    form_string = form_string + key + "=" + value;
                // }

                if (body_string !== "") {
                    body_string = body_string + "&";
                }
                // if (key !== "access_token"){
                    body_string = body_string + key + "=" + encodeURIComponent(value);
                // }
            }
        }())
        if (app_secret !== ""){
            if (body_string !== ""){
                body_string = body_string + "&";
            }
            body_string = body_string + "sign=" + MD5.getMD5(form_string + app_secret);
        }
        return new FormBody(body_string);
    }
}

export class FormBody {
    private readonly form_array: string;

    constructor(form_array: string) {
        this.form_array = form_array;
    }

    getFormBody(): string {
        return this.form_array;
    }
}

export class CurlCall {
    private xmlRequest: XMLHttpRequest;
    private readonly url: string;
    private readonly body: string | null = null;
    private readonly responseHeader: Map<string, string> = new Map<string, string>();
    private readonly method: string = "GET";

    constructor(client: CurlClient, request: CurlRequest) {
        if (request.getUrl() === ""){
            throw new CurlUrlNotSetException("The url of this client is not set.");
        } else {
            this.xmlRequest = new XMLHttpRequest();
            this.xmlRequest.timeout = client.getTimeout();
            this.url = request.getUrl();
            const this_CurlCall = this;
            request.getHeaders().forEach(new class implements MapForEachCallback<string, string> {
                onEach(key: string, value: any, map: Map<string, string>): void {
                    this_CurlCall.xmlRequest.setRequestHeader(key, value);
                }
            }())
            if (request.getBody() !== null){
                this.method = "POST";
                this.body = request.getBody();
            }
        }
    }

    public enqueue(callback: CurlCallback, requestId: number = 0) {
        const call_this = this;
        this.xmlRequest.onerror = function (e){
            callback.onFailure(call_this, new CurlToolException(e.type), requestId);
        }
        this.xmlRequest.ontimeout = function (e){
            callback.onFailure(call_this, new CurlToolException(e.type), requestId);
        }
        this.xmlRequest.onloadend = function (e){
            callback.onResponse(call_this, new CurlResponse (
                call_this.xmlRequest.status,
                call_this.responseHeader,
                call_this.xmlRequest.responseText
            ), requestId);
        }

        this.xmlRequest.open(this.method, this.url, true);
        this.xmlRequest.setRequestHeader("Content-Type",
            "application/x-www-form-urlencoded;charset=utf-8");
        this.xmlRequest.send(this.body);
        if (this.xmlRequest.getAllResponseHeaders() !== ""){
            const header_array = this.xmlRequest.getAllResponseHeaders().split("\n");
            for (const header of header_array) {
                const header_item = header.split(": ");
                this.responseHeader.set(header_item[0], header_item[1])
            }
        }
    }

    public execute(): CurlResponse {
        this.xmlRequest.open(this.method, this.url, false);
        this.xmlRequest.setRequestHeader("Content-Type",
            "application/x-www-form-urlencoded;charset=utf-8");
        this.xmlRequest.send(this.body);
        const headers: Map<string, string> = new Map<string, string>();
        if (this.xmlRequest.getAllResponseHeaders() !== ""){
            const header_array = this.xmlRequest.getAllResponseHeaders().split("\n");
            for (const header of header_array) {
                const header_item = header.split(": ");
                headers.set(header_item[0], header_item[1]);
            }
        }
        return new CurlResponse (
            this.xmlRequest.status, headers,
            this.xmlRequest.responseText
        );
    }

}

export interface CurlCallback {
    onFailure(call: CurlCall, exception: CurlToolException, requestId: number): void;
    onResponse(call: CurlCall, response: CurlResponse, requestId: number): void;
}

export class CurlResponse {
    private readonly code_value: number;
    private readonly headers_array: Map<string, string>;
    private readonly body_string: string = "";

    constructor(code: number, headers: Map<string, string>, body: string) {
        this.code_value = code;
        this.headers_array = headers;
        if (body !== null){
            this.body_string = body;
        }
    }

    public code(): number {
        return this.code_value;
    }

    public header(key: string): string|null {
        return this.headers_array.get(key);
    }

    public headers(): Map<string, string> {
        return this.headers_array;
    }

    public body(): string {
        return this.body_string;
    }
}

export class CurlToolException {
    public message?: string;
    public name?: string;

    constructor(message?: string, name?: string) {
        this.message = message;
        this.name = name;
        return new DOMException(message, name);
    }
}

export class CurlUrlNotSetException extends CurlToolException { }

export class CurlUrlWrongFormatException extends CurlToolException { }

export class CurlResponseReadException extends CurlToolException { }

export class MD5 {
    public static getMD5(s: string) {
        return MD5.rstr2hex(MD5.rstr_md5(MD5.str2rstr_utf8(s)))
    }

    private static rstr_md5(s: string) {

        return MD5.binl2rstr(MD5.binl_md5(MD5.rstr2binl(s), s.length * 8));
    }

    private static rstr2hex(input: string) {
        let hex_tab = 0 ? "0123456789ABCDEF" : "0123456789abcdef";
        let output = "";
        let x;
        for (let i = 0; i < input.length; i++) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F)
                + hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    private static str2rstr_utf8(input: string) {
        let output = "";
        let i = -1;
        let x, y;

        while (++i < input.length) {
            /* Decode utf-16 surrogate pairs */
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
                x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
                i++;
            }

            /* Encode output as utf-8 */
            if (x <= 0x7F)
                output += String.fromCharCode(x);
            else if (x <= 0x7FF)
                output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
                    0x80 | (x & 0x3F));
            else if (x <= 0xFFFF)
                output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
            else if (x <= 0x1FFFFF)
                output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                    0x80 | ((x >>> 12) & 0x3F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
        }
        return output;
    }

    private static rstr2binl(input: string) {
        let output = Array(input.length >> 2);
        for (let i = 0; i < output.length; i++)
            output[i] = 0;
        for (let i = 0; i < input.length * 8; i += 8)
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        return output;
    }

    private static binl2rstr(input: number[]) {
        let output = "";
        for (let i = 0; i < input.length * 32; i += 8)
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        return output;
    }

    private static binl_md5(x: number[], len: number) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;

        for (let i = 0; i < x.length; i += 16) {
            let olda = a;
            let oldb = b;
            let oldc = c;
            let oldd = d;

            a = MD5.md5_ff(a, b, c, d, x[i], 7, -680876936);
            d = MD5.md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = MD5.md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = MD5.md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = MD5.md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = MD5.md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = MD5.md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = MD5.md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = MD5.md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = MD5.md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = MD5.md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = MD5.md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = MD5.md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = MD5.md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = MD5.md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = MD5.md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = MD5.md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = MD5.md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = MD5.md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = MD5.md5_gg(b, c, d, a, x[i], 20, -373897302);
            a = MD5.md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = MD5.md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = MD5.md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = MD5.md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = MD5.md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = MD5.md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = MD5.md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = MD5.md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = MD5.md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = MD5.md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = MD5.md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = MD5.md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = MD5.md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = MD5.md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = MD5.md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = MD5.md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = MD5.md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = MD5.md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = MD5.md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = MD5.md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = MD5.md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = MD5.md5_hh(d, a, b, c, x[i], 11, -358537222);
            c = MD5.md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = MD5.md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = MD5.md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = MD5.md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = MD5.md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = MD5.md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = MD5.md5_ii(a, b, c, d, x[i], 6, -198630844);
            d = MD5.md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = MD5.md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = MD5.md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = MD5.md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = MD5.md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = MD5.md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = MD5.md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = MD5.md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = MD5.md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = MD5.md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = MD5.md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = MD5.md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = MD5.md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = MD5.md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = MD5.md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = MD5.safe_add(a, olda);
            b = MD5.safe_add(b, oldb);
            c = MD5.safe_add(c, oldc);
            d = MD5.safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    private static md5_cmn(q: any, a: any, b: any, x: any, s: any, t: any) {
        return MD5.safe_add(MD5.bit_rol(MD5.safe_add(MD5.safe_add(a, q), MD5.safe_add(x, t)), s), b);
    }
    private static md5_ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
        return MD5.md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    private static md5_gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
        return MD5.md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    private static md5_hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
        return MD5.md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    private static md5_ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
        return MD5.md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    private static safe_add(x: any, y: any) {
        let lsw = (x & 0xFFFF) + (y & 0xFFFF);
        let msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    private static bit_rol(num: any, cnt: any) {
        return (num << cnt) | (num >>> (32 - cnt));
    }
}