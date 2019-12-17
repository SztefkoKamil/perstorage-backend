const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  files: [{ type: Schema.Types.ObjectId, ref: 'Storage' }]
});


module.exports = mongoose.model('User', userSchema);