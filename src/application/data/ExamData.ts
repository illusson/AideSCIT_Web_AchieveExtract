export class ExamData {
    public readonly name;
    public readonly time;
    public readonly location;
    public readonly set;

    constructor(name: string, time: string, location: string, set: string) {
        this.name = name;
        this.time = time;
        this.location = location;
        this.set = set;
    }
}