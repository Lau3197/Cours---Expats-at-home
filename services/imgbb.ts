// Service pour uploader des images vers ImgBB
const IMGBB_API_KEY = '042d82c60948f7c12443fb5233e82098';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      url: string;
    };
    medium: {
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Convertit un fichier en base64 (fallback si l'upload direct échoue)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // Enlever le préfixe data:image/...
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Upload une image vers ImgBB
 * @param file - Le fichier image à uploader
 * @returns L'URL de l'image uploadée
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  try {
    // Méthode 1: Essayer d'envoyer le fichier directement
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', file);
    
    let response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });
    
    // Si ça ne marche pas, essayer avec base64
    if (!response.ok) {
      const base64 = await fileToBase64(file);
      const formDataBase64 = new FormData();
      formDataBase64.append('key', IMGBB_API_KEY);
      formDataBase64.append('image', base64);
      
      response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formDataBase64
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ImgBB API error: ${response.statusText}`);
    }
    
    const data: ImgBBResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Upload failed');
    }
    
    // Retourner l'URL de l'image (utiliser display_url ou url)
    return data.data.display_url || data.data.url;
  } catch (error: any) {
    console.error('Error uploading image to ImgBB:', error);
    throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
  }
};

