const { getClient } = require('../middleware/whats');

exports.sendMessage = async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({ error: 'WhatsApp Client not ready yet' });
  }

  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: 'number and message are required' });
  }

  const chatId = `${number}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    res.status(200).json({ success: true, message: 'sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'failed to send', details: err.message });
  }
};
