module.exports = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'No autenticado' });
  req.usuario = { id: userId };
  next();
}; 