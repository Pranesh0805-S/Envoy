const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const mailRoutes = require('./routes/mail.routes')
const actionsRoutes = require('./routes/actions.routes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/mail', mailRoutes)
app.use('/api/actions', actionsRoutes)

module.exports = app