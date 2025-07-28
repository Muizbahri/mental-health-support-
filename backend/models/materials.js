const db = require('../config/db');

exports.getAllMaterials = async () => {
  const [rows] = await db.query('SELECT * FROM manage_materials ORDER BY created_at DESC');
  return rows;
};

exports.getMaterialsByType = async (type) => {
  const [rows] = await db.query('SELECT * FROM manage_materials WHERE type = ? ORDER BY created_at DESC', [type]);
  return rows;
};

exports.createMaterial = async ({ type, title, upload, description }) => {
  const [result] = await db.query(
    'INSERT INTO manage_materials (type, title, upload, description, created_at) VALUES (?, ?, ?, ?, NOW())',
    [type, title, upload, description || '']
  );
  return result.insertId;
};

exports.updateMaterial = async (id, { type, title, upload, description }) => {
  const [result] = await db.query(
    'UPDATE manage_materials SET type=?, title=?, upload=?, description=? WHERE id=?',
    [type, title, upload, description, id]
  );
  return result.affectedRows > 0;
};

exports.deleteMaterial = async (id) => {
  const [result] = await db.query('DELETE FROM manage_materials WHERE id=?', [id]);
  return result.affectedRows > 0;
}; 