import os
from datetime import datetime, timedelta
from typing import Dict, Tuple

import bcrypt
import jwt
from firebase_admin import firestore

from api.utils.firebase_config import db

def _parse_expires(value: str, default: timedelta) -> timedelta:
    if not value:
        return default
    value = value.strip().lower()
    try:
        if value.endswith('d'):
            return timedelta(days=int(value[:-1] or 0))
        if value.endswith('h'):
            return timedelta(hours=int(value[:-1] or 0))
        if value.endswith('m'):
            return timedelta(minutes=int(value[:-1] or 0))
        return timedelta(seconds=int(value))
    except (TypeError, ValueError):
        return default

class AuthService:
    def __init__(self) -> None:
        self.jwt_secret = os.getenv('JWT_SECRET', 'change-me')
        self.jwt_refresh_secret = os.getenv('JWT_REFRESH_SECRET', self.jwt_secret)
        self.jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.access_expires = _parse_expires(os.getenv('JWT_EXPIRES_IN'), timedelta(hours=1))
        self.refresh_expires = _parse_expires(os.getenv('JWT_REFRESH_EXPIRES_IN'), timedelta(days=7))

    def _generate_tokens(self, user_id: str, email: str, user_type: str) -> Tuple[str, str]:
        now = datetime.utcnow()
        access_payload = {
            'userId': user_id,
            'email': email,
            'userType': user_type,
            'iat': int(now.timestamp()),
            'exp': int((now + self.access_expires).timestamp()),
        }
        refresh_payload = {
            'userId': user_id,
            'email': email,
            'userType': user_type,
            'iat': int(now.timestamp()),
            'exp': int((now + self.refresh_expires).timestamp()),
        }

        access_token = jwt.encode(access_payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        refresh_token = jwt.encode(refresh_payload, self.jwt_refresh_secret, algorithm=self.jwt_algorithm)

        db.collection('refreshTokens').add({
            'userId': user_id,
            'token': refresh_token,
            'isValid': True,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'expiresAt': now + self.refresh_expires,
        })

        return access_token, refresh_token

    def _find_user_by_email(self, email: str):
        snap = db.collection('users').where('email', '==', email).get()
        return snap[0] if snap else None

    def register_reseller(self, payload: Dict) -> Dict:
        email = payload.get('email')
        password = payload.get('password')
        first_name = payload.get('firstName')
        last_name = payload.get('lastName')
        phone = payload.get('phone', '')
        website = payload.get('website', '')

        if self._find_user_by_email(email):
            raise ValueError('El email ya esta registrado')

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        user_doc = db.collection('users').add({
            'email': email,
            'password': hashed_password,
            'firstName': first_name,
            'lastName': last_name,
            'userType': 'reseller',
            'phone': phone,
            'website': website,
            'photoURL': '',
            'isActive': True,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })[1]

        user_id = user_doc.id

        db.collection('resellers').document(user_id).set({
            'userId': user_id,
            'markupType': 'percentage',
            'defaultMarkupValue': 0,
            'catalogSettings': {
                'isPublic': True,
                'lastGenerated': None,
                'catalogUrl': '',
            },
            'stats': {
                'totalFavorites': 0,
            },
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })

        db.collection('notifications').add({
            'userId': user_id,
            'type': 'welcome',
            'message': 'Bienvenido a TangoShop, explora productos y crea tu catalogo.',
            'data': {},
            'read': False,
            'createdAt': firestore.SERVER_TIMESTAMP,
        })

        access_token, refresh_token = self._generate_tokens(user_id, email, 'reseller')

        return {
            'token': access_token,
            'refreshToken': refresh_token,
            'user': {
                'userId': user_id,
                'email': email,
                'firstName': first_name,
                'lastName': last_name,
                'userType': 'reseller',
                'phone': phone,
                'website': website,
            },
        }

    def register_supplier(self, payload: Dict) -> Dict:
        email = payload.get('email')
        password = payload.get('password')
        company_name = payload.get('companyName')
        phone = payload.get('phone', '')
        website = payload.get('website', '')
        address = payload.get('address', {})

        if self._find_user_by_email(email):
            raise ValueError('El email ya esta registrado')

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        user_doc = db.collection('users').add({
            'email': email,
            'password': hashed_password,
            'firstName': company_name,
            'lastName': '',
            'userType': 'supplier',
            'phone': phone,
            'website': website,
            'photoURL': '',
            'isActive': True,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })[1]

        user_id = user_doc.id

        db.collection('suppliers').document(user_id).set({
            'userId': user_id,
            'companyName': company_name,
            'address': {
                'province': address.get('province'),
                'city': address.get('city'),
                'street': address.get('street'),
                'number': address.get('number'),
            },
            'stats': {
                'totalProducts': 0,
                'avgRating': 0,
                'totalReviews': 0,
                'totalFavorites': 0,
            },
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })

        db.collection('notifications').add({
            'userId': user_id,
            'type': 'welcome',
            'message': 'Bienvenido a TangoShopm comienza a gestionar tus productos.',
            'data': {},
            'read': False,
            'createdAt': firestore.SERVER_TIMESTAMP,
        })

        access_token, refresh_token = self._generate_tokens(user_id, email, 'supplier')

        return {
            'token': access_token,
            'refreshToken': refresh_token,
            'user': {
                'userId': user_id,
                'email': email,
                'companyName': company_name,
                'userType': 'supplier',
                'phone': phone,
                'website': website,
                'address': address,
            },
        }

    def login(self, credentials: Dict) -> Dict:
        email = credentials.get('email')
        password = credentials.get('password')

        user_doc = self._find_user_by_email(email)
        if not user_doc:
            raise ValueError('Credenciales invalidas')

        user_data = user_doc.to_dict()
        user_id = user_doc.id

        if not user_data.get('isActive', True):
            raise ValueError('Cuenta desactivada')

        if not bcrypt.checkpw(password.encode(), user_data['password'].encode()):
            raise ValueError('Credenciales invalidas')

        access_token, refresh_token = self._generate_tokens(user_id, user_data['email'], user_data['userType'])

        additional_data = {}
        if user_data['userType'] == 'reseller':
            reseller_doc = db.collection('resellers').document(user_id).get()
            if reseller_doc.exists:
                additional_data = reseller_doc.to_dict()
        elif user_data['userType'] == 'supplier':
            supplier_doc = db.collection('suppliers').document(user_id).get()
            if supplier_doc.exists:
                additional_data = supplier_doc.to_dict()

        return {
            'token': access_token,
            'refreshToken': refresh_token,
            'user': {
                'userId': user_id,
                'email': user_data['email'],
                'firstName': user_data.get('firstName'),
                'lastName': user_data.get('lastName'),
                'userType': user_data.get('userType'),
                'phone': user_data.get('phone'),
                'website': user_data.get('website'),
                'photoURL': user_data.get('photoURL'),
                **additional_data,
            },
        }

    def logout(self, user_id: str, refresh_token: str):
        snap = db.collection('refreshTokens') \
            .where('userId', '==', user_id) \
            .where('token', '==', refresh_token) \
            .where('isValid', '==', True) \
            .get()

        if not snap:
            raise ValueError('Token no encontrado')

        batch = db.batch()
        for doc in snap:
            batch.update(doc.reference, {'isValid': False})
        batch.commit()
        return {'message': 'Logout exitoso'}

    def refresh_token(self, refresh_token: str) -> Dict:
        try:
            decoded = jwt.decode(refresh_token, self.jwt_refresh_secret, algorithms=[self.jwt_algorithm])
        except jwt.PyJWTError:
            raise ValueError('Refresh token invalido o expirado')

        snap = db.collection('refreshTokens') \
            .where('token', '==', refresh_token) \
            .where('isValid', '==', True) \
            .get()

        if not snap:
            raise ValueError('Refresh token no valido')

        token_doc = snap[0]
        token_data = token_doc.to_dict()
        exp_value = token_data.get('expiresAt')
        exp_dt = exp_value.to_datetime() if hasattr(exp_value, 'to_datetime') else exp_value
        if exp_dt and exp_dt < datetime.utcnow():
            token_doc.reference.update({'isValid': False})
            raise ValueError('Refresh token expirado')

        token_doc.reference.update({'isValid': False})

        access_token, new_refresh_token = self._generate_tokens(decoded['userId'], decoded['email'], decoded['userType'])
        return {'token': access_token, 'refreshToken': new_refresh_token}

    def forgot_password(self, email: str) -> Dict:
        user_doc = self._find_user_by_email(email)
        if not user_doc:
            return {'message': 'Si el email existe, recibiras un correo con instrucciones'}

        user_id = user_doc.id
        reset_payload = {
            'userId': user_id,
            'email': email,
            'type': 'password-reset',
            'iat': int(datetime.utcnow().timestamp()),
            'exp': int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        reset_token = jwt.encode(reset_payload, self.jwt_secret, algorithm=self.jwt_algorithm)

        db.collection('passwordResets').add({
            'userId': user_id,
            'token': reset_token,
            'email': email,
            'isUsed': False,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'expiresAt': datetime.utcnow() + timedelta(hours=1),
        })

        return {'message': 'Si el email existe, recibiras un correo con instrucciones'}

    def reset_password(self, token: str, new_password: str) -> Dict:
        try:
            decoded = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            if decoded.get('type') != 'password-reset':
                raise ValueError('Token invalido')
        except jwt.PyJWTError:
            raise ValueError('Token invalido o expirado')

        snap = db.collection('passwordResets') \
            .where('token', '==', token) \
            .where('isUsed', '==', False) \
            .get()

        if not snap:
            raise ValueError('Token invalido o ya utilizado')

        reset_doc = snap[0]
        reset_data = reset_doc.to_dict()
        exp_value = reset_data.get('expiresAt')
        exp_dt = exp_value.to_datetime() if hasattr(exp_value, 'to_datetime') else exp_value
        if exp_dt and exp_dt < datetime.utcnow():
            raise ValueError('Token expirado')

        hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

        user_snap = db.collection('users').document(decoded['userId']).get()
        if not user_snap.exists:
            raise ValueError('Usuario no encontrado')

        db.collection('users').document(decoded['userId']).update({
            'password': hashed_password,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })

        reset_doc.reference.update({'isUsed': True})

        tokens_snap = db.collection('refreshTokens') \
            .where('userId', '==', decoded['userId']) \
            .where('isValid', '==', True) \
            .get()
        batch = db.batch()
        for doc in tokens_snap:
            batch.update(doc.reference, {'isValid': False})
        batch.commit()

        return {'message': 'Contraseña restablecida exitosamente'}
    
    def reactivate_account(self, email: str, password: str) -> Dict:
        user_doc = self._find_user_by_email(email)
        if not user_doc:
            raise ValueError('Credenciales invalidas')

        user_data = user_doc.to_dict()
        user_id = user_doc.id

        if user_data.get('userType') != 'reseller':
            raise ValueError('Solo los revendedores pueden reactivar su cuenta')

        if not bcrypt.checkpw(password.encode(), user_data['password'].encode()):
            raise ValueError('Credenciales invalidas')

        if user_data.get('isActive', True):
            raise ValueError('La cuenta ya esta activa')

        db.collection('users').document(user_id).update({
            'isActive': True,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        })

        db.collection('notifications').add({
            'userId': user_id,
            'type': 'account_reactivated',
            'title': 'Cuenta reactivada',
            'message': 'Tu cuenta ha sido reactivada exitosamente. Bienvenido de nuevo!',
            'data': {'reactivatedAt': firestore.SERVER_TIMESTAMP},
            'isRead': False,
            'createdAt': firestore.SERVER_TIMESTAMP,
        })

        access_token, refresh_token = self._generate_tokens(user_id, email, user_data['userType'])

        return {
            'message': 'Cuenta reactivada exitosamente',
            'token': access_token,
            'refreshToken': refresh_token,
            'user': {
                'userId': user_id,
                'email': user_data['email'],
                'firstName': user_data.get('firstName'),
                'lastName': user_data.get('lastName'),
                'userType': user_data.get('userType'),
            }
        }


auth_service = AuthService()
