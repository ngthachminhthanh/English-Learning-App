import * as FileSystem from 'expo-file-system';
import { decode as atob } from 'base-64'
import axios from 'axios';

async function getPresignedUrl(extension: string, contentType: string) {
    const response = await axios.get(
        `https://4ff9-2402-9d80-a50-28b-74ba-73d8-2b75-2551.ngrok-free.app/api/file/presigned-url?contentType=${contentType}&extension=${extension}`
    );
    return response.data.data; // { preSignedUrl, key }
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

async function uploadFileToS3(preSignedUrl: string, uri: string, mimeType: string) {
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    const fileBytes = base64ToUint8Array(fileBase64);
    const response = await fetch(preSignedUrl, {
        method: "PUT",
        headers: {
            "Content-Type": mimeType,
        },
        body: fileBytes,
    });
    if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to upload file to S3');
    }
}

export async function uploadFile(uri: string, fileName: string, mimeType: string, description: string) {
    try {
        const response = await getPresignedUrl(fileName.split('.').pop() || '', mimeType);
        const key = response.key;
        const preSignedUrl = response.preSignedUrl;
        await uploadFileToS3(preSignedUrl, uri, mimeType);
        return key;
    } catch (error) {
        console.error('Upload file failed:', error);
        throw error;
    }
}