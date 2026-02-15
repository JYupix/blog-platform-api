export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: string;
  iat?: number;
  exp?: number;
}