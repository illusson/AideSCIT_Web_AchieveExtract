import {Map} from "./Map";
import {Log} from "./Log";

export class CookieUnit {
    public static set(key: string, value: string, expired: Date | null = null, path: string | null = null){
        let cookie = key + "=" + value;
        if (expired != null){
            cookie += "; expires=" + expired.toUTCString();
        }
        if (path != null){
            cookie += "; path=" + path;
        }
        cookie += ";";
        document.cookie = cookie;
    }

    public static remove(key: string) {
        document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    public static get(key: string): string | null {
        const cookies: Map<string, string> = CookieUnit.getAll();
        if (cookies.indexOf(key) !== -1){
            return cookies.get(key);
        } else {
            return null;
        }
    }

    public static getAll(): Map<string, string> {
        const cookie_strings: string[] = document.cookie.split("; ");
        const cookies: Map<string, string> = new Map<string, string>();
        cookie_strings.forEach(function (value) {
            const cookie: string[] = value.split("=");
            cookies.set(cookie[0], cookie[1]);
        });
        return cookies;
    }
}