const express = require('express');
const postsRouter = express.Router();
const { requireUser } = require('./utils');
const { createPost, updatePost, deletePost, getAllPosts, getPostById } = require('../db');

postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");
  next();
});

postsRouter.get('/', async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      return post.active || (req.user && post.author.id === req.user.id);
    });

    res.send({ posts });
  } catch ({ name, message }) {
    next({ name, message });
  }
});
postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;
    const tagArr = tags.trim().split(/\s+/);
    const postData = {
      authorId: req.user.id,
      title,
      content,
      tags: tagArr
    };
  
    try {
      const post = await createPost(postData);
      if (post) {
        res.send({ post });
      } else {
        next({ name: 'PostCreationError', message: 'Failed to create post' });
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  });
  
  postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
  
    try {
      const originalPost = await getPostById(postId); 
  
      if (originalPost.authorId === req.user.id) { 
        const updatedPost = await updatePost(postId, { title, content, tags });
  
        if (updatedPost) {
          res.send({ message: 'Post updated successfully', post: updatedPost });
        } else {
          next({ name: 'PostUpdateError', message: 'Failed to update post' });
        }
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: 'You cannot update a post that is not yours',
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
      const deletedPost = await deletePost(req.params.postId);
  
      if (deletedPost) {
        res.send({ message: 'Post deleted successfully' });
      } else {
        next({ name: 'PostNotFoundError', message: 'Post not found' });
      }
    } catch (error) {
      next(error);
    }
  });

module.exports = postsRouter;
