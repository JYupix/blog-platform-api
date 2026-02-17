import { Router } from 'express';
import * as controller from './posts.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', controller.getPosts);
router.get('/my-posts', authenticateToken, controller.getMyPosts);
router.get('/:slug', controller.getPostBySlug);
router.post('/', authenticateToken, controller.createPost);
router.patch('/:id', authenticateToken, controller.updatePost);
router.delete('/:id', authenticateToken, controller.deletePost);

export default router;