const crypto = require('crypto');
const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

module.exports = {
  passportJwtSecret: () => {

    return (req, rawJwtToken, done) => {
      done(null, publicKey); // supply the public key directly
    };
  },
};