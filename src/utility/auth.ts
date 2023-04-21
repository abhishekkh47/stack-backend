import Jwt from "jsonwebtoken";

export const getJwtToken = (body: any, expireTime: any = null) => {
  return Jwt.sign(body, process.env.JWT_SECRET ?? "secret", {
    expiresIn: expireTime ? expireTime : 36000,
  });
};

export const verifyToken = (token: string) => {
  try {
    const response = Jwt.verify(
      token,
      process.env.JWT_SECRET ?? "secret"
    ) as any;
    return response;
  } catch (error) {
    return {
      status: 401,
      message: "Unauthorised User",
    };
  }
};

export const getRefreshToken = (body: any) => {
  return Jwt.sign(body, process.env.JWT_SECRET ?? "secret", {
    expiresIn: "365d",
  });
};

export const decodeJwtToken = (body: any) => {
  return Jwt.decode(body);
};
