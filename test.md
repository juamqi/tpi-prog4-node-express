🧪 GUÍA COMPLETA DE TESTING - TangoShop API v1.0.0
📋 TABLA DE CONTENIDOS

Configuración Inicial
Variables de Entorno
Flujo de Testing Recomendado
Testing por Módulo
Casos de Error Comunes
Checklist de Verificación


🔧 CONFIGURACIÓN INICIAL
Herramientas Recomendadas

Postman (https://www.postman.com/downloads/)
Thunder Client (VSCode Extension)
Insomnia (https://insomnia.rest/download)

URL Base
http://localhost:3000
Headers Globales
json{
  "Content-Type": "application/json"
}
Headers con Autenticación
json{
  "Content-Type": "application/json",
  "Authorization": "Bearer {ACCESS_TOKEN}"
}

🔐 VARIABLES DE ENTORNO
Crear archivo .env en la raíz del proyecto:
env# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_cambiar_en_produccion
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com

# Email (para forgot password)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=noreply@tangoshop.com
FRONTEND_URL=http://localhost:3000

🎯 FLUJO DE TESTING RECOMENDADO
Orden Sugerido:

✅ Health Check
✅ Registro de Usuarios
✅ Login
✅ Gestión de Perfil
✅ CRUD de Productos
✅ Sistema de Favoritos
✅ Categorías
✅ Recuperación de Contraseña


📦 TESTING POR MÓDULO

1️⃣ HEALTH CHECK & UTILITY
1.1 Health Check
✅ Test Exitoso
httpGET http://localhost:3000/
Respuesta Esperada (200):
json{
  "message": "TangoShop API funcion",
  "status": "online",
  "version": "1.0.0",
  "resellers": "/resellers",
  "products": "/products",
  "favorites": "/favorites"
}
❌ Test de Error - Ruta No Existe
httpGET http://localhost:3000/ruta-inexistente
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Endpoint no encontrado"
}

2️⃣ AUTH MODULE
2.1 Registro de Revendedor
✅ Test Exitoso
httpPOST http://localhost:3000/auth/register/reseller
Content-Type: application/json

{
  "email": "reseller1@test.com",
  "password": "Test1234",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+54 9 11 1234-5678",
  "website": "https://juanperez.com"
}
Respuesta Esperada (201):
json{
  "success": true,
  "message": "Revendedor registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "abc123xyz",
      "email": "reseller1@test.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "userType": "reseller",
      "phone": "+54 9 11 1234-5678",
      "website": "https://juanperez.com"
    }
  }
}
⚠️ IMPORTANTE: Guardar el token y refreshToken para tests siguientes
❌ Test: Email Inválido
json{
  "email": "email-invalido",
  "password": "Test1234",
  "firstName": "Juan",
  "lastName": "Pérez"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "El email debe ser valido"
    }
  ]
}
❌ Test: Contraseña Débil
json{
  "email": "reseller2@test.com",
  "password": "123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 8 caracteres"
    }
  ]
}
❌ Test: Contraseña Sin Mayúsculas
json{
  "email": "reseller3@test.com",
  "password": "test1234",
  "firstName": "Juan",
  "lastName": "Pérez"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "password",
      "message": "La contraseña debe contener mayusculas, minusculas y numeros"
    }
  ]
}
❌ Test: Campos Obligatorios Faltantes
json{
  "email": "reseller4@test.com",
  "password": "Test1234"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "firstName",
      "message": "El nombre es obligatorio"
    },
    {
      "field": "lastName",
      "message": "El apellido es obligatorio"
    }
  ]
}
❌ Test: Email Duplicado
json{
  "email": "reseller1@test.com",
  "password": "Test1234",
  "firstName": "Pedro",
  "lastName": "González"
}
Respuesta Esperada (409):
json{
  "success": false,
  "message": "El email ya esta registrado"
}

2.2 Registro de Proveedor
✅ Test Exitoso
httpPOST http://localhost:3000/auth/register/supplier
Content-Type: application/json

{
  "email": "supplier1@test.com",
  "password": "Test1234",
  "companyName": "Distribuidora ABC",
  "phone": "+54 9 11 9876-5432",
  "website": "https://distribuidoraabc.com",
  "address": {
    "province": "Buenos Aires",
    "city": "CABA",
    "street": "Av. Corrientes",
    "number": "1234"
  }
}
Respuesta Esperada (201):
json{
  "success": true,
  "message": "Proveedor registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "def456uvw",
      "email": "supplier1@test.com",
      "companyName": "Distribuidora ABC",
      "userType": "supplier",
      "phone": "+54 9 11 9876-5432",
      "website": "https://distribuidoraabc.com",
      "address": {
        "province": "Buenos Aires",
        "city": "CABA",
        "street": "Av. Corrientes",
        "number": "1234"
      }
    }
  }
}
❌ Test: Dirección Incompleta
json{
  "email": "supplier2@test.com",
  "password": "Test1234",
  "companyName": "Distribuidora XYZ",
  "phone": "+54 9 11 1111-2222",
  "address": {
    "province": "Buenos Aires",
    "city": "CABA"
  }
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "street",
      "message": "La calle es obligatoria"
    },
    {
      "field": "number",
      "message": "El numero es obligatorio"
    }
  ]
}
❌ Test: Sin Dirección
json{
  "email": "supplier3@test.com",
  "password": "Test1234",
  "companyName": "Distribuidora XYZ",
  "phone": "+54 9 11 1111-2222"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "address",
      "message": "La direccion es obligatoria"
    }
  ]
}

