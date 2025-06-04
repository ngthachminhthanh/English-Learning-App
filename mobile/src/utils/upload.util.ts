import axios from 'axios';

async function getPresignedUrl(extension: string, contentType: string) {
    console.log("extension", extension);
    console.log("contentType", contentType);

    const response = await axios.get(`https://e1eb-2402-9d80-a50-5f9e-f82f-5689-4b55-617e.ngrok-free.app/api/file/presigned-url?contentType=${contentType}&extension=${extension}`);

    console.log("url", response.data)
    return response.data; // { preSignedUrl, key }
}

async function uploadFileToS3(preSignedUrl: string, file: File) {
    console.log("file.type", file.type);
    console.log("preSignedUrl", preSignedUrl);
    const response = await axios.put(preSignedUrl, file, {
        headers: {
            'Content-Type': file.type,
        },

        withCredentials: false
    });
    if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to upload file to S3');
    }
}


export async function uploadFile(file: File, description: string) {
    try {
        const response = await getPresignedUrl(file.name.split('.').pop() || '', file.type);
        const key= response.data.key
        const preSignedUrl = response.data.preSignedUrl

        console.log("key", key);

        console.log("preSignedUrl", preSignedUrl)
        await uploadFileToS3(preSignedUrl, file);
        // await notifyBackendFileUploaded( key, description);
        return key;
    } catch (error) {
        console.error('Upload file failed:', error);
        throw error;
    }
}
