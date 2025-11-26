const { db, admin } = require('../../config/firebase');

const mapDoc = (doc) => ({ id: doc.id, ...doc.data() });
const mapDocs = (snap) => snap.docs.map(mapDoc);

const buildError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class NotificationService {
  async getMyNotifications(userId) {
    const snap = await db
      .collection('notifications')
      .where('userId', '==', userId)
      //.orderBy('createdAt', 'desc')
      .get();

    return mapDocs(snap);
  }

  async markAsRead(userId, notificationId) {
    const docRef = db.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw buildError('Notificación no encontrada', 404);
    }

    const notif = doc.data();
    if (notif.userId !== userId) {
      throw buildError('No podés modificar esta notificación', 403);
    }

    await docRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updated = await docRef.get();
    return mapDoc(updated);
  }

  async deleteNotification(userId, notificationId) {
    const docRef = db.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw buildError('Notificación no encontrada', 404);
    }

    const notif = doc.data();
    if (notif.userId !== userId) {
      throw buildError('No podés eliminar esta notificación', 403);
    }

    await docRef.delete();
    return true;
  }
}

module.exports = new NotificationService();