2.3 Login
✅ Test Exitoso
httpPOST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "reseller1@test.com",
  "password": "Test1234"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "abc123xyz",
      "email": "reseller1@test.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "userType": "reseller",
      "markupType": "percentage",
      "defaultMarkupValue": 0,
      "stats": {
        "totalFavorites": 0
      }
    }
  }
}
❌ Test: Credenciales Incorrectas
json{
  "email": "reseller1@test.com",
  "password": "ContraseñaIncorrecta"
}
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Credenciales invalidas"
}
❌ Test: Usuario No Existe
json{
  "email": "noexiste@test.com",
  "password": "Test1234"
}
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Credenciales invalidas"
}
❌ Test: Campos Faltantes
json{
  "email": "reseller1@test.com"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "password",
      "message": "La contraseña es obligatoria"
    }
  ]
}

2.4 Logout
✅ Test Exitoso
httpPOST http://localhost:3000/auth/logout
Content-Type: application/json
Authorization: Bearer {ACCESS_TOKEN}

{
  "refreshToken": "{REFRESH_TOKEN}"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Logout exitoso"
}
❌ Test: Sin Token de Autenticación
httpPOST http://localhost:3000/auth/logout
Content-Type: application/json

{
  "refreshToken": "{REFRESH_TOKEN}"
}
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Token no proporcionado"
}
❌ Test: Sin Refresh Token
httpPOST http://localhost:3000/auth/logout
Authorization: Bearer {ACCESS_TOKEN}

{}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "refreshToken",
      "message": "El refresh token es obligatorio"
    }
  ]
}

2.5 Refresh Token
✅ Test Exitoso
httpPOST http://localhost:3000/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "{REFRESH_TOKEN}"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Token renovado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
❌ Test: Refresh Token Inválido
json{
  "refreshToken": "token_invalido"
}
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Refresh token ivalido o expirado"
}

2.6 Forgot Password
✅ Test Exitoso
httpPOST http://localhost:3000/auth/forgot-password
Content-Type: application/json

{
  "email": "reseller1@test.com"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Si el email existe, recibiras un correo con instrucciones"
}
Nota: La respuesta es la misma si el email existe o no (por seguridad)
❌ Test: Email Inválido
json{
  "email": "email-invalido"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "El email debe ser valido"
    }
  ]
}

2.7 Reset Password
✅ Test Exitoso
httpPOST http://localhost:3000/auth/reset-password
Content-Type: application/json

{
  "token": "{RESET_TOKEN_FROM_EMAIL}",
  "newPassword": "NewTest1234"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
❌ Test: Token Inválido
json{
  "token": "token_invalido",
  "newPassword": "NewTest1234"
}
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Token invalido o expirado"
}
❌ Test: Contraseña Débil
json{
  "token": "{RESET_TOKEN}",
  "newPassword": "123"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "newPassword",
      "message": "La contraseña debe tener al menos 8 caracteres"
    }
  ]
}

3️⃣ RESELLERS MODULE
3.1 Ver Perfil Propio
✅ Test Exitoso
httpGET http://localhost:3000/resellers/profile
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "userId": "abc123xyz",
    "email": "reseller1@test.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+54 9 11 1234-5678",
    "website": "https://juanperez.com",
    "photoURL": "",
    "userType": "reseller",
    "markupType": "percentage",
    "defaultMarkupValue": 0,
    "catalogSettings": {
      "isPublic": true,
      "lastGenerated": null,
      "catalogUrl": ""
    },
    "stats": {
      "totalFavorites": 0
    }
  }
}
❌ Test: Sin Token
httpGET http://localhost:3000/resellers/profile
Respuesta Esperada (401):
json{
  "success": false,
  "message": "Token no proporcionado"
}
❌ Test: Token de Supplier (rol incorrecto)
httpGET http://localhost:3000/resellers/profile
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "No eres un revendedor"
}

3.2 Actualizar Perfil
✅ Test Exitoso
httpPUT http://localhost:3000/resellers/profile
Authorization: Bearer {RESELLER_TOKEN}
Content-Type: application/json

