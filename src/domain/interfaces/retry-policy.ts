
export interface RetryPolicy {
  shouldRetry(tries: number): boolean;
}
