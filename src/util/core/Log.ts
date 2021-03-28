export class Log {
    private static grade: number = 1;
    private static filter: string|RegExp = "";

    public static readonly GRADE_VERBOSE: number = 0;
    public static readonly GRADE_DEBUG: number = 1;
    public static readonly GRADE_INFO: number = 2;
    public static readonly GRADE_WARN: number = 3;
    public static readonly GRADE_ERROR: number = 4;
    public static readonly GRADE_ASSERT: number = 5;

    public static setGrade(grade: number) {
        if (grade >= 0 && grade <= 5) {
            Log.grade = grade;
        }
    }

    public static setFilter(filter: string|RegExp) {
        Log.filter = filter;
    }

    public static v(tag: string, message: string) {
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.debug("V/" + tag + ": (null)");
            } else {
                console.debug("V/" + tag + ": " + message);
            }
        }
    }

    public static d(tag: string, message: string){
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.debug("D/" + tag + ": (null)");
            } else {
                console.debug("D/" + tag + ": " + message);
            }
        }
    }

    public static i(tag: string, message: string){
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.info("I/" + tag + ": (null)");
            } else {
                console.info("I/" + tag + ": " + message);
            }
        }
    }

    public static w(tag: string, message: string){
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.warn("W/" + tag + ": (null)");
            } else {
                console.warn("W/" + tag + ": " + message);
            }
        }
    }

    public static e(tag: string, message: string){
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.error("E/" + tag + ": (null)");
            } else {
                console.error("E/" + tag + ": " + message);
            }
        }
    }

    public static a(tag: string, message: string){
        if (tag.search(this.filter) !== -1){
            if (message == null) {
                console.assert(false, "A/" + tag + ": (null)");
            } else {
                console.assert(false, "A/" + tag + ": " + message);
            }
        }
    }
}
