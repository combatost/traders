import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const deleteAuthUserOnFirestoreUserDelete = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId

    try {
      await admin.auth().deleteUser(userId)
      console.log(`Deleted auth user ${userId} after Firestore user deletion`)
    } catch (error) {
      console.error(`Error deleting auth user ${userId}:`, error)
    }
  })
