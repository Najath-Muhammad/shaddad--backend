const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 'test', role: 'ADMIN' }, 'test_secret', { expiresIn: '-1s' });
console.log(token);
