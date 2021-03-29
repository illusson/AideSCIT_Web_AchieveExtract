export class ExtractAddStatusData {
    public readonly task_id;
    public readonly success;
    public readonly warn;
    public readonly failed;

    constructor(task_id: number, success: SingleTaskInfo[], warn: WarnTaskInfo[], failed: FailedTaskInfo[]) {
        this.task_id = task_id;
        this.success = success;
        this.warn = warn;
        this.failed = failed;
    }
}

export class SingleTaskInfo {
    public readonly uid;
    public readonly name;

    constructor(uid: string, name: string) {
        this.name = name
        this.uid = uid
    }
}

export class WarnTaskInfo {
    public readonly uid;
    public readonly name;
    public readonly name_internal;

    constructor(uid: string, name: string, name_internal: string) {
        this.name = name
        this.uid = uid
        this.name_internal = name_internal
    }
}

export class FailedTaskInfo {
    public readonly uid;
    public readonly name;
    public readonly error_info;

    constructor(uid: string, name: string, error_info: string) {
        this.name = name
        this.uid = uid
        this.error_info = error_info
    }
}