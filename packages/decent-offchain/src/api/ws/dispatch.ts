import { WSContext } from 'hono/ws';
import app from '@/api/index';
import { ApiResponse, Dao } from 'decent-sdk';

export const Dispatch = {
  async topic(ws: WSContext<unknown>, topic: string): Promise<unknown> {
    const elements = topic.split(':');
    switch (elements[0]) {
      /*
        Get DAO information
        */
      case 'dao': {
        if (elements.length !== 3) {
          throw new Error('Invalid DAO topic format');
        }
        const daoChainId = parseInt(elements[1]!);
        const daoAddress = elements[2];

        const res = await app.request(`/d/${daoChainId}/${daoAddress}`);

        const { data } = (await res.json()) as ApiResponse<Dao>;
        return data;
      }

      /*
        Get proposals for a DAO.
        When new proposal is created, or existing proposal get, this topic will be updated.
        */
      case 'proposals': {
        if (elements.length !== 3) {
          throw new Error('Invalid Proposals topic format');
        }
        const daoChainId = parseInt(elements[1]!);
        const daoAddress = elements[2];

        const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals`);
        const { data } = (await res.json()) as ApiResponse<unknown>;
        return data;
      }

      /*
        Get comments for a proposal.
        When new comment is created, or existing comment get, this topic will be updated.
        */
      case 'comments': {
        if (elements.length !== 4) {
          throw new Error('Invalid Comments topic format');
        }
        const daoChainId = parseInt(elements[1]!);
        const daoAddress = elements[2];
        const slug = elements[3];

        const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${slug}/comments`);
        const { data } = (await res.json()) as ApiResponse<unknown>;
        return data;
      }

      default:
        throw new Error('Unsupported topic type');
    }
  },
};
