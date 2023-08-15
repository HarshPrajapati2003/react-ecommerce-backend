const express = require('express')
const { fetchUserById, updateUser } = require('../Controller/User')

const router = express.Router()
// /user is already added in base path
router.get('/own',fetchUserById)
      .patch('/:id',updateUser)

exports.router=router