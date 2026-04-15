const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('hospital', 10);
console.log(hash);
console.log(bcrypt.compareSync('hospital', hash));
