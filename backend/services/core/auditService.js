const pool = require('../../config/db');

/**
 * Service to log activities in the audit_log table
 */
const auditService = {
  /**
   * Log an activity
   * @param {string} userId - User ID
   * @param {number} workspaceId - Workspace ID
   * @param {string} action - Action name (e.g., 'WORKSPACE_UPDATE', 'DEPLOYMENT_STARTED')
   * @param {object} details - Metadata about the action
   */
  log: async (userId, workspaceId, action, details = {}) => {
    try {
      const query = `
        INSERT INTO audit_log (user_id, workspace_id, action, details)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.resilientQuery(query, [userId, workspaceId, action, details]);
      console.log(`[AUDIT] Logged activity: ${action} for workspace ${workspaceId}`);
    } catch (err) {
      console.error('[AUDIT ERROR] Failed to log activity:', err.message);
    }
  },

  /**
   * Get activities for a workspace
   * @param {number} workspaceId - Workspace ID
   * @param {number} limit - Number of logs to fetch
   */
  getActivities: async (workspaceId, limit = 50) => {
    try {
      const query = `
        SELECT id, user_id, action, details, created_at
        FROM audit_log
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await pool.resilientQuery(query, [workspaceId, limit]);
      return result.rows;
    } catch (err) {
      console.error('[AUDIT ERROR] Failed to fetch activities:', err.message);
      return [];
    }
  }
};

module.exports = auditService;
