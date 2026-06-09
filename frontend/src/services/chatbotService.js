import api from './api';

const chatbotService = {
  /**
   * Submit query to direct Web UI chatbot endpoint.
   * Expected payload: { user_id, message, language, channel }
   */
  async query(payload) {
    const response = await api.post('/api/v1/chatbot/query', {
      user_id: payload.user_id || null,
      message: payload.message,
      language: payload.language || 'en',
      channel: payload.channel || 'web'
    });
    return response.data;
  }
};

export default chatbotService;