{
  "firstName": "Juan Carlos",
  "lastName": "Pérez García",
  "phone": "+54 9 11 5555-6666",
  "website": "https://nuevositio.com"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "userId": "abc123xyz",
    "email": "reseller1@test.com",
    "firstName": "Juan Carlos",
    "lastName": "Pérez García",
    "phone": "+54 9 11 5555-6666",
    "website": "https://nuevositio.com",
    "userType": "reseller"
  }
}
❌ Test: Sin Campos para Actualizar
json{}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Debes proporcionar al menos un campo para actualizar"
}
❌ Test: URL Inválida
json{
  "website": "sitio-invalido"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "website",
      "message": "El sitio web debe ser una URL valida"
    }
  ]
}

3.3 Actualizar Foto de Perfil
✅ Test Exitoso
httpPUT http://localhost:3000/resellers/profile/photo
Authorization: Bearer {RESELLER_TOKEN}
Content-Type: application/json

{
  "photoURL": "https://example.com/photos/perfil.jpg"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Foto de perfil actualizada exitosamente",
  "data": {
    "userId": "abc123xyz",
    "photoURL": "https://example.com/photos/perfil.jpg"
  }
}
❌ Test: URL Inválida
json{
  "photoURL": "no-es-una-url"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "photoURL",
      "message": "La URL de la foto debe ser valida"
    }
  ]
}

3.4 Listar Revendedores
✅ Test Exitoso
httpGET http://localhost:3000/resellers?page=1&limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "userId": "abc123xyz",
      "firstName": "Juan",
      "lastName": "Pérez",
      "photoURL": "",
      "website": "https://juanperez.com",
      "stats": {
        "totalFavorites": 0
      },
      "catalogSettings": {
        "isPublic": true
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
❌ Test: Página Inválida
httpGET http://localhost:3000/resellers?page=0
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "page",
      "message": "La pagina debe ser mayor a 0"
    }
  ]
}

3.5 Ver Revendedor por ID
✅ Test Exitoso
httpGET http://localhost:3000/resellers/{RESELLER_ID}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "userId": "abc123xyz",
    "firstName": "Juan",
    "lastName": "Pérez",
    "photoURL": "",
    "website": "https://juanperez.com",
    "stats": {
      "totalFavorites": 0
    },
    "catalogSettings": {
      "isPublic": true
    }
  }
}
❌ Test: ID No Existe
httpGET http://localhost:3000/resellers/id_inexistente
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Revendedor no encontrado"
}

3.6 Desactivar Cuenta
✅ Test Exitoso
httpPUT http://localhost:3000/resellers/account/deactivate
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Cuenta desactivada exitosamente"
}
❌ Test: Cuenta Ya Desactivada
httpPUT http://localhost:3000/resellers/account/deactivate
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "La cuenta ya está desactivada"
}

4️⃣ SUPPLIERS MODULE
4.1 Ver Perfil Propio
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/profile
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "userId": "def456uvw",
    "email": "supplier1@test.com",
    "companyName": "Distribuidora ABC",
    "phone": "+54 9 11 9876-5432",
    "website": "https://distribuidoraabc.com",
    "photoURL": "",
    "userType": "supplier",
    "address": {
      "province": "Buenos Aires",
      "city": "CABA",
      "street": "Av. Corrientes",
      "number": "1234"
    },
    "stats": {
      "totalProducts": 0,
      "avgRating": 0,
      "totalReviews": 0,
      "totalFavorites": 0
    }
  }
}
❌ Test: Token de Reseller (rol incorrecto)
httpGET http://localhost:3000/suppliers/profile
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "No eres un proveedor"
}

4.2 Actualizar Perfil
✅ Test Exitoso
httpPUT http://localhost:3000/suppliers/profile
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: application/json

{
  "companyName": "Distribuidora ABC S.A.",
  "phone": "+54 9 11 7777-8888",
  "website": "https://nuevositio.com",
  "address": {
    "province": "Buenos Aires",
    "city": "La Plata",
    "street": "Calle 50",
    "number": "567"
  }
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "userId": "def456uvw",
    "companyName": "Distribuidora ABC S.A.",
    "phone": "+54 9 11 7777-8888",
    "website": "https://nuevositio.com",
    "address": {
      "province": "Buenos Aires",
      "city": "La Plata",
      "street": "Calle 50",
      "number": "567"
    }
  }
}
❌ Test: Sin Campos para Actualizar
json{}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "No hay campos validos para actualizar"
}

4.3 Listar Proveedores
✅ Test Exitoso
httpGET http://localhost:3000/suppliers?page=1&limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "userId": "def456uvw",
      "companyName": "Distribuidora ABC",
      "photoURL": "",
      "website": "https://distribuidoraabc.com",
      "address": {
        "province": "Buenos Aires",
        "city": "CABA",
        "street": "Av. Corrientes",
        "number": "1234"
      },
      "stats": {
        "totalProducts": 0,
        "avgRating": 0,
        "totalReviews": 0,
        "totalFavorites": 0
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
✅ Test con Filtros
httpGET http://localhost:3000/suppliers?province=Buenos Aires&minRating=4&page=1&limit=10

4.4 Ver Proveedor por ID
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/{SUPPLIER_ID}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "userId": "def456uvw",
    "companyName": "Distribuidora ABC",
    "photoURL": "",
    "website": "https://distribuidoraabc.com",
    "address": {
      "province": "Buenos Aires",
      "city": "CABA",
      "street": "Av. Corrientes",
      "number": "1234"
    },
    "stats": {
      "totalProducts": 0,
      "avgRating": 0,
      "totalReviews": 0,
      "totalFavorites": 0
    }
  }
}

