const express = require('express')
const {fetchBrands, createBrand} = require('../Controller/Brand')

const router = express.Router()
router.get('/',fetchBrands).post('/',createBrand)

exports.router=router




