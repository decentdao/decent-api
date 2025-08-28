import { eq } from 'ponder';
import { ponder } from 'ponder:registry';
import { role, roleTerm } from 'ponder:schema';

ponder.on('HatsElectionEligibility:ElectionCompleted', async ({ event, context }) => {
  try {
    const eligibility = event.log.address;
    const roleExists = await context.db.sql
      .select()
      .from(role)
      .where(eq(role.eligibility, eligibility))
      .limit(1);

    if (!roleExists) return;

    const { termEnd, winners } = event.args;
    const wearerAddress = winners[0]; // Decent app only allows 1 winner

    await context.db.insert(roleTerm).values({
      eligibility,
      termEnd,
      wearerAddress
    })
  } catch (e) {
    // no log
  }
});
