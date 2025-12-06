from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.serializers import (
    RegisterResellerSerializer,
    RegisterSupplierSerializer,
    LoginSerializer,
    ReactivateAccountSerializer
)
from api.services.auth_service import auth_service
from api.services.catalog_service import catalog_service
from api.utils.decorators import require_auth, require_role
from api.services.supplier_service import supplier_service

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
    serializer = RegisterResellerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Error de validacion',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = auth_service.register_reseller(serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Revendedor registrado exitosamente',
            'data': result
        }, status=status.HTTP_201_CREATED)
    except ValueError as exc:
        code = status.HTTP_409_CONFLICT if 'email' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al registrar revendedor',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def register_supplier(request):
    serializer = RegisterSupplierSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Error de validacion',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = auth_service.register_supplier(serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Proveedor registrado exitosamente',
            'data': result
        }, status=status.HTTP_201_CREATED)
    except ValueError as exc:
        code = status.HTTP_409_CONFLICT if 'email' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al registrar proveedor',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Datos invalidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        result = auth_service.login(serializer.validated_data)
        return Response({
            'success': True,
            'message': 'Login exitoso',
            'data': result
        }, status=status.HTTP_200_OK)
    except ValueError as exc:
        code = status.HTTP_401_UNAUTHORIZED if 'Credenciales' in str(exc) or 'Cuenta desactivada' in str(exc) else status.HTTP_400_BAD_REQUEST
        return Response({'success': False, 'message': str(exc)}, status=code)
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al iniciar sesion',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def reactivate_account(request):
    serializer = ReactivateAccountSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Datos invalidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        result = auth_service.reactivate_account(email, password)
        
        return Response({
            'success': True,
            'message': result['message'],
            'data': {
                'token': result['token'],
                'refreshToken': result['refreshToken'],
                'user': result['user']
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as exc:
        error_message = str(exc)
        
        if 'ya esta activa' in error_message:
            code = status.HTTP_400_BAD_REQUEST
        elif 'Solo los revendedores' in error_message:
            code = status.HTTP_403_FORBIDDEN
        elif 'Credenciales invalidas' in error_message:
            code = status.HTTP_401_UNAUTHORIZED
        else:
            code = status.HTTP_400_BAD_REQUEST
        
        return Response({'success': False, 'message': error_message}, status=code)
        
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al reactivar cuenta',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@require_auth
@require_role('reseller')
def get_my_catalog(request):
    try:
        reseller_id = request.user_data['userId']
        result = catalog_service.get_reseller_catalog(reseller_id)
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)
        
    except ValueError as exc:
        return Response({
            'success': False,
            'message': str(exc)
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al obtener catálogo',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@require_auth
@require_role('supplier')
def get_resellers_high_markup(request, product_id):
    try:
        supplier_id = request.user_data['userId']
        result = supplier_service.get_resellers_high_markup(supplier_id, product_id)
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)
        
    except ValueError as exc:
        error_msg = str(exc)
        
        if 'no te pertenece' in error_msg:
            code = status.HTTP_403_FORBIDDEN
        elif 'no encontrado' in error_msg:
            code = status.HTTP_404_NOT_FOUND
        else:
            code = status.HTTP_400_BAD_REQUEST
        
        return Response({
            'success': False,
            'message': error_msg
        }, status=code)
        
    except Exception as exc:
        return Response({
            'success': False,
            'message': 'Error al obtener revendedores',
            'error': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)