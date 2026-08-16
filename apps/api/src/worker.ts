import "dotenv/config";
import { startKeepAlive } from "./lib/keepAlive.js";

process.env.KEEP_ALIVE ??= "true";
startKeepAlive();
