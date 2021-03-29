export class PassedMarkData {
    public readonly name;
    public readonly mark;
    public readonly retake;
    public readonly rebuild;
    public readonly credit;

    constructor(name: string, mark: string, retake: string, rebuild: string, credit: string) {
        this.name = name;
        this.mark = mark;
        this.retake = retake;
        this.rebuild = rebuild;
        this.credit = credit;
    }
}