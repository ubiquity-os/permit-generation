import { Context } from "../types/context";

export async function doSomething(context: Context) {
  const { logger } = context;
  logger.info("Doing something");
  return "Something done";
}
