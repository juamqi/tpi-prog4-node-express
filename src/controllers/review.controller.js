const admin = require("firebase-admin");
const { db } = require("../../config/firebase.js");

const mapDocs = (snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

exports.createReview = async (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const { productId, rating, comment } = req.body;

    const now = new Date();
    const reviewId = `${productId}_${resellerId}`;
    const docRef = db.collection("reviews").doc(reviewId);

    const data = {
      productId,
      resellerId,
      rating,
      comment,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await docRef.create(data);
    } catch (err) {
      if (err.code === 6 || err.code === "already-exists") {
        return res
          .status(400)
          .json({ error: "Ya creaste una reseña para este producto." });
      }
      throw err;
    }

    const snap = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...snap.data() });
  } catch (error) {
    next(error);
  }
};

exports.getReviewsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const snap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .orderBy("createdAt", "desc")
      .get();

    return res.json(mapDocs(snap));
  } catch (error) {
    next(error);
  }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("reviews").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;
    const data = req.body;

    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    const review = doc.data();
    if (review.resellerId !== resellerId) {
      return res.status(403).json({ error: "No podés editar esta reseña" });
    }

    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };

    await docRef.update(updatedData);

    const snap = await docRef.get();
    return res.json({ id: docRef.id, ...snap.data() });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;

    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    const review = doc.data();
    if (review.resellerId !== resellerId) {
      return res.status(403).json({ error: "No podés eliminar esta reseña" });
    }

    await docRef.delete();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const resellerId = req.user.id;

    const snap = await db
      .collection("reviews")
      .where("resellerId", "==", resellerId)
      .orderBy("createdAt", "desc")
      .get();

    return res.json(mapDocs(snap));
  } catch (error) {
    next(error);
  }
};

exports.likeReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    await docRef.update({
      likes: admin.firestore.FieldValue.increment(1),
    });

    const updated = await docRef.get();
    const data = updated.data();

    return res.json({
      message: "Like agregado",
      likes: data.likes || 0,
    });
  } catch (error) {
    next(error);
  }
};