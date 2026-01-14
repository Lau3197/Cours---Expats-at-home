
// Service to handle YouTube API interactions

const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

export const uploadToYouTube = async (accessToken: string, file: Blob, title: string, description: string = "Course Video"): Promise<string> => {
    try {
        // 1. Initiate Resumable Upload Session
        const metadata = {
            snippet: {
                title: title,
                description: description,
                tags: ["French Mastery", "Course"],
                categoryId: 27 // Education
            },
            status: {
                privacyStatus: "unlisted", // Only people with the link (our app) can view
                selfDeclaredMadeForKids: false
            }
        };

        const initResponse = await fetch(YOUTUBE_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Length': file.size.toString(),
                'X-Upload-Content-Type': file.type || 'video/webm'
            },
            body: JSON.stringify(metadata)
        });

        if (!initResponse.ok) {
            const errorText = await initResponse.text();
            throw new Error(`Failed to initiate upload: ${initResponse.statusText} - ${errorText}`);
        }

        const uploadUrl = initResponse.headers.get('Location');
        if (!uploadUrl) {
            throw new Error("No upload location header received from YouTube");
        }

        // 2. Upload the Binary File
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'video/webm',
                'Content-Length': file.size.toString()
            },
            body: file
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Failed to upload file: ${uploadResponse.statusText} - ${errorText}`);
        }

        const data = await uploadResponse.json();
        return data.id; // Return the Video ID

    } catch (error) {
        console.error("YouTube Upload Error:", error);
        throw error;
    }
};
