const axios = require('axios');
const FormData = require('form-data');

async function uploadToWbk(buffer, fileName) {
    const form = new FormData();
    form.append('file', buffer, fileName);

    try {
        const { data } = await axios.post('https://cdn.wbk.web.id/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (data && data.url) {
            return data.url;
        } else {
            throw new Error('Respons API tidak valid atau tidak berisi URL.');
        }
    } catch (error) {
        console.error('Error saat mengunggah ke wbk:', error.message);
        throw new Error(`Gagal mengunggah file: ${error.message}`);
    }
}

module.exports = uploadToWbk;
