const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const { createUser, getAllUsers, getUserByUsername, deleteUser } = require('../db'); // Add deleteUser
require('dotenv').config();
const { requireUser } = require('./utils');

usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users");

  next();
});

usersRouter.get('/', async (req, res) => {
  const users = await getAllUsers();

  res.send({
    users
  });
});

usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      // create token & return to user
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
      res.send({ message: "you're logged in!", token });
    } else {
      next({ 
        name: 'IncorrectCredentialsError', 
        message: 'Username or password is incorrect'
      });
    }
  } catch(error) {
    console.log(error);
    next(error);
  }
});

usersRouter.patch('/:userId', requireUser, async (req, res, next) => {
    const { userId } = req.params;
    const { username, password, name, location } = req.body;
  
    try {
      const updatedUser = await updateUser(userId, { username, password, name, location });
  
      if (updatedUser) {
        res.send({ message: 'User updated successfully', user: updatedUser });
      } else {
        next({ name: 'UserUpdateError', message: 'Failed to update user' });
      }
    } catch (error) {
      next(error);
    }
  });
  
  usersRouter.delete('/:userId', requireUser, async (req, res, next) => {
    try {
      const deletedUser = await deleteUser(req.params.userId);
  
      if (deletedUser) {
        res.send({ message: 'User account deactivated successfully' });
      } else {
        next({ name: 'UserNotFoundError', message: 'User not found' });
      }
    } catch (error) {
      next(error);
    }
  });
  

module.exports = usersRouter;