4.5 Ver Productos del Proveedor
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/{SUPPLIER_ID}/products
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Producto Ejemplo",
      "description": "Descripción del producto",
      "price": 100,
      "photoURL": "",
      "categoryId": "cat123",
      "supplierId": "def456uvw",
      "rating": 0,
      "reviewCount": 0,
      "favoritesCount": 0,
      "isActive": true
    }
  ]
}

4.6 Ver Estadísticas del Proveedor
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/{SUPPLIER_ID}/stats
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "totalProducts": 5,
    "avgRating": 4.5,
    "totalReviews": 10,
    "totalFavorites": 25
  }
}

4.7 Ver Reseñas del Proveedor
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/{SUPPLIER_ID}/reviews
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "reviewId": "rev123",
      "productId": "prod123",
      "productName": "Producto Ejemplo",
      "rating": 5,
      "comment": "Excelente producto",
      "reseller": {
        "id": "res123",
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    }
  ]
}

4.8 Ver Revendedores del Proveedor
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/{SUPPLIER_ID}/resellers
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "resellerId": "res123",
      "firstName": "Juan",
      "lastName": "Pérez",
      "photoURL": "",
      "totalFavorites": 5
    }
  ]
}

4.9 Ver Quién Favoritea un Producto
✅ Test Exitoso
httpGET http://localhost:3000/suppliers/products/{PRODUCT_ID}/favorites
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "resellerId": "res123",
      "firstName": "Juan",
      "lastName": "Pérez",
      "photoURL": "",
      "markupType": "percentage",
      "markupValue": 15
    }
  ]
}
❌ Test: Producto No Existe
httpGET http://localhost:3000/suppliers/products/prod_inexistente/favorites
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Producto no encontrado"
}

5️⃣ PRODUCTS MODULE
5.1 Crear Producto (Solo Supplier)
✅ Test Exitoso
httpPOST http://localhost:3000/products
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: application/json

{
  "name": "Notebook Dell Inspiron 15",
  "description": "Laptop con procesador Intel Core i5, 8GB RAM, 256GB SSD",
  "price": 85000,
  "categoryId": "{CATEGORY_ID}"
}
Respuesta Esperada (201):
json{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "productId": "prod123xyz",
    "supplierId": "def456uvw",
    "categoryId": "cat123",
    "name": "Notebook Dell Inspiron 15",
    "description": "Laptop con procesador Intel Core i5, 8GB RAM, 256GB SSD",
    "price": 85000,
    "photoURL": "",
    "rating": 0,
    "reviewCount": 0,
    "favoritesCount": 0,
    "isActive": true
  }
}
❌ Test: Token de Reseller (rol incorrecto)
httpPOST http://localhost:3000/products
Authorization: Bearer {RESELLER_TOKEN}
Content-Type: application/json

{
  "name": "Producto Test",
  "price": 100,
  "categoryId": "cat123"
}
Respuesta Esperada (403):
json{
  "success": false,
  "message": "Acceso denegado. Se requiere rol: supplier"
}
❌ Test: Nombre Muy Corto
json{
  "name": "PC",
  "price": 100,
  "categoryId": "cat123"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "name",
      "message": "El nombre debe tener al menos 3 caracteres"
    }
  ]
}
❌ Test: Precio Negativo
json{
  "name": "Producto Test",
  "price": -100,
  "categoryId": "cat123"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "price",
      "message": "El precio debe ser un número positivo"
    }
  ]
}
❌ Test: Sin Categoría
json{
  "name": "Producto Test",
  "price": 100
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "categoryId",
      "message": "La categoría es obligatoria"
    }
  ]
}
❌ Test: Categoría No Existe
json{
  "name": "Producto Test",
  "price": 100,
  "categoryId": "cat_inexistente"
}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "La categoría especificada no existe"
}

