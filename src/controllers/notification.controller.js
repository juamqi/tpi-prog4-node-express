const { db } = require("../../config/firebase.js");

const mapDocs = (snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const snap = await db
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return res.json(mapDocs(snap));
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const docRef = db.collection("notifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    const notif = doc.data();
    if (notif.userId !== userId) {
      return res.status(403).json({ error: "No podés modificar esta notificación" });
    }

    await docRef.update({ read: true });

    return res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const docRef = db.collection("notifications").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    const notif = doc.data();
    if (notif.userId !== userId) {
      return res.status(403).json({ error: "No podés eliminar esta notificación" });
    }

    await docRef.delete();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
