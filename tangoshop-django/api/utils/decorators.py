from functools import wraps

from django.http import JsonResponse

def require_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user_data'):
            return JsonResponse({
                'success': False,
                'message': 'No autenticado'
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

def require_role(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'user_data'):
                return JsonResponse({
                    'success': False,
                    'message': 'No autenticado'
                }, status=401)

            user_type = request.user_data.get('userType')
            if user_type not in allowed_roles:
                return JsonResponse({
                    'success': False,
                    'message': f'Acceso denegado. Se requiere rol: {" o ".join(allowed_roles)}'
                }, status=403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator