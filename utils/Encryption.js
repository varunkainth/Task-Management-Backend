import crypto from 'crypto';

class CryptoService {
    constructor(encryptionKey) {
        this.algorithm = 'aes-256-ctr';
        this.secretKey = encryptionKey;
    }

    // Encrypt the given text
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    // Decrypt the given hash
    decrypt(hash) {
        const parts = hash.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

        return decrypted.toString();
    }
}

export default CryptoService;
