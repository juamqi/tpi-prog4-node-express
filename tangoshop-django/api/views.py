from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.services.auth_service import auth_service

@api_view(['GET'])
def api_root(_request):
    return Response({
        'message': 'TangoShop Django API',
        'status': 'online',
        'version': '1.0.0'
    })

@api_view(['GET'])
def health_check(_request):
    return Response({
        'success': True,
        'message': 'OK'
    })

@api_view(['POST'])
def register_reseller(request):
    try:
        result = auth_service.register_reseller(request.data)
        return Response({'success': True, 'message': 'Revendedor registrado exitosamente', 'data': result}, status=status.HTTP_201_CREATED)
    except ValueError as exc:
        code = status.HTTP_409_CONFLICT if 'email' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:   
        return Response({'success': False, 'message': 'Error al registrar revendedor', 'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def register_supplier(request):
    try:
        result = auth_service.register_supplier(request.data)
        return Response({'success': True, 'message': 'Proveedor registrado exitosamente', 'data': result}, status=status.HTTP_201_CREATED)
    except ValueError as exc:
        code = status.HTTP_409_CONFLICT if 'email' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:   
        return Response({'success': False, 'message': 'Error al registrar proveedor', 'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login(request):
    try:
        result = auth_service.login(request.data)
        return Response({'success': True, 'message': 'Login exitoso', 'data': result})
    except ValueError as exc:
        code = status.HTTP_401_UNAUTHORIZED if 'Credenciales' in str(exc) or 'Cuenta desactivada' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:   
        return Response({'success': False, 'message': 'Error al iniciar sesion', 'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)