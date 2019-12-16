const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storageSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  files: [{
    name: { type: String, required: true},
    path: { type: String, required: true},
    type: { type: String, required: true},
    createdAt: { type: String, required: true},
    updatedAt: { type: String }
  }]
});


module.exports = mongoose.model('Storage', storageSchema);