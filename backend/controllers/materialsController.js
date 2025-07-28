const materialsModel = require('../models/materials');

exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await materialsModel.getAllMaterials();
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMaterialsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const materials = await materialsModel.getMaterialsByType(type);
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const { type, title, upload, description } = req.body;
    if (!type || !title || !upload) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const id = await materialsModel.createMaterial({ type, title, upload, description });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, upload, description } = req.body;
    const success = await materialsModel.updateMaterial(id, { type, title, upload, description });
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await materialsModel.deleteMaterial(id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 