import { Hono } from "hono";
import { db } from "@/db";
import resf, { ApiError } from "@/api/utils/responseFormatter";

const app = new Hono();

// fetch all daos
app.get("/", async (c) => {
  const query = await db.query.daoTable.findMany();
  return resf(c, query);
});

// fetch by chainId
app.get("/:_chainId", async (c) => {
  const { _chainId } = c.req.param();
  const chainId = Number(_chainId);
  const query = await db.query.daoTable.findMany({
    where: (dao, { eq }) => eq(dao.chainId, chainId),
    with: {
      governanceModules: {
        columns: {
          address: true,
          name: true,
          description: true,
        },
        with: {
          votingStrategies: {
            columns: {
              address: true,
              minProposerBalance: true,
              name: true,
              description: true,
            },
            with: {
              votingTokens: {
                columns: {
                  address: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return resf(c, query);
});

// fetch a dao by chainId and address
app.get("/:_chainId/:_address", async (c) => {
  const { _chainId, _address } = c.req.param();
  const chainId = Number(_chainId);
  const address = _address.toLowerCase() as `0x${string}`;
  const query = await db.query.daoTable.findFirst({
    where: (dao, { eq }) => eq(dao.chainId, chainId) && eq(dao.address, address),
    with: {
      governanceModules: {
        columns: {
          address: true,
          name: true,
          description: true,
        },
        with: {
          votingStrategies: {
            columns: {
              address: true,
              minProposerBalance: true,
              name: true,
              description: true,
            },
            with: {
              votingTokens: {
                columns: {
                  address: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!query) throw new ApiError("DAO not found", 404);

  return resf(c, query);
});

export default app;
