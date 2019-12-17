const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true},
  ext: { type: String, required: true},
  path: { type: String, required: true},
  type: { type: String, required: true},
}, { timestamps: true });


module.exports = mongoose.model('File', fileSchema);