5.2 Listar Productos
✅ Test Exitoso
httpGET http://localhost:3000/products?page=1&limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Notebook Dell Inspiron 15",
      "description": "Laptop con procesador Intel Core i5",
      "price": 85000,
      "photoURL": "",
      "rating": 0,
      "reviewCount": 0,
      "favoritesCount": 0,
      "supplier": {
        "companyName": "Distribuidora ABC",
        "address": {
          "province": "Buenos Aires",
          "city": "CABA"
        }
      },
      "category": {
        "name": "Electrónica"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalProducts": 1,
    "productsPerPage": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
✅ Test con Filtros
httpGET http://localhost:3000/products?categoryId=cat123&minPrice=50000&maxPrice=100000&page=1&limit=10
✅ Test con Búsqueda por Nombre
httpGET http://localhost:3000/products?name=notebook&page=1&limit=10

5.3 Buscar Productos
✅ Test Exitoso
httpGET http://localhost:3000/products/search?name=notebook&limit=20
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Notebook Dell Inspiron 15",
      "price": 85000,
      "supplier": {
        "companyName": "Distribuidora ABC"
      }
    }
  ],
  "count": 1
}
❌ Test: Término Muy Corto
httpGET http://localhost:3000/products/search?name=n
Respuesta Esperada (400):
json{
  "success": false,
  "message": "El término de búsqueda debe tener al menos 2 caracteres"
}
❌ Test: Sin Parámetro de Búsqueda
httpGET http://localhost:3000/products/search
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Se requiere el parámetro \"name\" para buscar"
}

5.4 Productos Mejor Valorados
✅ Test Exitoso
httpGET http://localhost:3000/products/top-rated?limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Producto con Rating Alto",
      "rating": 4.8,
      "reviewCount": 25,
      "price": 50000
    }
  ],
  "count": 1
}

5.5 Productos Recientes
✅ Test Exitoso
httpGET http://localhost:3000/products/recent?limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Producto Reciente",
      "price": 50000,
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ],
  "count": 1
}

5.6 Ver Producto por ID
✅ Test Exitoso
httpGET http://localhost:3000/products/{PRODUCT_ID}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "productId": "prod123",
    "name": "Notebook Dell Inspiron 15",
    "description": "Laptop con procesador Intel Core i5",
    "price": 85000,
    "photoURL": "",
    "rating": 0,
    "reviewCount": 0,
    "favoritesCount": 0,
    "isActive": true,
    "supplier": {
      "companyName": "Distribuidora ABC",
      "address": {
        "province": "Buenos Aires",
        "city": "CABA"
      }
    },
    "category": {
      "name": "Electrónica"
    }
  }
}
❌ Test: Producto No Existe
httpGET http://localhost:3000/products/prod_inexistente
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Producto no encontrado"
}

5.7 Actualizar Producto
✅ Test Exitoso
httpPUT http://localhost:3000/products/{PRODUCT_ID}
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: application/json

{
  "name": "Notebook Dell Inspiron 15 (Actualizado)",
  "price": 87000,
  "description": "Nueva descripción actualizada"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "productId": "prod123",
    "name": "Notebook Dell Inspiron 15 (Actualizado)",
    "price": 87000,
    "description": "Nueva descripción actualizada"
  }
}
❌ Test: Sin Campos para Actualizar
json{}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "_schema",
      "message": "Debe proporcionar al menos un campo para actualizar"
    }
  ]
}
❌ Test: Producto de Otro Supplier
httpPUT http://localhost:3000/products/{PRODUCT_ID_DE_OTRO}
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: application/json

{
  "name": "Intento de actualización"
}
Respuesta Esperada (403):
json{
  "success": false,
  "message": "No tienes permiso para modificar este producto"
}

5.8 Actualizar Foto de Producto
✅ Test Exitoso (con archivo)
httpPUT http://localhost:3000/products/{PRODUCT_ID}/photo
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: multipart/form-data

photo: [archivo.jpg]
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Foto actualizada exitosamente",
  "data": {
    "productId": "prod123",
    "photoURL": "https://storage.googleapis.com/.../productos/prod123.jpg"
  }
}
❌ Test: Sin Archivo
httpPUT http://localhost:3000/products/{PRODUCT_ID}/photo
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Se requiere una imagen"
}
❌ Test: Archivo Muy Grande (>5MB)
httpPUT http://localhost:3000/products/{PRODUCT_ID}/photo
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: multipart/form-data

photo: [archivo_grande.jpg (>5MB)]
Respuesta Esperada (400):
json{
  "success": false,
  "message": "El archivo es demasiado grande. Tamaño máximo: 5MB"
}
❌ Test: Tipo de Archivo Inválido
httpPUT http://localhost:3000/products/{PRODUCT_ID}/photo
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: multipart/form-data

photo: [documento.pdf]
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)"
}

5.9 Eliminar Producto (Soft Delete)
✅ Test Exitoso
httpDELETE http://localhost:3000/products/{PRODUCT_ID}
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Producto eliminado exitosamente",
  "data": {
    "productId": "prod123"
  }
}
❌ Test: Producto de Otro Supplier
httpDELETE http://localhost:3000/products/{PRODUCT_ID_DE_OTRO}
Authorization: Bearer {SUPPLIER_TOKEN}
Respuesta Esperada (403):
json{
  "success": false,
  "message": "No tienes permiso para eliminar este producto"
}

