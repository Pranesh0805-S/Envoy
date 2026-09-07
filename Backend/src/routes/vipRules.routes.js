const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { getVipRules, createVipRule, deleteVipRule } = require('../services/vipRulesService')

router.get('/', verifyAuth, async (req, res) => {
  try {
    const rules = await getVipRules(req.user.id)
    res.json({ rules })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', verifyAuth, async (req, res) => {
  try {
    const { ruleType, ruleValue, action } = req.body
    const rule = await createVipRule(req.user.id, ruleType, ruleValue, action)
    res.json({ rule })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    await deleteVipRule(req.user.id, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router