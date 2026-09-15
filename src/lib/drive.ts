import { ensureDriveToken } from './firebase';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * Helper to compress images before uploading
 */
export const compressImage = (file: File, maxWidth = 1920): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file); // Return original if not an image
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85 // Quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Searches for a folder by name, or creates it if not found.
 */
async function getOrCreateFolder(token: string, folderName: string, parentId?: string): Promise<string> {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  // Search
  const searchRes = await fetch(`${DRIVE_API_URL}?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create
  const createRes = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    })
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create folder ${folderName}`);
  }
  
  const createData = await createRes.json();
  return createData.id;
}

export async function uploadToDrive(file: File, projectName: string) {
  const token = await ensureDriveToken();

  // 1. Get or create root folder "DFW Monev Hub"
  const rootFolderId = await getOrCreateFolder(token, 'DFW Monev Hub');
  
  // 2. Get or create project folder
  const projectFolderId = await getOrCreateFolder(token, projectName, rootFolderId);

  // 3. Compress if image
  const fileToUpload = await compressImage(file);

  // 4. Upload file
  const metadata = {
    name: fileToUpload.name,
    parents: [projectFolderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileToUpload);

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Upload error:", errText);
    throw new Error('Failed to upload file to Google Drive');
  }

  const data = await res.json();
  
  // Request webViewLink
  const linkRes = await fetch(`${DRIVE_API_URL}/${data.id}?fields=webViewLink`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const linkData = await linkRes.json();

  return {
    id: data.id,
    name: fileToUpload.name,
    url: linkData.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
  };
}
