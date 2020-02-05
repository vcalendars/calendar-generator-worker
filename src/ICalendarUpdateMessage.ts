export default interface ICalendarUpdateMessage {
  acknowledge?: () => Promise<void>,
  userId: string,
  timeChangeDetected: Date,
}
