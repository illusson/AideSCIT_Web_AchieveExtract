import {JSEncrypt} from "jsencrypt";

export class RSAStaticUnit {
    public static encrypted(privateKey: string, data: string): string {
        const jse = new JSEncrypt({});
        jse.setPublicKey(privateKey);
        return jse.encrypt(data) as string;
    }
}