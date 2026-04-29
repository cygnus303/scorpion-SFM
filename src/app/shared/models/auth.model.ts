export interface TokenPayload {
  Id: string;
  UserType: string;
  email: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
  jti: string;
}
