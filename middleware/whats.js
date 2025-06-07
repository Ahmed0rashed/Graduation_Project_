let client = null;

function setClient(whatsappClient) {
  client = whatsappClient;
}

function getClient() {
  return client;
}

function whatsappReadyMiddleware(req, res, next) {
  if (!client) {
    return res.status(503).json({ error: 'WhatsApp Client not ready' });
  }
  req.whatsappClient = client;
  next();
}

module.exports = { setClient, getClient, whatsappReadyMiddleware };
