const notificationService = require('../services/notificationService');

class NotificationController {
  async getMyNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const notifications = await notificationService.getMyNotifications(userId);

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error.message
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await notificationService.markAsRead(userId, id);

      res.status(200).json({
        success: true,
        message: 'Notificación marcada como leída'
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
        message: 'Error al actualizar la notificación',
        error: error.message
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await notificationService.deleteNotification(userId, id);
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
        message: 'Error al eliminar la notificación',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
