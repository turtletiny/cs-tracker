import type { ScheduleBlock } from "../types";

const WEEKDAYS = [1, 2, 3, 4, 5];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export const SAMPLE_SCHEDULE: Omit<ScheduleBlock, "id">[] = [
  { start: "06:30", end: "07:30", label: "Deep work — current programming step", pillarId: "programming", days: WEEKDAYS },
  { start: "12:30", end: "13:00", label: "One LeetCode problem", pillarId: "interview", days: WEEKDAYS },
  { start: "19:30", end: "20:30", label: "Read — whichever book is on the go", pillarId: null, days: EVERY_DAY },
  { start: "21:30", end: "21:45", label: "Review notes, plan tomorrow", pillarId: null, days: EVERY_DAY },
  { start: "09:00", end: "11:00", label: "System design practice", pillarId: "interview", days: [6] },
  { start: "10:00", end: "12:00", label: "Labs and projects", pillarId: "architecture", days: [0] },
];