6️⃣ FAVORITES MODULE
6.1 Agregar a Favoritos
✅ Test Exitoso
httpPOST http://localhost:3000/favorites
Authorization: Bearer {RESELLER_TOKEN}
Content-Type: application/json

{
  "productId": "{PRODUCT_ID}"
}
Respuesta Esperada (201):
json{
  "success": true,
  "message": "Producto agregado a favoritos",
  "data": {
    "favoriteId": "fav123xyz",
    "resellerId": "res123",
    "productId": "prod123",
    "supplierId": "sup123",
    "markupType": "default",
    "markupValue": 0,
    "isActive": true,
    "defaultMarkupType": "percentage",
    "defaultMarkupValue": 0
  }
}
❌ Test: Producto No Existe
json{
  "productId": "prod_inexistente"
}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Producto no encontrado"
}
❌ Test: Producto Ya en Favoritos
json{
  "productId": "{PRODUCT_ID_YA_AGREGADO}"
}
Respuesta Esperada (409):
json{
  "success": false,
  "message": "El producto ya está en tus favoritos"
}
❌ Test: Producto Inactivo
json{
  "productId": "{PRODUCT_ID_INACTIVO}"
}
Respuesta Esperada (409):
json{
  "success": false,
  "message": "El producto no está disponible"
}
❌ Test: Sin Product ID
json{}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "productId",
      "message": "El ID del producto es obligatorio"
    }
  ]
}
❌ Test: Token de Supplier (rol incorrecto)
httpPOST http://localhost:3000/favorites
Authorization: Bearer {SUPPLIER_TOKEN}
Content-Type: application/json

{
  "productId": "{PRODUCT_ID}"
}
Respuesta Esperada (403):
json{
  "success": false,
  "message": "Acceso denegado. Se requiere rol: reseller"
}

6.2 Listar Mis Favoritos
✅ Test Exitoso
httpGET http://localhost:3000/favorites?page=1&limit=10
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "favoriteId": "fav123",
      "resellerId": "res123",
      "productId": "prod123",
      "markupType": "percentage",
      "markupValue": 15,
      "isActive": true,
      "addedAt": "2024-01-20T10:30:00Z",
      "product": {
        "productId": "prod123",
        "name": "Notebook Dell",
        "price": 85000,
        "photoURL": "",
        "rating": 4.5,
        "supplier": {
          "companyName": "Distribuidora ABC"
        },
        "category": {
          "name": "Electrónica"
        },
        "finalPrice": 97750
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalFavorites": 1,
    "favoritesPerPage": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}

6.3 Favoritos por Categoría
✅ Test Exitoso
httpGET http://localhost:3000/favorites/by-category
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "categoryId": "cat123",
      "categoryName": "Electrónica",
      "products": [
        {
          "favoriteId": "fav123",
          "productId": "prod123",
          "markupType": "percentage",
          "markupValue": 15,
          "product": {
            "name": "Notebook Dell",
            "price": 85000,
            "finalPrice": 97750
          }
        }
      ]
    }
  ],
  "totalCategories": 1
}

6.4 Ver Detalle de Favorito 🆕
✅ Test Exitoso
httpGET http://localhost:3000/favorites/{PRODUCT_ID}
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "favoriteId": "fav123",
    "resellerId": "res123",
    "productId": "prod123",
    "supplierId": "sup123",
    "markupType": "percentage",
    "markupValue": 15,
    "isActive": true,
    "addedAt": "2024-01-20T10:30:00Z",
    "product": {
      "productId": "prod123",
      "name": "Notebook Dell Inspiron 15",
      "description": "Laptop con procesador Intel Core i5",
      "price": 85000,
      "photoURL": "",
      "rating": 4.5,
      "reviewCount": 10,
      "favoritesCount": 25,
      "supplier": {
        "companyName": "Distribuidora ABC",
        "address": {
          "province": "Buenos Aires",
          "city": "CABA",
          "street": "Av. Corrientes",
          "number": "1234"
        }
      },
      "category": {
        "name": "Electrónica"
      },
      "finalPrice": 97750
    }
  }
}
❌ Test: Producto No en Favoritos
httpGET http://localhost:3000/favorites/prod_no_favorito
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "El producto no está en tus favoritos"
}

6.5 Ver Configuración de Markup
✅ Test Exitoso
httpGET http://localhost:3000/favorites/{PRODUCT_ID}/markup
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "favoriteId": "fav123",
    "productId": "prod123",
    "productName": "Notebook Dell",
    "basePrice": 85000,
    "currentMarkup": {
      "type": "percentage",
      "value": 15
    },
    "defaultMarkup": {
      "type": "percentage",
      "value": 0
    },
    "finalPrice": 97750
  }
}
❌ Test: Producto No en Favoritos
httpGET http://localhost:3000/favorites/prod_no_favorito/markup
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "El producto no está en tus favoritos"
}

