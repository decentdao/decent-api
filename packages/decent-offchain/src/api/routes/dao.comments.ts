import { Hono } from 'hono';
import { Comment } from 'decent-sdk';
import { eq, and } from 'drizzle-orm';
import { daoCheck } from '@/api/middleware/dao';
import { bearerAuth } from '@/api/middleware/auth';
import { permissionsCheck } from '@/api/middleware/permissions';
import { db } from '@/db';
import { DbComment, schema } from '@/db/schema';
import { formatComment } from '@/api/utils/typeConverter';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { WebSocketConnections } from '../ws/connections';
import { Topics } from '../ws/topics';

const app = new Hono();

/**
 * @title Get all comments for a proposal
 * @route GET /d/{chainId}/{address}/proposals/{slug}/comments
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug or id of the proposal
 * @returns {Comment[]} Array of comment objects
 */
app.get('/', daoCheck, async c => {
  const dao = c.get('dao');
  const slug = c.req.param('slug');

  const proposal = await db.query.proposalTable.findFirst({
    where: and(
      eq(schema.proposalTable.slug, slug),
      eq(schema.proposalTable.daoChainId, dao.chainId),
      eq(schema.proposalTable.daoAddress, dao.address),
    ),
  });

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const comments: DbComment[] = await db.query.commentTable.findMany({
    where: eq(schema.commentTable.proposalSlug, slug),
  });

  const ret: Comment[] = comments.map(formatComment);
  return resf(c, ret);
});

/**
 * @title Create a new comment for a proposal
 * @route POST /d/{chainId}/{address}/proposals/{slug}/comments
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug of the proposal
 * @param {NewComment} [body] - NewComment object to be inserted
 * @returns {Comment} The created comment object
 */
app.post('/', daoCheck, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');

  if (!user.permissions?.isVoter) throw new ApiError('Only voters can create comments', 403);
  const { content, replyToId } = await c.req.json();

  const slug = c.req.param('slug');
  const comment = await db
    .insert(schema.commentTable)
    .values({
      proposalSlug: slug,
      authorAddress: user.address,
      content,
      replyToId,
    })
    .returning();

  if (!comment.length || !comment[0]) throw new ApiError('Failed to create comment', 500);

  const ret: Comment = formatComment(comment[0]);
  const dao = c.get('dao');
  WebSocketConnections.updated(Topics.comments(dao.chainId, dao.address, slug), ret);
  return resf(c, ret);
});

/**
 * @title Update a comment
 * @route PUT /d/{chainId}/{address}/proposals/{slug}/comments/{id}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug of the proposal
 * @param {string} id - ID of the comment
 * @param {NewComment} [body] - NewComment object to be updated
 * @returns {Comment} The updated comment object
 */
app.put('/:id', daoCheck, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  const id = c.req.param('id');

  const { content } = await c.req.json();
  const comment = await db
    .update(schema.commentTable)
    .set({ content })
    .where(
      and(
        eq(schema.commentTable.id, id),
        eq(schema.commentTable.authorAddress, user.address), // only the author can update the comment
      ),
    )
    .returning();

  if (!comment.length || !comment[0])
    throw new ApiError('Comment not found or you are not the author', 403);

  const ret: Comment = formatComment(comment[0]);
  const dao = c.get('dao');
  const slug = c.req.param('slug');
  WebSocketConnections.updated(Topics.comments(dao.chainId, dao.address, slug), ret);
  return resf(c, ret);
});

/**
 * @title Delete a comment
 * @route DELETE /d/{chainId}/{address}/proposals/{slug}/comments/{id}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug of the proposal
 * @param {string} id - ID of the comment
 * @returns {}
 */
app.delete('/:id', daoCheck, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  const id = c.req.param('id');

  const comment = await db
    .delete(schema.commentTable)
    .where(
      and(
        eq(schema.commentTable.id, id),
        eq(schema.commentTable.authorAddress, user.address), // only the author can update the comment
      ),
    )
    .returning();

  if (!comment.length || !comment[0])
    throw new ApiError('Comment not found or you are not the author', 403);

  const ret: Comment = formatComment(comment[0]);
  const dao = c.get('dao');
  const slug = c.req.param('slug');
  WebSocketConnections.deleted(Topics.comments(dao.chainId, dao.address, slug), { id: ret.id });
  return resf(c, ret);
});

export default app;
