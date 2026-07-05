function required(name: string, min = 0): string {
  const value = process.env[name];
  if (!value || value.length < min) {
    throw new Error(
      `Environment variable ${name} is missing or too short (min ${min} chars). Refusing to start.`
    );
  }
  return value;
}

export const env = {
  jwtSecret: required("JWT_SECRET", 32),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  databaseUrl: required("DATABASE_URL"),
};