6.6 Configurar Markup del Producto
✅ Test: Markup Porcentual
httpPUT http://localhost:3000/favorites/{PRODUCT_ID}/markup
Authorization: Bearer {RESELLER_TOKEN}
Content-Type: application/json

{
  "markupType": "percentage",
  "markupValue": 20
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Configuración de markup actualizada",
  "data": {
    "favoriteId": "fav123",
    "markupType": "percentage",
    "markupValue": 20
  }
}
✅ Test: Markup Fijo
json{
  "markupType": "fixed",
  "markupValue": 5000
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Configuración de markup actualizada",
  "data": {
    "favoriteId": "fav123",
    "markupType": "fixed",
    "markupValue": 5000
  }
}
✅ Test: Usar Markup Por Defecto
json{
  "markupType": "default"
}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Configuración de markup actualizada",
  "data": {
    "favoriteId": "fav123",
    "markupType": "default",
    "markupValue": 0
  }
}
❌ Test: Tipo Inválido
json{
  "markupType": "invalido",
  "markupValue": 10
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "markupType",
      "message": "El tipo de markup debe ser: fixed, percentage o default"
    }
  ]
}
❌ Test: Valor Negativo
json{
  "markupType": "percentage",
  "markupValue": -10
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "markupValue",
      "message": "El valor de markup no puede ser negativo"
    }
  ]
}
❌ Test: Valor con Tipo Default
json{
  "markupType": "default",
  "markupValue": 10
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "markupValue",
      "message": "No se debe especificar markupValue cuando el tipo es \"default\""
    }
  ]
}
❌ Test: Sin MarkupValue (cuando no es default)
json{
  "markupType": "percentage"
}
Respuesta Esperada (400):
json{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "markupValue",
      "message": "El valor de markup es obligatorio cuando el tipo no es \"default\""
    }
  ]
}

6.7 Quitar de Favoritos
✅ Test Exitoso
httpDELETE http://localhost:3000/favorites/{PRODUCT_ID}
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (200):
json{
  "success": true,
  "message": "Producto eliminado de favoritos",
  "data": {
    "productId": "prod123"
  }
}
❌ Test: Producto No en Favoritos
httpDELETE http://localhost:3000/favorites/prod_no_favorito
Authorization: Bearer {RESELLER_TOKEN}
Respuesta Esperada (404):
json{
  "success": false,
  "message": "El producto no está en tus favoritos"
}

7️⃣ CATEGORIES MODULE
7.1 Listar Categorías
✅ Test Exitoso
httpGET http://localhost:3000/categories?page=1&limit=10
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "categoryId": "cat123",
      "name": "Electrónica",
      "description": "Productos electrónicos y tecnología",
      "productCount": 15
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}

7.2 Categorías Populares
✅ Test Exitoso
httpGET http://localhost:3000/categories/popular?limit=5
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "categoryId": "cat123",
      "name": "Electrónica",
      "description": "Productos electrónicos",
      "productCount": 15,
      "totalFavorites": 50
    }
  ]
}

7.3 Ver Categoría por ID
✅ Test Exitoso
httpGET http://localhost:3000/categories/{CATEGORY_ID}
Respuesta Esperada (200):
json{
  "success": true,
  "data": {
    "categoryId": "cat123",
    "name": "Electrónica",
    "description": "Productos electrónicos y tecnología",
    "productCount": 15
  }
}
❌ Test: Categoría No Existe
httpGET http://localhost:3000/categories/cat_inexistente
Respuesta Esperada (404):
json{
  "success": false,
  "message": "Categoría no encontrada"
}

7.4 Productos de una Categoría
✅ Test Exitoso
httpGET http://localhost:3000/categories/{CATEGORY_ID}/products
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "productId": "prod123",
      "name": "Notebook Dell",
      "description": "Laptop Intel Core i5",
      "price": 85000,
      "photoURL": "",
      "supplier": {
        "supplierId": "sup123",
        "companyName": "Distribuidora ABC",
        "photoURL": ""
      },
      "rating": 4.5,
      "reviewCount": 10,
      "favoritesCount": 25
    }
  ]
}

7.5 Proveedores de una Categoría
✅ Test Exitoso
httpGET http://localhost:3000/categories/{CATEGORY_ID}/suppliers
Respuesta Esperada (200):
json{
  "success": true,
  "data": [
    {
      "supplierId": "sup123",
      "companyName": "Distribuidora ABC",
      "photoURL": "",
      "website": "https://distribuidoraabc.com",
      "productsInCategory": 5,
      "stats": {
        "totalProducts": 10,
        "avgRating": 4.5,
        "totalReviews": 20,
        "totalFavorites": 50
      }
    }
  ]
}

📊 CASOS DE ERROR COMUNES
🔴 Errores de Autenticación
Sin Token
httpGET http://localhost:3000/resellers/profile
Error 401: Token no proporcionado
Token Expirado
httpGET http://localhost:3000/resellers/profile
Authorization: Bearer {EXPIRED_TOKEN}
Error 401: Token expirado
Token Inválido
httpGET http://localhost:3000/resellers/profile
Authorization: Bearer token_invalido
Error 401: Token invalido

