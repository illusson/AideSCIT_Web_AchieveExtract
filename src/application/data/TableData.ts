export class TableData {
    public readonly name;
    public readonly teacher;
    public readonly room;

    constructor(name: string, teacher: string, room: string) {
        this.name = name;
        this.teacher = teacher;
        this.room = room;
    }
}