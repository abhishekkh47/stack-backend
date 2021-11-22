import Jwt from "jsonwebtoken";

export const getJwtToken = (body: any) => {
  return Jwt.sign(body, process.env.JWT_SECRET ?? "secret", {
    expiresIn: 36000,
  });
};

export const verifyToken = (token: string) => {
  const response = Jwt.verify(token, process.env.JWT_SECRET ?? "secret") as any;

  return response;
};
