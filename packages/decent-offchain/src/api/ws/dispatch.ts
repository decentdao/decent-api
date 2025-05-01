import { WSContext } from 'hono/ws';
import app from '@/api/index';
import { ApiResponse, Dao } from 'decent-sdk';

export const Dispatch = {
  async topic(ws: WSContext<unknown>, topic: string): Promise<unknown> {
    const elements = topic.split(':');
    switch (elements[0]) {
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

      case 'proposal': {
        if (elements.length !== 4) {
          throw new Error('Invalid Proposal topic format');
        }
        const daoChainId = parseInt(elements[1]!);
        const daoAddress = elements[2];
        const proposalId = elements[3];

        const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${proposalId}`);
        const { data } = (await res.json()) as ApiResponse<unknown>;
        return data;
      }

      case 'comments': {
        if (elements.length !== 4) {
          throw new Error('Invalid Comments topic format');
        }
        const daoChainId = parseInt(elements[1]!);
        const daoAddress = elements[2];
        const proposalId = elements[3];

        const res = await app.request(
          `/d/${daoChainId}/${daoAddress}/proposals/${proposalId}/comments`,
        );
        const { data } = (await res.json()) as ApiResponse<unknown>;
        return data;
      }

      default:
        throw new Error('Unsupported topic type');
    }
  },
};
