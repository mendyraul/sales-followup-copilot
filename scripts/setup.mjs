import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env"))
  throw new Error(".env already exists; leaving it unchanged.");
const secret = () => randomBytes(32).toString("hex");
writeFileSync(
  ".env",
  `APP_MODE=selfhost\nAPP_URL=http://127.0.0.1:3116\nPORT=3116\nBETTER_AUTH_SECRET=${secret()}\nTOKEN_ENCRYPTION_KEY=${secret()}\nPOSTGRES_PASSWORD=${secret()}\nAI_PROVIDER=mock\nSMTP_URL=\nSMTP_FROM=\nGMAIL_ENABLED=false\n`,
  { mode: 0o600 },
);
console.log(
  "Created .env with unique local secrets. Start Docker Compose, then create an owner account.",
);