🔴 Errores de Autorización
Rol Incorrecto
httpPOST http://localhost:3000/products
Authorization: Bearer {RESELLER_TOKEN}
Error 403: Acceso denegado. Se requiere rol: supplier

🔴 Errores de Validación
Email Inválido
json{
  "email": "no-es-email"
}
Error 400: El email debe ser valido
Campos Faltantes
json{
  "email": "test@test.com"
}
Error 400: El password es obligatorio
Valor Fuera de Rango
json{
  "page": -1
}
Error 400: La página debe ser al menos 1

🔴 Errores de Recursos
Recurso No Encontrado
httpGET http://localhost:3000/products/prod_inexistente
Error 404: Producto no encontrado
Recurso Ya Existe
json{
  "email": "email_ya_registrado@test.com"
}
Error 409: El email ya esta registrado

✅ CHECKLIST DE VERIFICACIÓN
Módulo AUTH

 Registro reseller exitoso
 Registro reseller con email duplicado falla
 Registro supplier exitoso
 Login exitoso
 Login con credenciales incorrectas falla
 Refresh token exitoso
 Logout exitoso
 Forgot password envía email
 Reset password exitoso

Módulo RESELLERS

 Ver perfil propio exitoso
 Ver perfil sin token falla
 Actualizar perfil exitoso
 Listar revendedores exitoso
 Ver revendedor por ID exitoso
 Desactivar cuenta exitoso

Módulo SUPPLIERS

 Ver perfil propio exitoso
 Actualizar perfil exitoso
 Listar proveedores exitoso
 Ver proveedor por ID exitoso
 Ver productos del proveedor exitoso
 Ver estadísticas del proveedor exitoso

Módulo PRODUCTS

 Crear producto (supplier) exitoso
 Crear producto (reseller) falla por rol
 Listar productos exitoso
 Buscar productos exitoso
 Ver producto por ID exitoso
 Actualizar producto exitoso
 Actualizar foto exitoso
 Eliminar producto exitoso

Módulo FAVORITES

 Agregar a favoritos exitoso
 Agregar producto duplicado falla
 Listar favoritos exitoso
 Favoritos por categoría exitoso
 Ver detalle favorito exitoso 🆕
 Ver configuración markup exitoso
 Configurar markup porcentual exitoso
 Configurar markup fijo exitoso
 Configurar markup default exitoso
 Quitar de favoritos exitoso

Módulo CATEGORIES

 Listar categorías exitoso
 Categorías populares exitoso
 Ver categoría por ID exitoso
 Productos de categoría exitoso
 Proveedores de categoría exitoso


🎯 FLUJO DE TESTING COMPLETO
1. Setup Inicial
bash# Iniciar servidor
npm start

# Verificar health check
GET http://localhost:3000/
2. Crear Usuarios de Prueba
bash# Registrar Reseller
POST /auth/register/reseller
→ Guardar token como RESELLER_TOKEN

# Registrar Supplier
POST /auth/register/supplier
→ Guardar token como SUPPLIER_TOKEN
3. Crear Productos (como Supplier)
bash# Crear producto 1
POST /products
Authorization: SUPPLIER_TOKEN

# Crear producto 2
POST /products
Authorization: SUPPLIER_TOKEN
4. Probar Sistema de Favoritos (como Reseller)
bash# Agregar a favoritos
POST /favorites
Authorization: RESELLER_TOKEN

# Ver mis favoritos
GET /favorites
Authorization: RESELLER_TOKEN

# Ver detalle de favorito 🆕
GET /favorites/{PRODUCT_ID}
Authorization: RESELLER_TOKEN

# Configurar markup
PUT /favorites/{PRODUCT_ID}/markup
Authorization: RESELLER_TOKEN

# Quitar de favoritos
DELETE /favorites/{PRODUCT_ID}
Authorization: RESELLER_TOKEN
5. Probar Búsqueda y Filtros
bash# Listar productos
GET /products

# Buscar productos
GET /products/search?name=notebook

# Productos top rated
GET /products/top-rated

# Productos recientes
GET /products/recent
6. Probar Categorías
bash# Listar categorías
GET /categories

# Categorías populares
GET /categories/popular

# Productos de categoría
GET /categories/{CATEGORY_ID}/products

📝 NOTAS FINALES

Tokens: Todos los tokens deben incluirse en el header Authorization: Bearer {token}
Paginación: Por defecto page=1 y limit=10
Markup: Puede ser fixed (monto fijo), percentage (porcentaje), o default (usar configuración por defecto del reseller)
Soft Delete: Los productos eliminados no se borran de la base de datos, solo se marcan como isActive: false
Timestamps: Todas las fechas están en formato ISO 8601


🎉 ¡Testing Guide Completo! La API está lista para ser probada exhaustivamente.