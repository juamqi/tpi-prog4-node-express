const { db, admin } = require('../../config/firebase');

const mapDoc = (doc) => ({ id: doc.id, ...doc.data() });
const mapDocs = (snap) => snap.docs.map(mapDoc);

const buildError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class ReviewService {
  async createReview(resellerId, payload) {
    const { productId, rating, comment } = payload;

    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw buildError('Producto no encontrado', 404);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const reviewId = `${productId}_${resellerId}`;
    const docRef = db.collection('reviews').doc(reviewId);

    const data = {
      productId,
      resellerId,
      rating,
      comment,
      likes: 0,
      createdAt: now,
      updatedAt: now
    };

    try {
      await docRef.create(data);
    } catch (err) {
      if (err.code === 6 || err.code === 'already-exists') {
        throw buildError('Ya creaste una reseña para este producto', 400);
      }
      throw err;
    }

    const snap = await docRef.get();
    return mapDoc(snap);
  }

  async getReviewsByProduct(productId) {
    const snap = await db
      .collection('reviews')
      .where('productId', '==', productId)
      //.orderBy('createdAt', 'desc')
      .get();

    return mapDocs(snap);
  }

  async getReviewById(id) {
    const doc = await db.collection('reviews').doc(id).get();

    if (!doc.exists) {
      throw buildError('Reseña no encontrada', 404);
    }

    return mapDoc(doc);
  }

  async updateReview(resellerId, reviewId, data) {
    const docRef = db.collection('reviews').doc(reviewId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw buildError('Reseña no encontrada', 404);
    }

    const review = doc.data();
    if (review.resellerId !== resellerId) {
      throw buildError('No podés editar esta reseña', 403);
    }

    const updatedData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updatedData);

    const snap = await docRef.get();
    return mapDoc(snap);
  }

  async deleteReview(resellerId, reviewId) {
    const docRef = db.collection('reviews').doc(reviewId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw buildError('Reseña no encontrada', 404);
    }

    const review = doc.data();
    if (review.resellerId !== resellerId) {
      throw buildError('No podés eliminar esta reseña', 403);
    }

    await docRef.delete();
    return true;
  }

  async getMyReviews(resellerId) {
    const snap = await db
      .collection('reviews')
      .where('resellerId', '==', resellerId)
      //.orderBy('createdAt', 'desc')
      .get();

    return mapDocs(snap);
  }

  async likeReview(reviewId) {
    const docRef = db.collection('reviews').doc(reviewId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw buildError('Reseña no encontrada', 404);
    }

    await docRef.update({
      likes: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updated = await docRef.get();
    return mapDoc(updated);
  }
}

module.exports = new ReviewService();