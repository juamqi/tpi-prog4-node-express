import os

import jwt
from django.http import JsonResponse

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_secret = os.getenv('JWT_SECRET')
        self.jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')

    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return self.get_response(request)

        token = auth_header.split(' ')[1]

        try:
            decoded = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )

            request.user_data = {
                'userId': decoded.get('userId'),
                'email': decoded.get('email'),
                'userType': decoded.get('userType')
            }

        except jwt.ExpiredSignatureError:
            return JsonResponse({
                'success': False,
                'message': 'Token expirado',
                'expired': True
            }, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({
                'success': False,
                'message': 'Token inválido'
            }, status=401)

        return self.get_response(request)
