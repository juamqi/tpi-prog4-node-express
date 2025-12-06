from django.urls import path

from api import views

urlpatterns = [
    path('', views.api_root, name='api_root'),
    path('health/', views.health_check, name='health_check'),
    path('auth/register/reseller/', views.register_reseller, name='register_reseller'),
    path('auth/register/supplier/', views.register_supplier, name='register_supplier'),
    path('auth/login/', views.login, name='login'),
    path('auth/reactivate-account/', views.reactivate_account, name='reactivate_account'),
    path('catalog/my-catalog/', views.get_my_catalog, name='get_my_catalog'),
    path('suppliers/products/<str:product_id>/high-markup-resellers/', views.get_resellers_high_markup, name='get_resellers_high_markup')
]
