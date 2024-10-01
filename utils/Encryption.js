import crypto from 'crypto';

class CryptoService {
    constructor(encryptionKeyBase64) {
        this.algorithm = 'aes-256-ctr';

        // Convert the base64-encoded key to a Buffer
        const keyBuffer = Buffer.from(encryptionKeyBase64, 'base64');

        // Ensure the key length is 32 bytes (256 bits)
        if (keyBuffer.length !== 32) {
            throw new Error('Invalid key length. Key must be 32 bytes.');
        }

        this.secretKey = keyBuffer;
    }

    // Encrypt the given text
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16); // Initialization vector (16 bytes for aes-256-ctr)
            const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
            const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
            
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error) {
            throw new Error('Encryption error: ' + error.message);
        }
    }

    // Decrypt the given hash
    decrypt(hash) {
        try {
            const parts = hash.split(':');
            const iv = Buffer.from(parts.shift(), 'hex');
            const encryptedText = Buffer.from(parts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
            const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error('Decryption error: ' + error.message);
        }
    }
}

export default CryptoService;
