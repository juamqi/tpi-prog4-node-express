const reviewService = require('../services/reviewService');

class ReviewController {
  async createReview(req, res) {
    try {
      const resellerId = req.user.userId;
      const review = await reviewService.createReview(resellerId, req.body);

      res.status(201).json({
        success: true,
        data: review
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear reseña',
        error: error.message
      });
    }
  }

  async getReviewsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await reviewService.getReviewsByProduct(productId);

      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener reseñas',
        error: error.message
      });
    }
  }

  async getReviewById(req, res) {
    try {
      const { id } = req.params;
      const review = await reviewService.getReviewById(id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener la reseña',
        error: error.message
      });
    }
  }

  async updateReview(req, res) {
    try {
      const resellerId = req.user.userId;
      const { id } = req.params;
      const data = req.body;

      const review = await reviewService.updateReview(resellerId, id, data);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar la reseña',
        error: error.message
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const resellerId = req.user.userId;
      const { id } = req.params;

      await reviewService.deleteReview(resellerId, id);
      return res.status(204).send();
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar la reseña',
        error: error.message
      });
    }
  }

  async getMyReviews(req, res) {
    try {
      const resellerId = req.user.userId;
      const reviews = await reviewService.getMyReviews(resellerId);

      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener tus reseñas',
        error: error.message
      });
    }
  }

  async likeReview(req, res) {
    try {
      const { id } = req.params;
      const review = await reviewService.likeReview(id);

      res.status(200).json({
        success: true,
        message: 'Like agregado',
        likes: review.likes || 0
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al agregar like',
        error: error.message
      });
    }
  }
}

module.exports = new ReviewController();
