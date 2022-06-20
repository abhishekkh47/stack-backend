import Jwt from "jsonwebtoken";

export const getJwtToken = (body: any) => {
  return Jwt.sign(body, process.env.JWT_SECRET ?? "secret", {
    expiresIn: 30,
  });
};

export const verifyToken = (token: string) => {
  const response = Jwt.verify(token, process.env.JWT_SECRET ?? "secret") as any;

  return response;
};

export const getRefreshToken = (body: any) => {
  return Jwt.sign(body, process.env.JWT_SECRET ?? "secret", {
    expiresIn: "365d",
  });
};

export const decodeJwtToken = (body: any) => {
  return Jwt.decode(body);
};
