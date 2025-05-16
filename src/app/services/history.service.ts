import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  constructor(private firestore: AngularFirestore) {}

  saveToHistory(userId: string, deletedData: any, type: string): Promise<void> {
    console.log('Saving to history:', deletedData);

    const historyEntry = {
      ...deletedData,
      type,
      deletedAt: new Date()
    };

    return this.firestore.collection(`history/${userId}/records`)
      .add(historyEntry)
      .then(() => {
        console.log('Deleted data saved to history successfully');
      })
      .catch(err => {
        console.error('Failed to save history entry:', err);
        throw err;
      });
  }
}
