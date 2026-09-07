const supabase = require('../config/supabase')

async function getVipRules(userId) {
  const { data, error } = await supabase
    .from('vip_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

async function createVipRule(userId, ruleType, ruleValue, action) {
  const { data, error } = await supabase
    .from('vip_rules')
    .insert({ user_id: userId, rule_type: ruleType, rule_value: ruleValue, action })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function deleteVipRule(userId, ruleId) {
  const { error } = await supabase
    .from('vip_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return { success: true }
}

// Apply rules to a categorized email list — rules override AI category
function applyVipRules(categorizedEmails, rawDigest, rules) {
  if (!rules.length) return categorizedEmails

  return categorizedEmails.map((item, i) => {
    const rawMail = rawDigest[i] || {}
    const from = (rawMail.from || '').toLowerCase()
    const subject = (rawMail.subject || '').toLowerCase()
    const snippet = (rawMail.snippet || '').toLowerCase()

    for (const rule of rules) {
      const value = rule.rule_value.toLowerCase()
      if (rule.rule_type === 'sender' && from.includes(value)) {
        return { ...item, category: rule.action, vipMatched: true, vipRule: `Sender matches "${rule.rule_value}"` }
      }
      if (rule.rule_type === 'keyword' && (subject.includes(value) || snippet.includes(value) || from.includes(value))) {
        return { ...item, category: rule.action, vipMatched: true, vipRule: `Keyword "${rule.rule_value}" found` }
      }
    }
    return item
  })
}

module.exports = { getVipRules, createVipRule, deleteVipRule, applyVipRules }