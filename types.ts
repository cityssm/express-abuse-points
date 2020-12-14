export interface AbuseCheckOptions {
  byIP?: boolean;

  expiryMillis?: number;
  abusePointsMax?: number;

  clearIntervalMillis?: number;
}


export interface AbuseRequest {
  ip: string;
}
