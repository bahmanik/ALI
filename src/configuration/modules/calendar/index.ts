import { opt } from "src/lib/options";
import { calendar, weekDays } from "src/lib/options/types";

export default {
    calendar: opt<calendar>("Gregorian"),
    startOfWeek: opt<weekDays>("Sun"),
    weekend: opt<Array<weekDays>>(["Fri", "Sat"]),
};
