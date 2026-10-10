declare module 'lunar-javascript' {
  interface Lunar {
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getDay(): number;
  }
  export const Solar: {
    fromYmd(year: number, month: number, day: number): {getLunar(): Lunar};
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): {getLunar(): Lunar};
  };
}
