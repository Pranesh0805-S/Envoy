const supabase = require('../config/supabase')

async function createPendingAction(userId, actionType, targetEmailId, payload = {}) {
  const { data, error } = await supabase
    .from('pending_actions')
    .insert({
      user_id: userId,
      action_type: actionType, // 'delete' | 'archive'
      target_email_id: targetEmailId,
      payload,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function getPendingActions(userId) {
  const { data, error } = await supabase
    .from('pending_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

async function updateActionStatus(userId, actionId, status) {
  const { data, error } = await supabase
    .from('pending_actions')
    .update({ status })
    .eq('id', actionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

module.exports = { createPendingAction, getPendingActions, updateActionStatus }