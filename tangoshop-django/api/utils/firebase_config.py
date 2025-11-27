import os

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import auth, credentials, firestore, storage

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './serviceAccountKey.json')
        cred = credentials.Certificate(cred_path)

        firebase_admin.initialize_app(cred, {
            'storageBucket': f"{os.getenv('FIREBASE_PROJECT_ID')}.appspot.com"
        })

    return {
        'db': firestore.client(),
        'auth': auth,
        'storage': storage.bucket()
    }

firebase_app = initialize_firebase()
db = firebase_app['db']
auth_service = firebase_app['auth']
storage_bucket = firebase_app['storage']