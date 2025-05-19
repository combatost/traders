import { Injectable } from '@angular/core';
import { openDB, DBSchema } from 'idb';

interface ClientImageDB extends DBSchema {
  images: {
    key: number; // unique id
    value: {
      clientId: string;
      timestamp: number;
      dataUrl: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class ImageStorageService {
  private dbPromise = openDB<ClientImageDB>('ClientImagesDB', 1, {
    upgrade(db) {
      db.createObjectStore('images', { keyPath: 'timestamp' });
    },
  });

  async saveImage(clientId: string, dataUrl: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('images', {
      clientId,
      dataUrl,
      timestamp: Date.now(),
    });
  }

  async getImagesForClient(clientId: string): Promise<{ url: string }[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('images');
    return all
      .filter(img => img.clientId === clientId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(img => ({ url: img.dataUrl }));
  }
  async deleteImage(clientId: string, index: number): Promise<void> {
  const db = await this.dbPromise;
  const tx = db.transaction('images', 'readwrite');
  const store = tx.objectStore('images');

  // Get all images for the client sorted by timestamp descending (latest first)
  const allImages = await store.getAll();
  const clientImages = allImages
    .filter(img => img.clientId === clientId)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (index < 0 || index >= clientImages.length) {
    console.warn('Invalid image index to delete');
    return;
  }

  // Find the image to delete
  const imageToDelete = clientImages[index];

  // Delete by its timestamp key
  await store.delete(imageToDelete.timestamp);

  await tx.done;
}

}
