const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth.routes')
const mailRoutes = require('./routes/mail.routes')
const actionsRoutes = require('./routes/actions.routes')
const calendarRoutes = require('./routes/calendar.routes')
const agentRoutes = require('./routes/agent.routes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/mail', mailRoutes)
app.use('/api/actions', actionsRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/agent', agentRoutes)

module.exports = app