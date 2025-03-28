import { Context } from "ponder:registry";
import { Dao } from "ponder:schema";

export async function handleDao(context: Context, dao: Dao) {
  const { address, chainId } = dao;
}
