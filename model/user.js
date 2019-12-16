const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { tyle: String, required: true },
  name: { tyle: String, required: true },
  password: { tyle: String, required: true },
  files: [{ type: Schema.Types.ObjectId, ref: 'Storage' }]
});


module.exports = mongoose.model('User', userSchema);